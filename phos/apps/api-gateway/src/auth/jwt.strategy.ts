import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT__SECRET ?? 'dev',
      issuer: process.env.JWT__ISSUER ?? 'phos',
      audience: process.env.JWT__AUDIENCE ?? 'phos',
    });
  }

  async validate(payload: any) {
    return { sub: payload.sub, roles: payload.roles ?? [] };
  }
}
