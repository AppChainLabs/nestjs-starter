import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Injectable } from '@nestjs/common';

export class AuthChallenge {
  public target: string;
  public message: string;
  public expiredDate: string;
  public isResolved: boolean;
}

@Injectable()
@Schema({ timestamps: true, autoIndex: true })
export class AuthChallengeModel implements AuthChallenge {
  @Prop({ type: String })
  target: string;

  @Prop({ type: String })
  message: string;

  @Prop({ type: Date })
  expiredDate: string;

  @Prop({ type: Boolean })
  isResolved: boolean;
}

export const AuthChallengeSchema =
  SchemaFactory.createForClass(AuthChallengeModel);

AuthChallengeSchema.index({ target: 1 });

export type AuthChallengeDocument = AuthChallenge & Document;
