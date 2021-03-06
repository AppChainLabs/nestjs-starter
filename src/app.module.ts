import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { getMemoryServerMongoUri } from './helper';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // On top
    ConfigModule.forRoot(),

    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),

    // Then db
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const env = configService.get<string>('NODE_ENV');

        let uri;

        // if (env === 'test') uri = configService.get<string>('TEST_MONGO_URL');
        if (env === 'test') uri = await getMemoryServerMongoUri();
        else uri = configService.get<string>('MONGO_URL');

        return {
          uri,
        };
      },
      inject: [ConfigService],
    }),

    // Import other modules
    UserModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
