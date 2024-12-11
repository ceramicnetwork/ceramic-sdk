import { CeramicClient } from '@ceramic-sdk/http-client'
import { ModelClient } from '@ceramic-sdk/model-client'
import { ModelInstanceClient } from '@ceramic-sdk/model-instance-client'
import type { ModelDefinition } from '@ceramic-sdk/model-protocol'
import { getAuthenticatedDID } from '@didtools/key-did'
import CeramicOneContainer, { type EnvironmentOptions } from '../src'

const authenticatedDID = await getAuthenticatedDID(new Uint8Array(32))

const testModel: ModelDefinition = {
  version: '2.0',
  name: 'TestModel',
  description: 'Test model',
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

describe('model integration test', () => {
  let c1Container: CeramicOneContainer
  const client = new CeramicClient({
    url: `http://127.0.0.1:${CONTAINER_OPTS.apiPort}`,
  })

  beforeAll(async () => {
    c1Container = await CeramicOneContainer.startContainer(CONTAINER_OPTS)
  }, 10000)

  test('create LIST model, model instance, and updates to instance using the model', async () => {
    const modelInstanceClient = new ModelInstanceClient({
      ceramic: client,
      did: authenticatedDID,
    })
    const modelClient = new ModelClient({
      ceramic: client,
      did: authenticatedDID,
    })
    const modelStream = await modelClient.postDefinition(testModel)
    const definition = await modelClient.getModelDefinition(modelStream)
    expect(definition).toEqual(testModel)

    const documentStream = await modelInstanceClient.postSignedInit({
      model: modelStream,
      content: { test: 'hello' },
      shouldIndex: true,
    })

    // wait 1 seconds
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const currentState = await modelInstanceClient.getDocumentState(
      documentStream.toString(),
    )

    // wait 1 seconds
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // update the document
    const updatedState = await modelInstanceClient.updateDocument({
      streamID: documentStream.toString(),
      newContent: { test: 'world' },
      shouldIndex: true,
    })
    expect(currentState.content).toEqual({ test: 'hello' })
    expect(updatedState.content).toEqual({ test: 'world' })
  })
  afterAll(async () => {
    await c1Container.teardown()
  })
})
