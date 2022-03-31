import { IsString } from 'class-validator';

export class PasswordCredentialAuthDto {
  @IsString()
  password: string;
}
