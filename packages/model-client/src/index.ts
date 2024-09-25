import {
  type PartialInitEventHeader,
  SignedEvent,
  createSignedInitEvent,
  eventToContainer,
} from '@ceramic-sdk/events'
import { StreamID } from '@ceramic-sdk/identifiers'
import {
  MODEL,
  type ModelDefinition,
  ModelInitEventPayload,
  assertValidModelContent,
  getModelStreamID,
  validateController,
} from '@ceramic-sdk/model-protocol'
import { StreamClient } from '@ceramic-sdk/stream-client'
import type { DID } from 'dids'

const header: PartialInitEventHeader = { model: MODEL, sep: 'model' }

/**
 * Create a signed init event for a model using the provided DID and model definition
 */
export async function createInitEvent(
  did: DID,
  data: ModelDefinition,
): Promise<SignedEvent> {
  assertValidModelContent(data)
  if (!did.authenticated) {
    await did.authenticate()
  }
  const controller = did.hasParent ? did.parent : did.id
  const event = await createSignedInitEvent(did, data, header)
  await validateController(controller, event.cacaoBlock)
  return event
}

export class ModelClient extends StreamClient {
  async getInitEvent(streamID: StreamID | string): Promise<SignedEvent> {
    const id =
      typeof streamID === 'string' ? StreamID.fromString(streamID) : streamID
    return await this.ceramic.getEventType(SignedEvent, id.cid.toString())
  }

  async getPayload(
    streamID: StreamID | string,
    verifier?: DID,
  ): Promise<ModelInitEventPayload> {
    const event = await this.getInitEvent(streamID)
    const container = await eventToContainer(
      this.getDID(verifier),
      ModelInitEventPayload,
      event,
    )
    return container.payload
  }

  async postDefinition(
    definition: ModelDefinition,
    signer?: DID,
  ): Promise<StreamID> {
    const did = this.getDID(signer)
    const event = await createInitEvent(did, definition)
    const cid = await this.ceramic.postEventType(SignedEvent, event)
    return getModelStreamID(cid)
  }
}
