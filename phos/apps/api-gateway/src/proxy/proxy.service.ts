import { Injectable } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Injectable()
export class ProxyService {
  configure(app: INestApplication) {
    const mappings: { path: string; target?: string }[] = [
      { path: '/api/labs', target: process.env.LAB_INTERPRETER__URL },
      { path: '/api/nutrition', target: process.env.NUTRITION_KIT__URL },
      { path: '/api/genome', target: process.env.GENOME_KIT__URL },
      { path: '/api/microbiome', target: process.env.MICROBIOME_KIT__URL },
      { path: '/api/sleep', target: process.env.SLEEP_KIT__URL },
      { path: '/api/core', target: process.env.PHOS_CORE__URL },
    ];

    for (const { path, target } of mappings) {
      if (!target) continue;
      app.use(
        path,
        createProxyMiddleware({
          target,
          changeOrigin: true,
          secure: false,
          xfwd: true,
          pathRewrite: { [`^${path}`]: '' },
          logLevel: 'warn',
        }),
      );
    }
  }
}
