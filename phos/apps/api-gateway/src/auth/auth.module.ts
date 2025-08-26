import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT__SECRET ?? 'CHANGEME',
      signOptions: {
        issuer: process.env.JWT__ISSUER ?? 'phos',
        audience: process.env.JWT__AUDIENCE ?? 'phos',
      },
    }),
  ],
  providers: [JwtStrategy],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
