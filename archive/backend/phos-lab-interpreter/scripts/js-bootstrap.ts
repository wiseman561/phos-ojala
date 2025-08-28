import { connect, StringCodec, JsMsg } from 'nats';

async function main() {
  const nc = await connect({ servers: process.env.NATS_URL || 'nats://localhost:4222' });
  const jsm = await nc.jetstreamManager();

  // Stream
  await jsm.streams.add({
    name: 'phos.labs.v1',
    subjects: ['phos.labs.interpreted.v1'],
    retention: 'workqueue',
    num_replicas: 2,
    max_age: 30 * 24 * 60 * 60 * 1_000_000_000 // 30d in ns
  }).catch(() => {});

  // Consumers
  const consumers = ['nutritionkit-int', 'careplan-int', 'alerts-int'];
  for (const c of consumers) {
    await jsm.consumers.add('phos.labs.v1', {
      durable_name: c,
      ack_policy: 'explicit',
      max_deliver: 10,
      backoff: [1_000_000_000, 5_000_000_000, 30_000_000_000, 300_000_000_000]
    }).catch(() => {});
  }

  console.log('JetStream bootstrap complete');
  await nc.close();
}

main().catch((e) => { console.error(e); process.exit(1); });


