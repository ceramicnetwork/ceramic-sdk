import { CeramicClient } from '@ceramic-sdk/http-client'
import { StreamID } from '@ceramic-sdk/identifiers'
import { ModelClient } from '@ceramic-sdk/model-client'
import {
  type ModelState,
  handleInitEvent as handleModel,
} from '@ceramic-sdk/model-handler'
import { DocumentClient } from '@ceramic-sdk/model-instance-client'
import {
  type DocumentState,
  handleEvent as handleDocument,
} from '@ceramic-sdk/model-instance-handler'
import type { ModelDefinition } from '@ceramic-sdk/model-protocol'
import { getAuthenticatedDID } from '@didtools/key-did'
import CeramicOneContainer, { type EnvironmentOptions } from '../src'

const authenticatedDID = await getAuthenticatedDID(new Uint8Array(32))

const OPTIONS: EnvironmentOptions = {
  containerName: 'ceramic-test-document',
  apiPort: 5203,
  flightSqlPort: 5204,
}

describe('stream classes', () => {
  let c1Container: CeramicOneContainer
  const client = new CeramicClient({
    url: `http://127.0.0.1:${OPTIONS.apiPort}`,
  })

  beforeAll(async () => {
    c1Container = await CeramicOneContainer.startContainer(OPTIONS)
  }, 10000)

  test('create and update deterministic document', async () => {
    const testModel: ModelDefinition = {
      version: '2.0',
      name: 'TestModel',
      description: 'Test model',
      accountRelation: { type: 'single' },
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

    const modelClient = new ModelClient({
      ceramic: client,
      did: authenticatedDID,
    })
    const modelID = await modelClient.postDefinition(testModel)
    const modelEvent = await modelClient.getInitEvent(modelID)

    const modelsStore: Record<string, ModelState> = {}
    const contextDocumentModel = modelID.baseID.toString()
    let docState: DocumentState
    const context = {
      getDocumentModel: async () => contextDocumentModel,
      getDocumentState: async () => docState,
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
    const modelCIDstring = modelID.cid.toString()
    modelsStore[modelCIDstring] = await handleModel(
      modelCIDstring,
      modelEvent,
      context,
    )

    const docClient = new DocumentClient({
      ceramic: client,
      did: authenticatedDID,
    })

    const initCommitID = await docClient.postDeterministicInit({
      controller: authenticatedDID.id,
      model: modelID,
    })
    const initEvent = await docClient.getEvent(initCommitID)
    docState = await handleDocument(
      initCommitID.commit.toString(),
      initEvent,
      context,
    )
    expect(docState.content).toBeNull()

    const updateCommitID = await docClient.postData({
      currentID: initCommitID,
      newContent: { test: 'set' },
      currentContent: {test: 'current'},
    })
    const updateEvent = await docClient.getEvent(updateCommitID)
    docState = await handleDocument(
      updateCommitID.commit.toString(),
      updateEvent,
      context,
    )
    expect(docState.content).toEqual({ test: 'set' })

    const finalCommitID = await docClient.postData({
      currentID: updateCommitID,
      currentContent: { test: 'set' },
      newContent: { test: 'changed' },
    })
    const finalEvent = await docClient.getEvent(finalCommitID)
    docState = await handleDocument(
      finalCommitID.commit.toString(),
      finalEvent,
      context,
    )
    expect(docState.content).toEqual({ test: 'changed' })
  })

  test('create and update non-deterministic document', async () => {
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

    const modelClient = new ModelClient({
      ceramic: client,
      did: authenticatedDID,
    })
    const modelID = await modelClient.postDefinition(testModel)
    const modelEvent = await modelClient.getInitEvent(modelID)

    const modelsStore: Record<string, ModelState> = {}
    const contextDocumentModel = modelID.baseID.toString()
    let docState: DocumentState
    const context = {
      getDocumentModel: async () => contextDocumentModel,
      getDocumentState: async () => docState,
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
    const modelCIDstring = modelID.cid.toString()
    modelsStore[modelCIDstring] = await handleModel(
      modelCIDstring,
      modelEvent,
      context,
    )

    const docClient = new DocumentClient({
      ceramic: client,
      did: authenticatedDID,
    })

    const initCommitID = await docClient.postSignedInit({
      content: { test: 'one' },
      model: modelID,
    })
    const initEvent = await docClient.getEvent(initCommitID)
    docState = await handleDocument(
      initCommitID.commit.toString(),
      initEvent,
      context,
    )
    expect(docState.content).toEqual({ test: 'one' })

    const updateCommitID = await docClient.postData({
      currentID: initCommitID,
      currentContent: { test: 'one' },
      newContent: { test: 'two' },
    })
    const updateEvent = await docClient.getEvent(updateCommitID)
    docState = await handleDocument(
      updateCommitID.commit.toString(),
      updateEvent,
      context,
    )
    expect(docState.content).toEqual({ test: 'two' })

    const finalCommitID = await docClient.postData({
      currentID: updateCommitID,
      currentContent: { test: 'two' },
      newContent: { test: 'three' },
    })
    const finalEvent = await docClient.getEvent(finalCommitID)
    docState = await handleDocument(
      finalCommitID.commit.toString(),
      finalEvent,
      context,
    )
    expect(docState.content).toEqual({ test: 'three' })
  })

  afterAll(async () => {
    await c1Container.teardown()
  })
})
