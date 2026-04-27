import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(data: any): string {
    return `Hello from Microservice 2! Received: ${JSON.stringify(data)}`;
  }
}
