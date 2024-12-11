import { InitEventPayload, SignedEvent, signEvent } from '@ceramic-sdk/events'
import {
  type ClientOptions,
  type FlightSqlClient,
  createFlightSqlClient,
} from '@ceramic-sdk/flight-sql-client'
import { CeramicClient } from '@ceramic-sdk/http-client'
import { StreamID } from '@ceramic-sdk/identifiers'
import { ModelClient } from '@ceramic-sdk/model-client'
import type { ModelDefinition } from '@ceramic-sdk/model-protocol'
import { asDIDString } from '@didtools/codecs'
import { getAuthenticatedDID } from '@didtools/key-did'
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

const testModel: ModelDefinition = {
  version: '2.0',
  name: 'ListTestModel',
  description: 'List Test model',
  accountRelation: { type: 'list' },
  interface: false,
  implements: [],
  schema: {
    type: 'object',
    properties: {
      test: { type: 'string', maxLength: 10 },
    },
    additionalProperties: false,
  },
}

async function getClient(): Promise<FlightSqlClient> {
  return createFlightSqlClient(OPTIONS)
}

describe('flight sql', () => {
  let c1Container: CeramicOneContainer
  const ceramicClient = new CeramicClient({
    url: `http://127.0.0.1:${CONTAINER_OPTS.apiPort}`,
  })

  beforeAll(async () => {
    c1Container = await CeramicOneContainer.startContainer(CONTAINER_OPTS)
    const authenticatedDID = await getAuthenticatedDID(new Uint8Array(32))
    c1Container = await CeramicOneContainer.startContainer(CONTAINER_OPTS)

    // create a new event
    const model = StreamID.fromString(
      'kjzl6hvfrbw6c5he7fxl3oakeckm2kchkqboqug08inkh1tmfqpd8v3oceriml2',
    )
    const eventPayload: InitEventPayload = {
      data: {
        body: 'This is a simple message',
      },
      header: {
        controllers: [asDIDString(authenticatedDID.id)],
        model,
        sep: 'test',
      },
    }
    const encodedPayload = InitEventPayload.encode(eventPayload)
    const signedEvent = await signEvent(authenticatedDID, encodedPayload)
    await ceramicClient.postEventType(SignedEvent, signedEvent)

    // create a model streamType
    const modelClient = new ModelClient({
      ceramic: ceramicClient,
      did: authenticatedDID,
    })
    await modelClient.postDefinition(testModel)
  }, 10000)

  test('makes query', async () => {
    const client = await getClient()
    const buffer = await client.query('SELECT * FROM conclusion_events')
    const data = tableFromIPC(buffer)
    const row = data.get(0)
    expect(row).toBeDefined()
    expect(data.numRows).toBe(2)
  })

  test('catalogs', async () => {
    const client = await getClient()
    const buffer = await client.getCatalogs()
    const data = tableFromIPC(buffer)
    const row = data.get(0)
    expect(row).toBeDefined()
  })

  test('schemas', async () => {
    const client = await getClient()
    const buffer = await client.getDbSchemas({})
    const data = tableFromIPC(buffer)
    const row = data.get(0)
    expect(row).toBeDefined()
  })

  test('tables', async () => {
    const client = await getClient()
    const withSchema = await client.getTables({ includeSchema: true })
    const noSchema = await client.getTables({ includeSchema: false })
    expect(withSchema).not.toBe(noSchema)
  })

  test('prepared stmt', async () => {
    const client = await createFlightSqlClient(OPTIONS)
    const buffer = await client.preparedStatement(
      'SELECT * from conclusion_events where stream_type = $1',
      new Array(['$1', '3']),
    )
    const data = tableFromIPC(buffer)
    const row = data.get(0)
    const streamType = row?.stream_type
    expect(streamType).toBe(3)
    expect(data).toBeDefined()
    expect(data.numRows).toBe(1)
  })

  afterAll(async () => {
    await c1Container.teardown()
  })
})
