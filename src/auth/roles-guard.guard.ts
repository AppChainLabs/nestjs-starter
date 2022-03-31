import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { UserDocument } from '../user/entities/user.entity';
import { AuthSessionDocument } from './entities/auth-session.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const session = request.user as {
      session: AuthSessionDocument;
      user: UserDocument;
    };

    return (
      roles.filter((role) => session.user.roles.indexOf(role) !== -1).length > 0
    );
  }
}
