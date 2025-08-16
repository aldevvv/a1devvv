import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Increase body size limit for file uploads
    bodyParser: true,
    rawBody: true,
  });

  // Configure body parsing limits for file uploads
  app.use('/user/profile-image', (req: any, res: any, next: any) => {
    // Increase limit for file upload endpoint specifically
    req.setTimeout(60000); // 60 seconds timeout
    next();
  });

  // Security
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        imgSrc: [`'self'`, 'data:', 'https:'],
      },
    },
  }));
  
  app.enableCors({
    origin: [process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  app.use(cookieParser());
  
  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
