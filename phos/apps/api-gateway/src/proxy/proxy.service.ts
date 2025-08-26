import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as passport from 'passport';
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
      // Allow public access to health/info and swagger; require JWT for others
      app.use(path, (req, res, next) => {
        const url = req.url;
        if (
          url === '/healthz' ||
          url === '/info' ||
          url === '/api/info' ||
          url.startsWith('/swagger')
        ) {
          return next();
        }
        return passport.authenticate('jwt', { session: false })(req as any, res as any, next as any);
      });

      app.use(
        path,
        createProxyMiddleware({
          target,
          changeOrigin: true,
          secure: false,
          xfwd: true,
          pathRewrite: (pathReq) => {
            // Allow health and info through the gateway: /api/{svc}/healthz|info -> /healthz|/info
            if (pathReq === `${path}/healthz`) return '/healthz';
            if (pathReq === `${path}/info` || pathReq === `${path}/api/info`) return '/info';
            // Rewrite Swagger UI and JSON: /api/{svc}/swagger* -> /swagger*
            if (pathReq.startsWith(`${path}/swagger`)) {
              return pathReq.slice(path.length);
            }
            return pathReq;
          },
        }),
      );
    }
  }
}
