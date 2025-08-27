import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ProxyService } from './proxy/proxy.service';
import * as fs from 'fs';

async function bootstrap() {
  let httpsOptions: any | undefined;
  try {
    const pfxPath = process.env.HTTPS_PFX_PATH;
    const pfxPass = process.env.HTTPS_PFX_PASSWORD;
    const keyPath = process.env.HTTPS_KEY_PATH;
    const certPath = process.env.HTTPS_CERT_PATH;
    if (pfxPath && fs.existsSync(pfxPath)) {
      httpsOptions = { pfx: fs.readFileSync(pfxPath), passphrase: pfxPass };
    } else if (keyPath && certPath && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      httpsOptions = { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
    }
  } catch {}

  const app = await NestFactory.create(AppModule, httpsOptions ? { httpsOptions } : {});

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: any, res: any) => {
        const reset = (req as any).rateLimit?.resetTime as Date | undefined;
        if (reset) {
          const retryAfter = Math.max(0, Math.ceil((reset.getTime() - Date.now()) / 1000));
          res.set('Retry-After', String(retryAfter));
        }
        res.status(429).json({ error: 'Too Many Requests' });
      },
    }) as any,
  );

  // Enforce HTTPS at the edge: trust proxy and redirect when X-Forwarded-Proto is http
  (app as any).set('trust proxy', 1);
  app.use((req: any, res: any, next: any) => {
    const enforceHttps = (process.env.ENFORCE_HTTPS ?? 'true').toLowerCase() === 'true';
    if (enforceHttps && req.headers['x-forwarded-proto'] === 'http') {
      const host = req.headers.host;
      const url = 'https://' + host + req.originalUrl;
      return res.redirect(308, url);
    }
    return next();
  });

  const config = new DocumentBuilder()
    .setTitle('PHOS API Gateway')
    .setVersion(process.env.BUILD_VERSION ?? '0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const proxy = app.get(ProxyService);
  proxy.configure(app);

  const port = Number(process.env.GATEWAY__PORT ?? 8080);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
