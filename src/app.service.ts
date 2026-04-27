import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class AppService {
  private client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.NATS,
      options: {
        servers: ['nats://localhost:4222'],
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
