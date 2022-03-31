import { Injectable } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

import { UserModel } from '../../user/entities/user.entity';
import { AuthModel } from './auth.entity';

export enum GrantType {
  ServiceClient = 'GRANT_TYPE::SERVICE_CLIENT',
  Self = 'GRANT_TYPE::SELF',
}

export enum SessionType {
  Auth = 'SESSION_TYPE::AUTH',
  ResetCredential = 'SESSION_TYPE::RESET_CREDENTIAL',
}

class AuthSession {
  authorizerId: string; // userId or anything id
  grantType: GrantType;
  userId: string;
  authId: string;
  checksum: string;
  sessionType: SessionType;
  expiresIn: string;
}

@Injectable()
@Schema({ timestamps: true, autoIndex: true })
export class AuthSessionModel implements AuthSession {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: () => UserModel })
  readonly userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: () => AuthModel })
  readonly authId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  readonly authorizerId: string;

  @Prop({ type: String })
  readonly checksum: string;

  @Prop({ type: String, enum: GrantType, default: GrantType.Self })
  readonly grantType: GrantType;

  @Prop({ type: String, enum: SessionType, default: SessionType.Auth })
  readonly sessionType: SessionType;

  @Prop({ type: String })
  readonly expiresIn: string;
}

export const AuthModelSchema = SchemaFactory.createForClass(AuthSessionModel);
AuthModelSchema.index({ authorizerId: 1 });
AuthModelSchema.index({ userId: 1 });
AuthModelSchema.index({ authId: 1 });
AuthModelSchema.index({ checksum: 1 }, { unique: true });

export type AuthSessionDocument = AuthSession & Document;
