import {
  createDataEvent,
  createInitEvent,
  createInitHeader,
  getDeterministicInitEvent,
  getDeterministicInitEventPayload,
} from '@ceramic-sdk/document-client'
import type { TimeEvent } from '@ceramic-sdk/events'
import { CommitID, randomCID, randomStreamID } from '@ceramic-sdk/identifiers'
import {
  type DocumentDataEventPayload,
  type DocumentInitEventPayload,
  MAX_DOCUMENT_SIZE,
  getStreamID,
} from '@ceramic-sdk/model-instance-protocol'
import type { ModelDefinitionV2 } from '@ceramic-sdk/model-protocol'
import { getAuthenticatedDID } from '@didtools/key-did'
import { jest } from '@jest/globals'

import {
  handleDataPayload,
  handleDeterministicInitPayload,
  handleEvent,
  handleInitPayload,
  handleTimeEvent,
} from '../src/handlers.js'
import type { Context, DocumentState } from '../src/types.js'
import { encodeUniqueFieldsValue } from '../src/utils.js'

const authenticatedDID = await getAuthenticatedDID(new Uint8Array(32))

describe('handleDeterministicInitPayload()', () => {
  const cid = randomCID().toString()
  const modelID = randomStreamID()

  test('throws if content is provided', async () => {
    const event = getDeterministicInitEventPayload(modelID, 'did:key:123')
    // @ts-expect-error data should be null
    event.data = { some: 'content' }
    await expect(async () => {
      await handleDeterministicInitPayload(cid, event, {} as unknown as Context)
    }).rejects.toThrow(
      'Deterministic init events for ModelInstanceDocuments must not have content',
    )
  })

  test('throws if the header is invalid', async () => {
    const getModelDefinition = jest.fn(() => {
      return {
        accountRelation: { type: 'single' },
        schema: {
          type: 'object',
          properties: { hello: { type: 'string' } },
          required: ['hello'],
        },
      } as unknown as ModelDefinitionV2
    })
    const context = { getModelDefinition } as unknown as Context

    const event = getDeterministicInitEventPayload(modelID, 'did:key:123')
    // Adding a unique value should fail the SINGLE account relation validation
    event.header.unique = new Uint8Array()

    await expect(async () => {
      await handleDeterministicInitPayload(cid, event, context)
    }).rejects.toThrow(
      'ModelInstanceDocuments for models with SINGLE accountRelations must be created deterministically',
    )
  })

  test('returns the created DocumentState', async () => {
    const getModelDefinition = jest.fn(() => {
      return {
        accountRelation: { type: 'single' },
        schema: {
          type: 'object',
          properties: { hello: { type: 'string' } },
          required: ['hello'],
        },
      } as unknown as ModelDefinitionV2
    })
    const context = { getModelDefinition } as unknown as Context

    const event = getDeterministicInitEventPayload(modelID, 'did:key:123')
    const handled = await handleDeterministicInitPayload(cid, event, context)

    expect(handled.content).toBeNull()
    expect(handled.metadata.controller).toBe('did:key:123')
    expect(handled.metadata.model.equals(modelID)).toBe(true)
    expect(handled.log).toEqual([cid])
  })
})

