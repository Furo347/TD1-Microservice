import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

async function test() {
  const client = ClientProxyFactory.create({
    transport: Transport.NATS,
    options: {
      servers: ['nats://localhost:4222'],
    },
  });

  // Test ping to service 1
  const response1 = await client.send('ping', {}).toPromise();
  console.log('Response from Service 1:', response1);

  // Test communicate to service 1, which calls service 2
  const response2 = await client.send('communicate', {}).toPromise();
  console.log('Response from Service 1 communicating with Service 2:', response2);

  process.exit(0);
}

test();
