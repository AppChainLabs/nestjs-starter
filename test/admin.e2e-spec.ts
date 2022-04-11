import * as request from 'supertest';
import mongoose from 'mongoose';
import { HttpStatus } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';

import { testHelper } from './test-entrypoint.e2e-spec';
import { CreateUserDto } from '../src/user/dto/create-user.dto';
import { UserModel, UserRole } from '../src/user/entities/user.entity';
import { UpdateUserDto } from '../src/user/dto/update-user.dto';
import { AuthModel } from '../src/auth/entities/auth.entity';

describe('[admin] admin management tests (e2e)', () => {
  it('should create user successfully', async () => {
    const app = testHelper.app;
    const adminUser = testHelper.userAuthAdmin;

    const newUserPayload = {
      email: 'usercreated@byadmin.org',
      roles: [UserRole.User],
      isEnabled: true,
      isEmailVerified: true,
    } as CreateUserDto;

    const createUserResponse = await request(app.getHttpServer())
      .post('/api/admin/user')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminUser.accessToken}`)
      .send(newUserPayload);

    expect(createUserResponse.statusCode).toEqual(HttpStatus.CREATED);
    expect(createUserResponse.body._id).toBeTruthy();
    expect(createUserResponse.body.email).toEqual(newUserPayload.email);
  });

  it('should update user successfully', async () => {
    const app = testHelper.app;
    const adminUser = testHelper.userAuthAdmin;
    const passwordAuthUser = testHelper.passwordAuthUser;

    const updateUserPayload = {
      username: 'UserNameUpdatedByAdmin',
      roles: [UserRole.User, UserRole.SystemAdmin],
    } as UpdateUserDto;

    const updateUserResponse = await request(app.getHttpServer())
      .patch(`/api/admin/user/${passwordAuthUser.userId}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminUser.accessToken}`)
      .send(updateUserPayload);

    expect(updateUserResponse.statusCode).toEqual(HttpStatus.OK);
    expect(updateUserResponse.body._id).toBeTruthy();
    expect(updateUserResponse.body.username).toEqual(
      updateUserPayload.username,
    );
    expect(updateUserResponse.body.roles).toEqual(updateUserPayload.roles);
  });

  it('should read user successfully', async () => {
    const app = testHelper.app;
    const adminUser = testHelper.userAuthAdmin;
    const passwordAuthUser = testHelper.passwordAuthUser;

    const updateUserResponse = await request(app.getHttpServer())
      .get(`/api/admin/user/${passwordAuthUser.userId}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminUser.accessToken}`)
      .send();

    expect(updateUserResponse.statusCode).toEqual(HttpStatus.OK);
    expect(updateUserResponse.body._id).toBeTruthy();
    expect(updateUserResponse.body._id).toEqual(passwordAuthUser.userId);
  });

  it('should query user successfully', async () => {
    const app = testHelper.app;
    const adminUser = testHelper.userAuthAdmin;
    const passwordAuthUser = testHelper.passwordAuthUser;

    let queryUserResponse = await request(app.getHttpServer())
      .get(`/api/admin/user/?query=${passwordAuthUser.userId}&skip=0&limit=1`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminUser.accessToken}`)
      .send(); // will return 0 records

    expect(queryUserResponse.statusCode).toEqual(HttpStatus.OK);
    expect(queryUserResponse.body.length).toEqual(0);

    queryUserResponse = await request(app.getHttpServer())
      .get(`/api/admin/user/?query=${passwordAuthUser.email}&skip=0&limit=1`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminUser.accessToken}`)
      .send(); // will return 1 records

    expect(queryUserResponse.statusCode).toEqual(HttpStatus.OK);
    expect(queryUserResponse.body.length).toEqual(1);
    expect(queryUserResponse.body[0]._id).toBeTruthy();
    expect(queryUserResponse.body[0]._id).toEqual(passwordAuthUser.userId);
  });

  it('should get auth entities successfully', async () => {
    const app = testHelper.app;
    const adminUser = testHelper.userAuthAdmin;
    const passwordAuthUser = testHelper.passwordAuthUser;

    const RefAuthDocument = testHelper.getModule<mongoose.Model<AuthModel>>(
      getModelToken(AuthModel.name),
    );

    const authEntities = await RefAuthDocument.find({
      userId: passwordAuthUser.userId,
    });

    const queryUserResponse = await request(app.getHttpServer())
      .get(`/api/admin/user/${passwordAuthUser.userId}/auth-entities`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminUser.accessToken}`)
      .send();

    expect(queryUserResponse.statusCode).toEqual(HttpStatus.OK);
    expect(queryUserResponse.body.length).toEqual(authEntities.length);
  });

  it('should set primary auth entity successfully', async () => {
    const app = testHelper.app;
    const adminUser = testHelper.userAuthAdmin;
    const passwordAuthUser = testHelper.passwordAuthUser;

    const RefAuthDocument = testHelper.getModule<mongoose.Model<AuthModel>>(
      getModelToken(AuthModel.name),
    );

    const authEntities = await RefAuthDocument.find({
      userId: passwordAuthUser.userId,
    });

    expect(authEntities[0].isPrimary).toEqual(false);

    const updateResponse = await request(app.getHttpServer())
      .post(
        `/api/admin/user/${passwordAuthUser.userId}/auth-entities/${authEntities[0]._id}/make-primary`,
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminUser.accessToken}`)
      .send();

    expect(updateResponse.statusCode).toEqual(HttpStatus.OK);
    expect(updateResponse.body._id).toEqual(authEntities[0]._id.toString());
    expect(updateResponse.body.isPrimary).toEqual(true);

    const primaryAuthEntities = await RefAuthDocument.find({
      userId: passwordAuthUser.userId,
      isPrimary: true,
    });

    expect(primaryAuthEntities.length).toEqual(1);
    expect(primaryAuthEntities[0]._id.toString()).toEqual(
      authEntities[0]._id.toString(),
    );
  });

  it('should fail if try to delete primary auth entity', async () => {
    const app = testHelper.app;
    const adminUser = testHelper.userAuthAdmin;
    const passwordAuthUser = testHelper.passwordAuthUser;

    const RefAuthDocument = testHelper.getModule<mongoose.Model<AuthModel>>(
      getModelToken(AuthModel.name),
    );

    const primaryAuthEntities = await RefAuthDocument.find({
      userId: passwordAuthUser.userId,
      isPrimary: true,
    });

    expect(primaryAuthEntities[0].isPrimary).toEqual(true);

    const updateResponse = await request(app.getHttpServer())
      .delete(
        `/api/admin/user/${passwordAuthUser.userId}/auth-entities/${primaryAuthEntities[0]._id}`,
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminUser.accessToken}`)
      .send();

    expect(updateResponse.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it('should delete non-primary auth entity successfully', async () => {
    const app = testHelper.app;
    const adminUser = testHelper.userAuthAdmin;
    const passwordAuthUser = testHelper.passwordAuthUser;

    const RefAuthDocument = testHelper.getModule<mongoose.Model<AuthModel>>(
      getModelToken(AuthModel.name),
    );

    const authEntities = await RefAuthDocument.find({
      userId: passwordAuthUser.userId,
      isPrimary: false,
    });

    expect(authEntities[0].isPrimary).toEqual(false);

    const updateResponse = await request(app.getHttpServer())
      .delete(
        `/api/admin/user/${passwordAuthUser.userId}/auth-entities/${authEntities[0]._id}`,
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminUser.accessToken}`)
      .send();

    expect(updateResponse.statusCode).toEqual(HttpStatus.NO_CONTENT);
    expect(await RefAuthDocument.findById(authEntities[0]._id)).toBeFalsy();
  });

  it('should delete user successfully', async () => {
    const app = testHelper.app;
    const adminUser = testHelper.userAuthAdmin;

    const RefUserDocument = testHelper.getModule<mongoose.Model<UserModel>>(
      getModelToken(UserModel.name),
    );

    const authUser = await RefUserDocument.findOne({
      email: 'usercreated@byadmin.org',
    });

    expect(authUser).toBeTruthy();

    const updateResponse = await request(app.getHttpServer())
      .delete(`/api/admin/user/${authUser.id}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminUser.accessToken}`)
      .send();

    expect(updateResponse.statusCode).toEqual(HttpStatus.NO_CONTENT);
    expect(await RefUserDocument.findById(authUser.id)).toBeFalsy();
  });
});
