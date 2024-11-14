import { signedEventToCAR } from '@ceramic-sdk/events'
import { CeramicClient } from '@ceramic-sdk/http-client'
import { StreamID } from '@ceramic-sdk/identifiers'
import { createInitEvent as createModel } from '@ceramic-sdk/model-client'
import {
  type ModelState,
  handleInitEvent as handleModel,
} from '@ceramic-sdk/model-handler'
import { createInitEvent as createDocument } from '@ceramic-sdk/model-instance-client'
import { handleEvent as handleDocument } from '@ceramic-sdk/model-instance-handler'
import { DocumentEvent } from '@ceramic-sdk/model-instance-protocol'
import {
  type ModelDefinition,
  getModelStreamID,
} from '@ceramic-sdk/model-protocol'
import { getAuthenticatedDID } from '@didtools/key-did'
import CeramicOneContainer, { type EnvironmentOptions } from '../src'
import ContainerWrapper from '../src/withContainer'

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

const OPTIONS: EnvironmentOptions = {
  containerName: 'ceramic-test-document',
  apiPort: 5211,
  flightSqlPort: 5212,
}

describe('model integration test', () => {
  let c1Container: CeramicOneContainer
  const client = new CeramicClient({
    url: `http://127.0.0.1:${OPTIONS.apiPort}`,
  })

  beforeAll(async () => {
    c1Container = await CeramicOneContainer.startContainer(OPTIONS)
  }, 10000)

  test('create model and documents using the model', async () => {
    const modelsStore: Record<string, ModelState> = {}

    const context = {
      getModelDefinition: async (id) => {
        const cid = StreamID.fromString(id).cid.toString()
        const state = modelsStore[cid]
        if (state == null) {
          throw new Error(`State not found for model: ${id}`)
        }
        return state.content
      },
      verifier: authenticatedDID,
    }

    const modelEvent = await createModel(authenticatedDID, testModel)
    const modelCID = signedEventToCAR(modelEvent).roots[0]
    const modelCIDstring = modelCID.toString()
    modelsStore[modelCIDstring] = await handleModel(
      modelCIDstring,
      modelEvent,
      context,
    )

    await client.registerInterestModel(modelCIDstring)

    const model = getModelStreamID(modelCID)

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
    expect(feed.events).toHaveLength(2)
    const eventID1 = feed.events[0].id
    const eventID2 = feed.events[1].id

    const [event1, event2] = await Promise.all([
      client.getEventType(DocumentEvent, eventID1),
      client.getEventType(DocumentEvent, eventID2),
    ])
    const [state1, state2] = await Promise.all([
      handleDocument(eventID1, event1, context),
      handleDocument(eventID2, event2, context),
    ])
    expect(state1.content).toEqual({ test: 'one' })
    expect(state2.content).toEqual({ test: 'two' })
  })

  afterAll(async () => {
    await c1Container.teardown()
  })
})
