import {
  type ClientOptions,
  type FlightSqlClient,
  createFlightSqlClient,
} from '@ceramic-sdk/flight-sql-client'
import { CeramicClient } from '@ceramic-sdk/http-client'
import { ModelClient } from '@ceramic-sdk/model-client'
import type { ModelDefinition } from '@ceramic-sdk/model-protocol'
import { getAuthenticatedDID } from '@didtools/key-did'
import CeramicOneContainer, {
  waitForEventState,
  type EnvironmentOptions,
} from '../src'

const authenticatedDID = await getAuthenticatedDID(new Uint8Array(32))

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

const CONTAINER_OPTS: EnvironmentOptions = {
  containerName: 'ceramic-test-model-MID-list',
  apiPort: 5222,
  flightSqlPort: 5223,
  testPort: 5223,
}

const FLIGHT_OPTIONS: ClientOptions = {
  headers: new Array(),
  username: undefined,
  password: undefined,
  token: undefined,
  tls: false,
  host: '127.0.0.1',
  port: CONTAINER_OPTS.flightSqlPort,
}

const client = new CeramicClient({
  url: `http://127.0.0.1:${CONTAINER_OPTS.apiPort}`,
})

const modelClient = new ModelClient({
  ceramic: client,
  did: authenticatedDID,
})

describe('model integration test for list model and MID', () => {
  let c1Container: CeramicOneContainer
  let flightClient: FlightSqlClient

  beforeAll(async () => {
    c1Container = await CeramicOneContainer.startContainer(CONTAINER_OPTS)
    flightClient = await createFlightSqlClient(FLIGHT_OPTIONS)
  }, 10000)

  test('create model', async () => {
    const modelStream = await modelClient.createDefinition(testModel)
    // Use the flightsql stream behavior to ensure the events states have been process before querying their states.
    await waitForEventState(flightClient, modelStream.cid)

    const definition = await modelClient.getModelDefinition(modelStream)
    expect(definition).toEqual(testModel)
  })
  afterAll(async () => {
    await c1Container.teardown()
  })
})
