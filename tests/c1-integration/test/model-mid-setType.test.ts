import { CeramicClient } from '@ceramic-sdk/http-client'
import type { CommitID, StreamID } from '@ceramic-sdk/identifiers'
import { ModelClient } from '@ceramic-sdk/model-client'
import { ModelInstanceClient } from '@ceramic-sdk/model-instance-client'
import type { ModelDefinition } from '@ceramic-sdk/model-protocol'
import { getAuthenticatedDID } from '@didtools/key-did'
import CeramicOneContainer, { type EnvironmentOptions } from '../src'

const authenticatedDID = await getAuthenticatedDID(new Uint8Array(32))

const testModel: ModelDefinition = {
  version: '2.0',
  name: 'SetTestModel',
  description: 'Set Test model',
  accountRelation: {
    type: 'set',
    fields: ['test'],
  },
  schema: {
    type: 'object',
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    properties: {
      test: {
        type: 'string',
      },
    },
    required: ['test'],
    additionalProperties: false,
  },
  interface: false,
  implements: [],
}

const CONTAINER_OPTS: EnvironmentOptions = {
  containerName: 'ceramic-test-model-MID-list',
  apiPort: 5222,
  flightSqlPort: 5223,
  testPort: 5223,
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

  beforeAll(async () => {
    c1Container = await CeramicOneContainer.startContainer(CONTAINER_OPTS)
    modelStream = await modelClient.postDefinition(testModel)
  }, 10000)

  test('gets correct model definition', async () => {
    // wait one second
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const definition = await modelClient.getModelDefinition(modelStream)
    expect(definition).toEqual(testModel)
  })
  test('posts signed init event and obtains correct state', async () => {
    documentStream = await modelInstanceClient.postSignedInit({
      model: modelStream,
      content: { test: 'hello' },
      shouldIndex: true,
    })
    // wait 1 seconds
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const currentState = await modelInstanceClient.getDocumentState(
      documentStream.toString(),
    )
    expect(currentState.content).toEqual({ test: 'hello' })
  })
  test('updates document and obtains correct state', async () => {
    // update the document
    const updatedState = await modelInstanceClient.updateDocument({
      streamID: documentStream.toString(),
      newContent: { test: 'world' },
      shouldIndex: true,
    })
    expect(updatedState.content).toEqual({ test: 'world' })
  })
  afterAll(async () => {
    await c1Container.teardown()
  })
})
