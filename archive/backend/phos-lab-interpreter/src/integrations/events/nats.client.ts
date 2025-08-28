import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, JSONCodec, NatsConnection, headers } from 'nats';

@Injectable()
export class NatsClient implements OnModuleInit, OnModuleDestroy {
  private nc!: NatsConnection;
  private jc = JSONCodec();
  private logger = new Logger(NatsClient.name);
  async onModuleInit() {
    this.nc = await connect({ servers: process.env.NATS_URL });
    this.logger.log('Connected to NATS');
  }
  async onModuleDestroy() {
    await this.nc?.drain();
  }
  async publish<T extends { _meta?: { eventId?: string } }>(subject: string, payload: T, dedupKey?: string) {
    const h = headers();
    const key = dedupKey || payload?._meta?.eventId;
    if (key) h.set('Nats-Msg-Id', key);
    await this.nc.publish(subject, this.jc.encode(payload), { headers: h });
  }
}


