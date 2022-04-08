import { Injectable } from '@nestjs/common';
import NodeMailer from 'nodemailer';
import * as EmailInstance from 'email-templates';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import JSONTransport from 'nodemailer/lib/json-transport';

export enum EmailTemplate {
  VERIFY_EMAIL_OTP = 'verify-email-otp',
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
        from: this.configService.get<string>('SMTP_EMAIL_FROM_EMAIL'),
        sender: this.configService.get<string>('SMTP_EMAIL_FROM_EMAIL_NAME'),
        replyTo: this.configService.get<string>('SMTP_EMAIL_FROM_EMAIL'),
        inReplyTo: this.configService.get<string>('SMTP_EMAIL_FROM_EMAIL'),
      },
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
}
