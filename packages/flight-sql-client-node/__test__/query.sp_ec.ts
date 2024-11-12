import { tableFromIPC } from 'apache-arrow';
import anyTest, { TestFn } from 'ava';

import { ClientOptions, createFlightSqlClient, FlightSqlClient } from '../index';

const test = anyTest as TestFn<{ options: ClientOptions; client: FlightSqlClient }>;

test.beforeEach(async (t) => {
  const options: ClientOptions = {
    username: 'flight_username',
    password: 'testing123',
    tls: false,
    host: '127.0.0.1',
    port: 50051,
    headers: [],
  };
  const client = await createFlightSqlClient(options);
  t.context = { options, client };
});

test('simple query returns data', async (t) => {
  const buffer = await t.context.client.query('SELECT * FROM delta.test.simple_table');
  const table = tableFromIPC(buffer);
  t.truthy(table.toString());
});

test('get catalogs returns data', async (t) => {
  const buffer = await t.context.client.getCatalogs();
  const table = tableFromIPC(buffer);
  t.truthy(table.toString().includes('catalog_name'));
});

test('get schemas returns data', async (t) => {
  const buffer = await t.context.client.getDbSchemas({});
  const table = tableFromIPC(buffer);
  t.truthy(table.toString().includes('db_schema_name'));
});

test('get tables returns data', async (t) => {
  const buffer = await t.context.client.getTables({});
  const table = tableFromIPC(buffer);
  t.assert(table.toString().includes('table_name'));
  t.assert(!table.toString().includes('table_schema'));
});

test('get tables with schema returns data', async (t) => {
  const buffer = await t.context.client.getTables({ includeSchema: true });
  const table = tableFromIPC(buffer);
  t.assert(table.toString().includes('table_schema'));
});
