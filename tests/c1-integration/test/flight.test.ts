import {
  type ClientOptions,
  type FlightSqlClient,
  createFlightSqlClient,
} from '@ceramic-sdk/flight-sql-client'
import { tableFromIPC } from 'apache-arrow'
import CeramicOneContainer from '../src'
import type { EnvironmentOptions } from '../src'

const CONTAINER_OPTS: EnvironmentOptions = {
  containerName: 'ceramic-test-flight',
  apiPort: 5222,
  flightSqlPort: 5223,
  testPort: 5223,
}

const OPTIONS: ClientOptions = {
  headers: new Array(),
  username: undefined,
  password: undefined,
  token: undefined,
  tls: false,
  host: '127.0.0.1',
  port: CONTAINER_OPTS.flightSqlPort,
}

async function getClient(): Promise<FlightSqlClient> {
  return createFlightSqlClient(OPTIONS)
}

describe('flight sql', () => {
  let c1Container: CeramicOneContainer

  beforeAll(async () => {
    c1Container = await CeramicOneContainer.startContainer(CONTAINER_OPTS)
  }, 10000)

  test('makes query', async () => {
    const client = await getClient()
    const buffer = await client.query('SELECT * FROM conclusion_events')
    const data = tableFromIPC(buffer)
    console.log(JSON.stringify(data))
  })

  test('catalogs', async () => {
    const client = await getClient()
    const buffer = await client.getCatalogs()
    const data = tableFromIPC(buffer)
    console.log(JSON.stringify(data))
  })

  test('schemas', async () => {
    const client = await getClient()
    const buffer = await client.getDbSchemas({})
    const data = tableFromIPC(buffer)
    console.log(JSON.stringify(data))
  })

  test('tables', async () => {
    const client = await getClient()
    const withSchema = await client.getTables({ includeSchema: true })
    const noSchema = await client.getTables({ includeSchema: false })
    console.log(JSON.stringify(tableFromIPC(withSchema)))
    console.log(JSON.stringify(tableFromIPC(noSchema)))
    expect(withSchema).not.toBe(noSchema)
  })

  // disabled until server support is implemented
  test.skip('prepared stmt', async () => {
    const client = await createFlightSqlClient(OPTIONS)
    const buffer = await client.preparedStatement(
      'SELECT * from conclusion_events where stream_type = $1',
      new Array(['$1', '3']),
    )
    const data = tableFromIPC(buffer)
    console.log(JSON.stringify(data))
  })

  afterAll(async () => {
    await c1Container.teardown()
  })
})
