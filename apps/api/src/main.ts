import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  const origins = (process.env.CORS_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
  app.enableCors({ origin: origins.length ? origins : false, credentials: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const spec = new DocumentBuilder().setTitle('LifeBook API').setVersion('1.0').addBearerAuth().build();
  if (process.env.NODE_ENV !== 'production') SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, spec));
  await app.listen(Number(process.env.PORT ?? 4000), '0.0.0.0');
}
bootstrap();
