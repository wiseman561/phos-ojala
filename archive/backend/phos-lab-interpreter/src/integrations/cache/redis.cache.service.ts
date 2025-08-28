import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;
  onModuleInit() {
    this.client = new Redis({ host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT || 6379) });
  }
  onModuleDestroy() {
    this.client?.disconnect();
  }
  async get<T>(k: string): Promise<T | null> {
    const v = await this.client.get(k);
    return v ? JSON.parse(v) : null;
  }
  async set<T>(k: string, v: T, ttlSec = 300) {
    await this.client.set(k, JSON.stringify(v), 'EX', ttlSec);
  }
}


