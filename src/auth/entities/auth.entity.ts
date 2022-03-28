import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { UserModel } from '../../user/entities/user.entity';

export enum AuthType {
  EVMChain = 'AuthType::EVMChain',
  Solana = 'AuthType::Solana',
  Password = 'AuthType::Password',
}

export type WalletCredential = {
  walletAddress: string;
  signedData: string;
};

export type PasswordCredential = {
  passwordHash: string;
  algorithm: string;
};

export class Auth {
  public userId: string;
  public type: AuthType;
  public credentials: WalletCredential | PasswordCredential;
}

@Injectable()
@Schema()
export class AuthModel extends Auth {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: () => UserModel })
  userId: string;

  @Prop({ type: Object })
  credentials: WalletCredential | PasswordCredential;

  @Prop({ type: String, enum: AuthType })
  type: AuthType;
}

export const AuthSchema = SchemaFactory.createForClass(AuthModel);

export type AuthDocument = Auth & Document;