describe('handleInitPayload()', () => {
  const cid = randomCID().toString()
  const modelID = randomStreamID()

  test('throws if no content is provided', async () => {
    await expect(async () => {
      await handleInitPayload(
        cid,
        { data: null } as unknown as DocumentInitEventPayload,
        {} as unknown as Context,
      )
    }).rejects.toThrow(
      'Signed init events for ModelInstanceDocuments must have content',
    )
  })

  test('throws if the content length exceeds the limit', async () => {
    const value = 'a'.repeat(MAX_DOCUMENT_SIZE)
    await expect(async () => {
      await handleInitPayload(
        cid,
        { data: { value } } as unknown as DocumentInitEventPayload,
        {} as unknown as Context,
      )
    }).rejects.toThrow(
      'Content has size of 16000012B which exceeds maximum size of 16000000B',
    )
  })

  test('throws if the header is invalid', async () => {
    const getModelDefinition = jest.fn(() => {
      return {
        accountRelation: { type: 'list' },
        schema: {
          type: 'object',
          properties: { hello: { type: 'string' } },
          required: ['hello'],
        },
      } as unknown as ModelDefinitionV2
    })
    const context = { getModelDefinition } as unknown as Context

    const payload = {
      data: { hello: 'world' },
      header: createInitHeader({
        controller: authenticatedDID.id,
        model: modelID,
      }),
    }
    // unique field should be set with LIST account relation
    payload.header.unique = undefined

    await expect(async () => {
      await handleInitPayload(cid, payload, context)
    }).rejects.toThrow(
      'ModelInstanceDocuments for models with LIST accountRelations must be created with a unique field',
    )
  })

  test('throws if the content does not match the model schema', async () => {
    const getModelDefinition = jest.fn(() => {
      return {
        accountRelation: { type: 'list' },
        schema: {
          type: 'object',
          properties: { hello: { type: 'string' } },
          required: ['hello'],
        },
      } as unknown as ModelDefinitionV2
    })
    const context = { getModelDefinition } as unknown as Context

    const payload = {
      data: { test: true },
      header: createInitHeader({
        controller: authenticatedDID.id,
        model: modelID,
      }),
    }
    await expect(async () => {
      await handleInitPayload(cid, payload, context)
    }).rejects.toThrow(
      "Validation Error: data must have required property 'hello'",
    )
  })

  test('throws if a relation is invalid', async () => {
    const docID = randomStreamID().toString()
    const docRefModelID = randomStreamID().toString()
    const expectedRefModelID = randomStreamID().toString()

    const getDocumentModel = jest.fn(() => docRefModelID)
    const getModelDefinition = jest.fn(() => {
      return {
        version: '2.0',
        name: 'TestModel',
        implements: [],
        accountRelation: { type: 'list' },
        schema: {
          type: 'object',
          properties: { foo: { type: 'string' } },
          required: ['foo'],
        },
        relations: {
          foo: { type: 'document', model: expectedRefModelID },
        },
      } as unknown as ModelDefinitionV2
    })
    const context = {
      getDocumentModel,
      getModelDefinition,
    } as unknown as Context

    const payload = {
      data: { foo: docID },
      header: createInitHeader({
        controller: authenticatedDID.id,
        model: randomStreamID(),
      }),
    }
    await expect(async () => {
      await handleInitPayload(cid, payload, context)
    }).rejects.toThrow(
      `Relation on field foo points to Stream ${docID}, which belongs to Model ${docRefModelID}, but this Stream's Model (TestModel) specifies that this relation must be to a Stream in the Model ${expectedRefModelID}`,
    )
  })

  test('returns the created DocumentState', async () => {
    const getModelDefinition = jest.fn(() => {
      return {
        accountRelation: { type: 'list' },
        schema: {
          type: 'object',
          properties: { hello: { type: 'string' } },
          required: ['hello'],
        },
      } as unknown as ModelDefinitionV2
    })
    const context = { getModelDefinition } as unknown as Context

    const payload = {
      data: { hello: 'world' },
      header: createInitHeader({
        controller: authenticatedDID.id,
        model: modelID,
      }),
    }
    const handled = await handleInitPayload(cid, payload, context)
    expect(handled.content).toStrictEqual({ hello: 'world' })
    expect(handled.metadata.controller).toBe(authenticatedDID.id)
    expect(handled.metadata.model.equals(modelID)).toBe(true)
    expect(handled.metadata.unique).toBeInstanceOf(Uint8Array)
    expect(handled.log).toEqual([cid])
  })
})

