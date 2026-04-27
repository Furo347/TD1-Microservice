import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class AppService {
  private client: ClientProxy;

  constructor() {
    const natsServers = process.env.NATS_SERVERS || 'nats://localhost:4222';
    this.client = ClientProxyFactory.create({
      transport: Transport.NATS,
      options: {
        servers: [natsServers],
      },
    });
  }

  getHello(): string {
    return 'Hello World!';
  }

  async communicateWithService2(): Promise<string> {
    return this.client.send('hello', { message: 'Hello from Microservice 1' }).toPromise();
  }
}
