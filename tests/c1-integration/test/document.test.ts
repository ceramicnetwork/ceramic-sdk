import { CeramicClient } from '@ceramic-sdk/http-client'
import { StreamID } from '@ceramic-sdk/identifiers'
import { ModelClient } from '@ceramic-sdk/model-client'
import {
  ModelInstanceClient,
  createInitEvent as createDocument,
} from '@ceramic-sdk/model-instance-client'
import {
  type Context,
  handleEvent as handleDocument,
} from '@ceramic-sdk/model-instance-handler'
import { DocumentEvent } from '@ceramic-sdk/model-instance-protocol'
import type { ModelDefinition } from '@ceramic-sdk/model-protocol'
import { getAuthenticatedDID } from '@didtools/key-did'
import type { DID } from 'dids'
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
  containerName: 'ceramic-test-document',
  apiPort: 5222,
  flightSqlPort: 5223,
  testPort: 5223,
}

describe('model integration test', () => {
  let c1Container: CeramicOneContainer
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

  let model: StreamID

  beforeAll(async () => {
    c1Container = await CeramicOneContainer.startContainer(CONTAINER_OPTS)
    model = await modelClient.postDefinition(testModel)
  }, 10000)

  test('create model and documents using the model', async () => {
    const context: Context = {
      getModelDefinition: async (id) => {
        return await modelClient.getModelDefinition(StreamID.fromString(id))
      },
      verifier: authenticatedDID as DID,
      getDocumentState: async (id) => {
        return await modelInstanceClient.getDocumentState(
          StreamID.fromString(id),
        )
      },
      getDocumentModel: async (id) => {
        return await modelClient.getDocumentModel(StreamID.fromString(id))
      },
    }

    await client.registerInterestModel(model.toString())

    async function createAndPostDocument(
      content: Record<string, unknown>,
    ): Promise<void> {
      const event = await createDocument({
        controller: authenticatedDID,
        content,
        model,
      })
      await client.postEventType(DocumentEvent, event)
    }

    await createAndPostDocument({ test: 'one' })
    await createAndPostDocument({ test: 'two' })

    const feed = await client.getEventsFeed()
    expect(feed.events).toHaveLength(3)
    const eventID1 = feed.events[1].id
    const eventID2 = feed.events[2].id

    const [event1, event2] = await Promise.all([
      client.getEventType(DocumentEvent, eventID1),
      client.getEventType(DocumentEvent, eventID2),
    ])
    const [state1, state2] = await Promise.all([
      handleDocument(event1 as DocumentEvent, context),
      handleDocument(event2 as DocumentEvent, context),
    ])
    expect(state1.content).toEqual({ test: 'one' })
    expect(state2.content).toEqual({ test: 'two' })
  })

  afterAll(async () => {
    await c1Container.teardown()
  })
})
