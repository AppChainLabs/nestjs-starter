import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as ms from 'ms';

import { CreateAuthDto } from './dto/create-auth.dto';
import { UserService } from '../user/user.service';
import { RegistrationAuthDto } from './dto/registration-auth.dto';
import {
  AuthDocument,
  AuthModel,
  AuthType,
  HashingAlgorithm,
  PasswordCredential,
  WalletCredential,
} from './entities/auth.entity';
import { UserDocument, UserRole } from '../user/entities/user.entity';
import { HashingService } from '../providers/hashing';
import { SignatureService } from '../providers/signature';
import { WalletCredentialAuthDto } from './dto/wallet-credential-auth.dto';
import { PasswordCredentialAuthDto } from './dto/password-credential-auth.dto';
import { Jwt } from '../providers/jwt';
import { JwtPayload, JwtSignedData } from './dto/jwt-auth.dto';
import {
  AuthSessionDocument,
  AuthSessionModel,
  GrantType,
  SessionType,
} from './entities/auth-session.entity';
import {
  AuthChallengeDocument,
  AuthChallengeModel,
} from './entities/auth-challenge.entity';
import { Otp } from '../providers/otp';
import { ConnectEmailAuthDto } from './dto/connect-email-auth.dto';
import { Email, EmailTemplate } from '../providers/email';
import { EmailVerifyOtpAuthDto } from './dto/email-verify-otp-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    // inject connection
    @InjectConnection() private readonly connection: mongoose.Connection,

    // inject model
    @InjectModel(AuthModel.name)
    private AuthDocument: Model<AuthDocument>,

    // inject model
    @InjectModel(AuthSessionModel.name)
    private AuthSessionDocument: Model<AuthSessionDocument>,

    // inject model
    @InjectModel(AuthChallengeModel.name)
    private AuthChallengeDocument: Model<AuthChallengeDocument>,

    // inject service
    private userService: UserService,

    // inject hashing service
    private hashingService: HashingService,

    // inject jwt service
    private jwtService: JwtService,

    // inject jwt options
    private jwtOptions: Jwt,

    private otp: Otp,

    private emailService: Email,
  ) {}

  private async generateChecksum(data: any) {
    return this.hashingService
      .getHasher(HashingAlgorithm.BCrypt)
      .hash(JSON.stringify(data));
  }

  async generateOtp(target: string) {
    const authChallenge = await this.generateAuthChallenge(target);
    return this.otp.generateToken(authChallenge.message);
  }

  async sendEmailVerification(email: string) {
    await this.userService.validateEmailOrUsername(email);

    const otp = await this.generateOtp(email);

    return this.emailService.sendEmail<EmailVerifyOtpAuthDto>(
      EmailTemplate.VERIFY_EMAIL_OTP,
      { token: otp },
      [email],
      [],
    );
  }

  async connectEmail(userId: string, connectEmailDto: ConnectEmailAuthDto) {
    const user = await this.userService.findById(userId);
    const latestAuthChallenge = await this.AuthChallengeDocument.findOne({
      target: connectEmailDto.email,
      isResolved: false,
    });

    if (
      !latestAuthChallenge ||
      !this.otp.verify(connectEmailDto.token, latestAuthChallenge.message)
    ) {
      throw new BadRequestException('AUTH::INVALID_OTP');
    }

    let response;
    const session = await this.connection.startSession();

    await session.withTransaction(async () => {
      latestAuthChallenge.isResolved = true;
      await latestAuthChallenge.save();

      user.email = connectEmailDto.email;
      response = await user.save();
    });

    await session.endSession();
    return response;
  }

  async generateAuthChallenge(target: string) {
    const checksum = await this.generateChecksum(target);

    const currentDateTime = new Date();
    const expiredDate = currentDateTime.setTime(
      currentDateTime.getTime() + 60 * 1000,
    );

    const message = `Sign in with ${target}.\nChallenge hash: ${checksum}.\nDate: ${currentDateTime.toISOString()}.`;

    const authChallenge = new this.AuthChallengeDocument({
      target,
      expiredDate: expiredDate,
      message: message,
      isResolved: false,
    });

    return authChallenge.save();
  }

  async generateAccessToken(
    audience: string,
    { authEntity, user }: { authEntity: AuthDocument; user: UserDocument },
    sessionType = SessionType.Auth,
  ) {
    const payload = {
      signedData: {
        uid: user.id,
        em: user.email,
        un: user.username,
        scope: user.roles,
        verified: user.isEmailVerified,
        enabled: user.isEnabled,
        sessionType,
        authType: authEntity.type,
      },
    } as JwtSignedData;

    const checksum = await this.generateChecksum(payload);

    const duration = Number(ms(this.jwtOptions.getSignInOptions().expiresIn));
    const sessionExpiresAt = new Date(new Date().getTime() + duration);

    const sessionObj = new this.AuthSessionDocument({
      authId: authEntity.id,
      authorizerId: user.id,
      userId: user.id,
      grantType: GrantType.Self,
      checksum,
      sessionType,
      expiresAt: sessionExpiresAt,
    });

    const session = await sessionObj.save();

    const tokenIdentity = {
      typ: 'Bearer',
      azp: authEntity.id,
      acr: '1',
      sid: session.id,
    };

    return {
      accessToken: this.jwtService.sign(
        { ...payload, ...tokenIdentity } as JwtPayload,
        {
          ...this.jwtOptions.getSignInOptions(audience),
          subject: session.checksum,
          jwtid: session.id,
        },
      ),
    };
  }

  findWalletAuthEntity(walletAddress: string) {
    return this.AuthDocument.findOne({
      'credential.walletAddress': walletAddress,
    });
  }

  findAuthEntityWithUserId(
    authType: AuthType,
    userId: string,
    walletAddress = undefined,
  ) {
    return this.AuthDocument.findOne({
      type: authType,
      userId,
      'credential.walletAddress':
        authType === AuthType.Password ? undefined : walletAddress,
    });
  }

  // weird bug from Jetbrains
  findAuthSessionById(authSessionId: string): any {
    return this.AuthSessionDocument.findById(authSessionId);
  }

  findAuthChallengeById(id: string) {
    return this.AuthChallengeDocument.findById(id);
  }

  findAuthChallengesByTarget(target: string) {
    return this.AuthChallengeDocument.find({ target });
  }

  async verifyWalletSignature(
    authType: AuthType,
    walletCredentialDto: WalletCredentialAuthDto,
    walletCredential: WalletCredential,
  ) {
    // Check for valid auth challenge
    const authChallenge = await this.findAuthChallengeById(
      walletCredentialDto.authChallengeId,
    );

    if (!authChallenge) {
      return false;
    }

    if (authChallenge.isResolved) {
      return false;
    }

    if (new Date().getTime() > new Date(authChallenge.expiredDate).getTime()) {
      return false;
    }

    if (walletCredentialDto.walletAddress !== authChallenge.target) {
      return false;
    }

    if (walletCredentialDto.walletAddress !== walletCredential.walletAddress) {
      return false;
    }

    const signer = new SignatureService().getSigner(authType);
    const isVerified = signer.verify(
      authChallenge.message,
      walletCredentialDto.signedData,
      walletCredential.walletAddress,
    );

    if (isVerified) {
      // now to mark the challenge resolved
      authChallenge.isResolved = true;
      await authChallenge.save();
    }

    return isVerified;
  }

  async signUpUser(registrationDto: RegistrationAuthDto) {
    let user;

    if (
      registrationDto.type === AuthType.Password &&
      (!registrationDto.email || !registrationDto.username)
    ) {
      throw new BadRequestException('AUTH::CREATE::CREDENTIAL_NOT_PROVIDED');
    }

    const session = await this.connection.startSession();
    await session.withTransaction(async () => {
      // create user first
      user = await this.userService.create({
        username: registrationDto.username,
        email: registrationDto.email,
        displayName: registrationDto.displayName,
        avatar: registrationDto.avatar,
        isEnabled: true,
        isEmailVerified: false,
        roles: [UserRole.User],
      });

      // then create auth entity
      await this.createAuthEntity(
        {
          type: registrationDto.type,
          credential: registrationDto.credential,
          userId: user.id,
        },
        true,
      );
    });

    await session.endSession();
    return user;
  }

  async createAuthEntity(createAuthDto: CreateAuthDto, isPrimary = false) {
    let credentialData;

    if (createAuthDto.type === AuthType.Password) {
      const credentialDto =
        createAuthDto.credential as PasswordCredentialAuthDto;

      if (!credentialDto.password) {
        throw new BadRequestException('AUTH::CREATE::CREDENTIAL_NOT_PROVIDED');
      }

      if (
        await this.AuthDocument.findOne({
          userId: createAuthDto.userId,
          type: createAuthDto.type,
        })
      )
        throw new ConflictException(`AUTH::CREATE::DUPLICATED_ENTITIES`);

      credentialData = {
        password: await this.hashingService
          .getHasher(HashingAlgorithm.BCrypt)
          .hash(credentialDto.password),

        algorithm: HashingAlgorithm.BCrypt,
      } as PasswordCredential;
    } else {
      const credentialDto = createAuthDto.credential as WalletCredentialAuthDto;

      if (
        await this.AuthDocument.findOne({
          'credential.walletAddress': credentialDto.walletAddress,
        })
      )
        throw new ConflictException(`AUTH::CREATE::DUPLICATED_WALLET`);

      const isCredentialVerified = await this.verifyWalletSignature(
        createAuthDto.type,
        credentialDto,
        {
          walletAddress: credentialDto.walletAddress,
        },
      );

      if (!isCredentialVerified) {
        throw new BadRequestException('AUTH::CREATE::SIGNATURE_NOT_MATCHED');
      }

      credentialData = {
        walletAddress: credentialDto.walletAddress,
      };
    }

    const authDocument = new this.AuthDocument({
      userId: createAuthDto.userId,
      credential: credentialData,
      type: createAuthDto.type,
      isPrimary,
    });

    return authDocument.save();
  }
}
