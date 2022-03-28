import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
  );

  const config = new DocumentBuilder()
    .setTitle('A8 Broker API')
    .setDescription('Todo: update description')
    .setVersion('1.0')
    .addTag('Ancient8')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  SwaggerModule.setup('api', app, document);

  if (process.env.NODE_ENV === 'production') {
    await app.listen(process.env.PORT || 5001, process.env.HOST || '0.0.0.0');
  } else {
    await app.listen(process.env.PORT || 5001);
  }
}
bootstrap();
