import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Injectable } from '@nestjs/common';

export class User {
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  roles: string[];
  isEmailVerified: boolean;
  isEnabled: boolean;
}

export enum UserRole {
  User = 'UserRole::User',
  SystemAdmin = 'UserRole::SystemAdmin',
}

@Injectable()
@Schema({ timestamps: true })
export class UserModel implements User {
  @Prop({ unique: true, isRequired: false })
  username: string;

  @Prop({ unique: true, isRequired: false })
  email: string;

  @Prop()
  displayName: string;

  @Prop()
  avatar: string;

  @Prop({ type: Array, enum: UserRole, default: [UserRole.User] })
  roles: string[];

  @Prop()
  isEmailVerified: boolean;

  @Prop()
  isEnabled: boolean;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);

export type UserDocument = User & Document;
