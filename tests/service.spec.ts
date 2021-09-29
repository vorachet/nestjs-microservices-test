// Files that will be created based on this template will need to be saved in tests folder
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientsModule, Transport, ClientProxy } from '@nestjs/microservices';
import { ProxyModule } from '../proxy.module';
import { Observable } from 'rxjs';

const TESTER_PORT = 8005
const SERVICE_TO_BE_TESTED = {
  name: 'A_SERVICE',
  host: '0.0.0.0',
  port: 8004
}

describe(`Functions of ${SERVICE_TO_BE_TESTED.name} (e2e)`, () => {
  let app: INestApplication;
  let client: ClientProxy;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ProxyModule,
        ClientsModule.register([
          {
            name: SERVICE_TO_BE_TESTED.name, transport: Transport.TCP, options: {
              host: SERVICE_TO_BE_TESTED.host,
              port: SERVICE_TO_BE_TESTED.port,
            },
          },
        ]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.connectMicroservice({
      transport: Transport.TCP,
      options: { port: TESTER_PORT },
    });

    await app.startAllMicroservices();
    await app.init();

    client = app.get(SERVICE_TO_BE_TESTED.name);
    await client.connect();
  });

  afterAll(async () => {
    await app.close();
    client.close();
  });

  const DATASET = [{
    name: 'Test1',
    expectedStatusName: 'status',
    expectedStatusValue: 202,
    command: 'command',
    payload: {}
  }]

  it(DATASET[0].name, done => {
    const response: Observable<any> = client.send(DATASET[0].command, DATASET[0].payload)
    response.subscribe(json => {
      expect(json[DATASET[0].expectedStatusName]).toBe(DATASET[0].expectedStatusValue);
      done();
    });
  });

});
