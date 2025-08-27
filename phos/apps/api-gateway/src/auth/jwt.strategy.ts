import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwksRsa from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const domain = process.env.IDP__DOMAIN;
    const issuer = process.env.IDP__ISSUER ?? (domain ? `https://${domain}/` : undefined);
    const audience = process.env.IDP__AUDIENCE;

    // If OIDC issuer/audience are configured, use JWKS; otherwise fall back to shared secret for dev
    if (issuer && audience) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        issuer,
        audience,
        algorithms: ['RS256'],
        secretOrKeyProvider: jwksRsa.passportJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: `${issuer}.well-known/jwks.json`,
        }) as any,
      });
    } else {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: process.env.JWT__SECRET ?? 'CHANGEME',
        issuer: process.env.JWT__ISSUER ?? 'phos',
        audience: process.env.JWT__AUDIENCE ?? 'phos',
      } as any);
    }
  }

  async validate(payload: any) {
    return { sub: payload.sub, roles: payload.roles ?? [] };
  }
}
