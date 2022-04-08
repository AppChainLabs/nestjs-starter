import { NestFactory } from '@nestjs/core';
import { contentParser } from 'fastify-multer';
import helmet from 'fastify-helmet';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

import { AllExceptionsFilter } from './exception.filter';
import { AppModule } from './app.module';

const createMainAppHandler = async (module, adapter) => {
  return NestFactory.create<NestFastifyApplication>(module, adapter);
};

export const globalApply = (app) => {
  // inject pipe
  app.setGlobalPrefix('api/');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  try {
    app.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
        },
      },
    });
    app.register(contentParser);
  } catch {}
};

async function bootstrap() {
  const CORS_OPTIONS = {
    origin: ['*'], // or '*' or whatever is required
    allowedHeaders: [
      'Access-Control-Allow-Origin',
      'Origin',
      'X-Requested-With',
      'Accept',
      'Content-Type',
      'Authorization',
    ],
    preflightContinue: true,
    credentials: true,
    methods: ['GET', 'PUT', 'OPTIONS', 'POST', 'DELETE'],
  };

  const adapter = new FastifyAdapter();
  adapter.enableCors(CORS_OPTIONS);

  const app = await createMainAppHandler(AppModule, adapter);

  globalApply(app);

  if (process.env.NODE_ENV !== 'test') {
    const config = new DocumentBuilder()
      .setTitle('A8 Broker API')
      .setDescription('Todo: update description')
      .setVersion('1.0')
      .addTag('Ancient8')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
    });

    SwaggerModule.setup('api', app, document);

    if (process.env.NODE_ENV === 'production') {
      await app.listen(process.env.PORT || 5000, process.env.HOST || '0.0.0.0');
    } else {
      await app.listen(process.env.PORT || 5000);
    }
  }

  return app;
}

bootstrap();
