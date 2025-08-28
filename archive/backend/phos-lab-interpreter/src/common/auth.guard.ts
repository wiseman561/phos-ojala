import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.headers['x-service-token'] || req.headers['authorization']?.replace('Bearer ', '');
    if (!token || token !== process.env.SERVICE_TOKEN) {
      throw new UnauthorizedException('Invalid or missing service token');
    }
    return true;
  }
}


