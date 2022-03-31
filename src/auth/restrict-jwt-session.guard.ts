import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { UserDocument } from '../user/entities/user.entity';
import {
  AuthSessionDocument,
  SessionType,
} from './entities/auth-session.entity';

@Injectable()
export class RestrictJwtSessionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const sessionTypes = this.reflector.get<string[]>(
      'sessionType',
      context.getHandler(),
    ) as SessionType[];

    if (!sessionTypes) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { session } = request.user as {
      session: AuthSessionDocument;
      user: UserDocument;
    };

    return (
      sessionTypes.filter((sessionType) => sessionType === session.sessionType)
        .length > 0
    );
  }
}