describe('handleDataPayload()', () => {
  const eventID = randomCID().toString()
  const initID = randomCID()
  const modelID = randomStreamID()

  test('throws if the event cannot be linked to the state', async () => {
    const getDocumentState = jest.fn(() => {
      return { log: [] }
    })
    const context = { getDocumentState } as unknown as Context

    await expect(async () => {
      await handleDataPayload(
        eventID,
        { id: initID } as unknown as DocumentDataEventPayload,
        context,
      )
    }).rejects.toThrow('Invalid document state: log is empty')
  })

  test('throws if the event header contains other fields than "shouldIndex"', async () => {
    const getDocumentState = jest.fn(() => {
      return {
        log: [initID.toString()],
        metadata: { unique: new Uint8Array() },
      }
    })
    const context = { getDocumentState } as unknown as Context

    await expect(async () => {
      await handleDataPayload(
        eventID,
        {
          id: initID,
          prev: initID,
          header: { unique: new Uint8Array() },
        } as unknown as DocumentDataEventPayload,
        context,
      )
    }).rejects.toThrow(
      `Updating metadata for ModelInstanceDocument Streams is not allowed.  Tried to change metadata for ${initID} from {"unique":{}} to {"unique":{}}`,
    )
  })

  test('throws if the updated content length exceeds the limit', async () => {
    const longString = 'a'.repeat(MAX_DOCUMENT_SIZE - 20)

    const getDocumentState = jest.fn(() => {
      return { log: [initID.toString()], content: { a: longString } }
    })
    const context = { getDocumentState } as unknown as Context

    await expect(async () => {
      await handleDataPayload(
        eventID,
        {
          id: initID,
          prev: initID,
          data: [{ op: 'add', path: '/b', value: longString }],
        } as unknown as DocumentDataEventPayload,
        context,
      )
    }).rejects.toThrow(
      'Content has size of 31999975B which exceeds maximum size of 16000000B',
    )
  })

  test('throws if the content does not match the model schema', async () => {
    const getDocumentState = jest.fn(() => {
      return {
        log: [initID.toString()],
        content: { hello: 'world' },
        metadata: { model: modelID },
      }
    })
    const getModelDefinition = jest.fn(() => {
      return {
        accountRelation: { type: 'list' },
        schema: {
          type: 'object',
          properties: { hello: { type: 'string' } },
          required: ['hello'],
        },
      } as unknown as ModelDefinitionV2
    })
    const context = {
      getDocumentState,
      getModelDefinition,
    } as unknown as Context

    await expect(async () => {
      await handleDataPayload(
        eventID,
        {
          id: initID,
          prev: initID,
          data: [{ op: 'remove', path: '/hello' }],
        } as unknown as DocumentDataEventPayload,
        context,
      )
    }).rejects.toThrow(
      "Validation Error: data must have required property 'hello'",
    )
  })

  test('throws if the "unique" value is invalid', async () => {
    const getDocumentState = jest.fn(() => {
      return {
        log: [initID.toString()],
        content: { hello: 'world', foo: 'one', bar: 'two' },
        metadata: {
          model: modelID,
          unique: encodeUniqueFieldsValue(['one', 'two']),
        },
      }
    })
    const getModelDefinition = jest.fn(() => {
      return {
        accountRelation: { type: 'set', fields: ['foo', 'bar'] },
        schema: {
          type: 'object',
          properties: {
            hello: { type: 'string' },
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
          required: ['foo', 'bar'],
        },
      } as unknown as ModelDefinitionV2
    })
    const context = {
      getDocumentState,
      getModelDefinition,
    } as unknown as Context

    await expect(async () => {
      await handleDataPayload(
        eventID,
        {
          id: initID,
          prev: initID,
          data: [{ op: 'replace', path: '/foo', value: 'test' }],
        } as unknown as DocumentDataEventPayload,
        context,
      )
    }).rejects.toThrow(
      'Unique content fields value does not match metadata. If you are trying to change the value of these fields, this is causing this error: these fields values are not mutable.',
    )
  })

  test('throws if an immutable field is changed', async () => {
    const getDocumentState = jest.fn(() => {
      return {
        log: [initID.toString()],
        content: { hello: 'world' },
        metadata: { model: modelID },
      }
    })
    const getModelDefinition = jest.fn(() => {
      return {
        accountRelation: { type: 'list' },
        schema: {
          type: 'object',
          properties: { hello: { type: 'string' } },
          required: ['hello'],
        },
        immutableFields: ['hello'],
      } as unknown as ModelDefinitionV2
    })
    const context = {
      getDocumentState,
      getModelDefinition,
    } as unknown as Context

    await expect(async () => {
      await handleDataPayload(
        eventID,
        {
          id: initID,
          prev: initID,
          data: [{ op: 'replace', path: '/hello', value: 'test' }],
        } as unknown as DocumentDataEventPayload,
        context,
      )
    }).rejects.toThrow('Immutable field "hello" cannot be updated')
  })

  test('throws if a relation is invalid', async () => {
    const docID = randomStreamID().toString()
    const docRefModelID = randomStreamID().toString()
    const expectedRefModelID = randomStreamID().toString()

    const getDocumentState = jest.fn(() => {
      return {
        log: [initID.toString()],
        content: {},
        metadata: { model: randomStreamID() },
      }
    })
    const getDocumentModel = jest.fn(() => docRefModelID)
    const getModelDefinition = jest.fn(() => {
      return {
        version: '2.0',
        name: 'TestModel',
        implements: [],
        accountRelation: { type: 'list' },
        schema: {
          type: 'object',
          properties: { foo: { type: 'string' } },
          required: [],
        },
        relations: {
          foo: { type: 'document', model: expectedRefModelID },
        },
      } as unknown as ModelDefinitionV2
    })
    const context = {
      getDocumentModel,
      getDocumentState,
      getModelDefinition,
    } as unknown as Context

    await expect(async () => {
      await handleDataPayload(
        eventID,
        {
          id: initID,
          prev: initID,
          data: [{ op: 'replace', path: '/foo', value: docID }],
        } as unknown as DocumentDataEventPayload,
        context,
      )
    }).rejects.toThrow(
      `Relation on field foo points to Stream ${docID}, which belongs to Model ${docRefModelID}, but this Stream's Model (TestModel) specifies that this relation must be to a Stream in the Model ${expectedRefModelID}`,
    )
  })

  test('returns the updated DocumentState', async () => {
    const getDocumentState = jest.fn(() => {
      return {
        log: [initID.toString()],
        content: { hello: 'world' },
        metadata: { model: modelID, shouldIndex: false },
      }
    })
    const getModelDefinition = jest.fn(() => {
      return {
        accountRelation: { type: 'list' },
        schema: {
          type: 'object',
          properties: { hello: { type: 'string' } },
          required: ['hello'],
        },
      } as unknown as ModelDefinitionV2
    })
    const context = {
      getDocumentState,
      getModelDefinition,
    } as unknown as Context

    const payload = {
      id: initID,
      prev: initID,
      data: [{ op: 'replace', path: '/hello', value: 'test' }],
      header: { shouldIndex: true },
    } as unknown as DocumentDataEventPayload

    const newState = await handleDataPayload(eventID, payload, context)
    expect(newState.content).toEqual({ hello: 'test' })
    expect(newState.log).toEqual([initID.toString(), eventID])
    expect(newState.metadata.shouldIndex).toBe(true)
  })
})

describe('handleTimeEvent()', () => {
  const eventID = randomCID().toString()
  const initID = randomCID()

  test('throws if the event cannot be linked to the state', async () => {
    const getDocumentState = jest.fn(() => {
      return { log: [] }
    })
    const context = { getDocumentState } as unknown as Context

    await expect(async () => {
      await handleTimeEvent(
        eventID,
        { id: initID } as unknown as TimeEvent,
        context,
      )
    }).rejects.toThrow('Invalid document state: log is empty')
  })

  test('returns the updated DocumentState', async () => {
    const getDocumentState = jest.fn(() => {
      return { log: [initID.toString()], content: { test: true } }
    })
    const context = { getDocumentState } as unknown as Context
    const event = { id: initID, prev: initID } as unknown as TimeEvent
    const newState = await handleTimeEvent(eventID, event, context)
    expect(newState.content).toEqual({ test: true })
    expect(newState.log).toEqual([initID.toString(), eventID])
  })
})

describe('handleEvent()', () => {
  test('with deterministic init event', async () => {
    const modelID = randomStreamID()

    let state: DocumentState
    const getDocumentState = jest.fn(() => state)

    const getModelDefinition = jest.fn(() => {
      return {
        accountRelation: { type: 'set', fields: ['foo', 'bar'] },
        schema: {
          type: 'object',
          properties: {
            hello: { type: 'string' },
            foo: { type: 'string' },
            bar: { type: 'string' },
          },
          required: ['foo', 'bar'],
        },
      } as unknown as ModelDefinitionV2
    })

    const context = {
      getDocumentState,
      getModelDefinition,
      verifier: authenticatedDID,
    } as unknown as Context
    const unique = encodeUniqueFieldsValue(['one', 'two'])

    const initCID = randomCID()
    const initEvent = getDeterministicInitEvent(
      modelID,
      authenticatedDID.id,
      unique,
    )
    state = await handleEvent(initCID.toString(), initEvent, context)
    const streamID = getStreamID(initCID)

    const timeCID = randomCID().toString()
    const timeEvent: TimeEvent = {
      id: initCID,
      prev: initCID,
      proof: randomCID(),
      path: '/',
    }
    state = await handleEvent(timeCID, timeEvent, context)

    const dataCID = randomCID().toString()
    const dataEvent = await createDataEvent({
      controller: authenticatedDID,
      currentID: CommitID.fromStream(streamID, timeCID),
      newContent: { hello: 'world', foo: 'one', bar: 'two' },
      shouldIndex: true,
    })
    state = await handleEvent(dataCID, dataEvent, context)

    expect(state.content).toEqual({ hello: 'world', foo: 'one', bar: 'two' })
    expect(state.metadata.controller).toBe(authenticatedDID.id)
    expect(state.metadata.model.equals(modelID)).toBe(true)
    expect(state.metadata.shouldIndex).toBe(true)
    expect(state.metadata.unique).toBe(unique)
    expect(state.log).toEqual([initCID.toString(), timeCID, dataCID])
  })

  test('with non-deterministic init event', async () => {
    const modelID = randomStreamID()

    let state: DocumentState
    const getDocumentState = jest.fn(() => state)

    const getModelDefinition = jest.fn(() => {
      return {
        accountRelation: { type: 'list' },
        schema: {
          type: 'object',
          properties: { hello: { type: 'string' } },
          required: ['hello'],
        },
      } as unknown as ModelDefinitionV2
    })

    const context = {
      getDocumentState,
      getModelDefinition,
      verifier: authenticatedDID,
    } as unknown as Context

    const initCID = randomCID()
    const initEvent = await createInitEvent({
      controller: authenticatedDID,
      content: { hello: 'world' },
      model: modelID,
    })
    state = await handleEvent(initCID.toString(), initEvent, context)
    const streamID = getStreamID(initCID)

    const dataCID = randomCID()
    const dataEvent = await createDataEvent({
      controller: authenticatedDID,
      currentID: CommitID.fromStream(streamID, initCID),
      newContent: { hello: 'test' },
      shouldIndex: true,
    })
    state = await handleEvent(dataCID.toString(), dataEvent, context)

    const timeCID = randomCID().toString()
    const timeEvent: TimeEvent = {
      id: initCID,
      prev: dataCID,
      proof: randomCID(),
      path: '/',
    }
    state = await handleEvent(timeCID, timeEvent, context)

    expect(state.content).toEqual({ hello: 'test' })
    expect(state.metadata.controller).toBe(authenticatedDID.id)
    expect(state.metadata.model.equals(modelID)).toBe(true)
    expect(state.metadata.shouldIndex).toBe(true)
    expect(state.metadata.unique).toBeInstanceOf(Uint8Array)
    expect(state.log).toEqual([initCID.toString(), dataCID.toString(), timeCID])
  })
})
