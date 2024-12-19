import {
  type PartialInitEventHeader,
  SignedEvent,
  createSignedInitEvent,
  decodeMultibaseToJSON,
  decodeMultibaseToStreamID,
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
  /** Get the signed init event of a Model based on its stream ID */
  async getInitEvent(streamID: StreamID | string): Promise<SignedEvent> {
    const id =
      typeof streamID === 'string' ? StreamID.fromString(streamID) : streamID
    return await this.ceramic.getEventType(SignedEvent, id.cid.toString())
  }

  /** Get the init event payload of a Model based on its stream ID */
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

  /** Post a Model definition and return its stream ID */
  async postDefinition(
    definition: ModelDefinition,
    signer?: DID,
  ): Promise<StreamID> {
    const did = this.getDID(signer)
    const event = await createInitEvent(did, definition)
    const cid = await this.ceramic.postEventType(SignedEvent, event)
    return getModelStreamID(cid)
  }

  /** Retrieve the stringified model stream ID from a model instance document stream ID */
  async getDocumentModel(streamID: StreamID | string): Promise<string> {
    const id =
      typeof streamID === 'string' ? StreamID.fromString(streamID) : streamID
    const streamState = await this.getStreamState(id)
    const stream = decodeMultibaseToStreamID(streamState.dimensions.model)
    return stream.toString()
  }

  /** Retrieve a model's JSON definition based on the model's stream ID*/
  async getModelDefinition(
    streamID: StreamID | string,
  ): Promise<ModelDefinition> {
    const id =
      typeof streamID === 'string' ? StreamID.fromString(streamID) : streamID
    const streamState = await this.getStreamState(id)
    const decodedData = decodeMultibaseToJSON(streamState.data)
      .content as ModelDefinition
    return decodedData
  }
}
