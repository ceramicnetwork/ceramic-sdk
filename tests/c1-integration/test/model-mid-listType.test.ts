import { CeramicClient } from '@ceramic-sdk/http-client'
import type { CommitID } from '@ceramic-sdk/identifiers'
import { StreamID } from '@ceramic-sdk/identifiers'
import { ModelClient } from '@ceramic-sdk/model-client'
import { ModelInstanceClient } from '@ceramic-sdk/model-instance-client'
import type { ModelDefinition } from '@ceramic-sdk/model-protocol'
import { getAuthenticatedDID } from '@didtools/key-did'
import CeramicOneContainer, { waitForEventState, type EnvironmentOptions } from '../src'
import {
  type ClientOptions,
  createFlightSqlClient,
  FlightSqlClient,
} from '@ceramic-sdk/flight-sql-client'

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
  image: 'ceramic-one:dev',
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

const modelInstanceClient = new ModelInstanceClient({
  ceramic: client,
  did: authenticatedDID,
})

const modelClient = new ModelClient({
  ceramic: client,
  did: authenticatedDID,
})

describe('model integration test for list model and MID', () => {
  let c1Container: CeramicOneContainer
  let modelStream: StreamID
  let documentStream: CommitID
  let flightClient: FlightSqlClient

  beforeAll(async () => {
    c1Container = await CeramicOneContainer.startContainer(CONTAINER_OPTS)
    modelStream = await modelClient.postDefinition(testModel)
    flightClient = await createFlightSqlClient(FLIGHT_OPTIONS)
  }, 10000)

  test('gets correct model definition', async () => {
    // Use the flightsql stream behavior to ensure the events states have been process before querying their states.
    await waitForEventState(flightClient, modelStream.cid);

    const definition = await modelClient.getModelDefinition(modelStream)
    expect(definition).toEqual(testModel)
  })
  test('posts signed init event and obtains correct state', async () => {
    documentStream = await modelInstanceClient.postSignedInit({
      model: modelStream,
      content: { test: 'hello' },
      shouldIndex: true,
    })
    // Use the flightsql stream behavior to ensure the events states have been process before querying their states.
    await waitForEventState(flightClient, documentStream.commit);

    const currentState = await modelInstanceClient.getDocumentState(
      documentStream.baseID,
    )
    expect(currentState.content).toEqual({ test: 'hello' })
  })
  test('updates document and obtains correct state', async () => {
    // update the document
    const updatedState = await modelInstanceClient.updateDocument({
      streamID: new StreamID(3, documentStream.commit.toString()).toString(),
      newContent: { test: 'world' },
      shouldIndex: true,
    })
    expect(updatedState.content).toEqual({ test: 'world' })
  })
  afterAll(async () => {
    await c1Container.teardown()
  })
})
