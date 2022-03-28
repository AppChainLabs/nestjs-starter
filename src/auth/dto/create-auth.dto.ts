import { PartialType } from '@nestjs/swagger';
import { Auth } from '../entities/auth.entity';

export class CreateAuthDto extends PartialType(Auth) {}
