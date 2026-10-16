import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { encryptReflection } from './security/reflection-crypto';

async function bootstrap() {
  const logger = new Logger('LifeBook');
  if (process.env.NODE_ENV === 'production') {
    // Reject an incomplete rollout before accepting private reflection writes.
    encryptReflection('', 'configuration-check');
  }

  const app = await NestFactory.create(AppModule);

  const proxyHops = Number(process.env.TRUST_PROXY_HOPS || '0');
  if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 3) throw new Error('TRUST_PROXY_HOPS must be between 0 and 3');
  app.getHttpAdapter().getInstance().set('trust proxy', proxyHops || false);

  // API version prefix
  app.setGlobalPrefix('api/v1');

  // Allowed frontend origins
  const defaultOrigins = [
    'https://lifebook-inky.vercel.app',
    'https://lifebook-marketing.vercel.app',
  ];

  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowedOrigins = [
    ...new Set([...defaultOrigins, ...configuredOrigins]),
  ];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });

  // Global request validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LifeBook API')
    .setDescription('LifeBook Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  if (process.env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      swaggerConfig,
    );

    SwaggerModule.setup('api/docs', app, document);
  }

  // Render port configuration
  const port = Number(process.env.PORT || 4000);

  await app.listen(port, '0.0.0.0');

  logger.log(`LifeBook API running on port ${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('LifeBook API failed to start:', error);
  process.exit(1);
});