import { ArrowFlightClient } from './index';

const options = {
  username: 'flight_username',
  password: 'testing123',
  tls: false,
  host: '127.0.0.1',
  port: 50051,
  headers: [],
};

const client = await ArrowFlightClient.fromOptions(options);
const tables = await client.getTables({ includeSchema: true });

console.info(tables.toArry());
