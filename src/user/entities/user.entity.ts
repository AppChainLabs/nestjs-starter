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
@Schema({ timestamps: true, autoIndex: true })
export class UserModel implements User {
  @Prop({ type: String })
  username: string;

  @Prop({ type: String })
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

UserSchema.index({ username: 1 }, { unique: true, sparse: true });
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ createdAt: 1, email: 1, username: 1, displayName: 1 }); // for querying in the admin site

export type UserDocument = User & Document;
