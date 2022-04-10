import { Injectable } from '@nestjs/common';
import * as NodeMailer from 'nodemailer';
import * as EmailInstance from 'email-templates';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import JSONTransport from 'nodemailer/lib/json-transport';
import {
  ConnectWalletViaEmailDto,
  EmailVerifyOtpAuthDto,
} from '../auth/dto/email-verify-otp-auth.dto';

export enum EmailTemplate {
  VERIFY_EMAIL_OTP = 'verify-email-otp',
  CONNECT_WALLET_VIA_EMAIL = 'connect-wallet-via-email',
}

@Injectable()
export class Email {
  constructor(private configService: ConfigService) {}

  private getTransporter() {
    if (this.configService.get<string>('NODE_ENV') === 'test') {
      return {
        jsonTransport: true,
      } as JSONTransport.Options;
    }

    return NodeMailer.createTransport({
      host: this.configService.get<string>('SMTP_EMAIL_HOST'),
      port: Number(this.configService.get<string>('SMTP_EMAIL_PORT')),
      secure: Boolean(this.configService.get<string>('SMTP_EMAIL_TLS_ENABLED')), // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_EMAIL_USERNAME'), // generated ethereal user
        pass: this.configService.get<string>('SMTP_EMAIL_PASSWORD'), // generated ethereal password
      },
    });
  }

  sendEmail<T>(
    templateName: EmailTemplate,
    context: T,
    sendTo: string[],
    attachments: any[] = [],
  ) {
    const emailInstance = new EmailInstance({
      message: {
        from: `${this.configService.get<string>(
          'SMTP_EMAIL_FROM_EMAIL_NAME',
        )} <${this.configService.get<string>('SMTP_EMAIL_FROM_EMAIL')}>`,
        sender: this.configService.get<string>('SMTP_EMAIL_FROM_EMAIL'),
        replyTo: this.configService.get<string>('SMTP_EMAIL_FROM_EMAIL'),
        inReplyTo: this.configService.get<string>('SMTP_EMAIL_FROM_EMAIL'),
      },
      send: true,
      transport: this.getTransporter(),
    });

    return emailInstance.send({
      template: path.join(
        __dirname,
        '../assets/email-templates/',
        templateName,
      ),
      message: {
        to: sendTo,
        attachments,
      },
      locals: context as any,
    });
  }

  async sendVerificationEmail(context: { token: string }, email: string) {
    await this.sendEmail<EmailVerifyOtpAuthDto>(
      EmailTemplate.VERIFY_EMAIL_OTP,
      context,
      [email],
      [],
    );
  }

  async sendConnectWalletEmail(
    context: { email: string; connectWalletLink: string },
    email: string,
  ) {
    const res = await this.sendEmail<ConnectWalletViaEmailDto>(
      EmailTemplate.CONNECT_WALLET_VIA_EMAIL,
      context,
      [email],
      [],
    );

    console.log({res});
  }
}
