import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { UserModel } from '../../user/entities/user.entity';

export enum AuthType {
  EVMChain = 'AUTH_TYPE::EVM_CHAIN',
  Solana = 'AUTH_TYPE::SOLANA',
  Password = 'AUTH_TYPE::PASSWORD',
}

export enum HashingAlgorithm {
  BCrypt = 'HASH_ALGO::BCRYPT',
}

export type WalletCredential = {
  walletAddress: string;
};

export type PasswordCredential = {
  password: string;
  algorithm: HashingAlgorithm;
};

export class Auth {
  public userId: string;
  public type: AuthType;
  public credential: WalletCredential | PasswordCredential;
}

@Injectable()
@Schema({ timestamps: true, autoIndex: true })
export class AuthModel extends Auth {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: () => UserModel })
  userId: string;

  @Prop({ type: Object })
  credential: WalletCredential | PasswordCredential;

  @Prop({ type: String, enum: AuthType })
  type: AuthType;
}

export const AuthSchema = SchemaFactory.createForClass(AuthModel);
AuthSchema.index({ type: 1, userId: 1, credential: 1 }, { unique: true });

export type AuthDocument = Auth & Document;
