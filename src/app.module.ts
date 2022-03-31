import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { getMemoryServerMongoUri } from './helper';

@Module({
  imports: [
    // On top
    ConfigModule.forRoot(),

    // Then db
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const env = configService.get<string>('NODE_ENV');

        let uri;

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
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
