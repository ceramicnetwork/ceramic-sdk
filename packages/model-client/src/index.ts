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
  getModelStreamID,
} from '@ceramic-sdk/model-protocol'
import { StreamClient } from '@ceramic-sdk/stream-client'
import type { DID } from 'dids'

const header: PartialInitEventHeader = { model: MODEL, sep: 'model' }

/**
 * Creates a signed initialization event for a model using the provided DID and model definition.
 *
 * @param did - The Decentralized Identifier (DID) to sign the initialization event.
 * @param data - The model definition to be signed.
 * @returns A promise that resolves to a `SignedEvent` representing the initialization event.
 *
 * @throws Will throw an error if the model content is invalid or the DID is not authenticated.
 */
export async function createInitEvent(
  did: DID,
  data: ModelDefinition,
): Promise<SignedEvent> {
  if (!did.authenticated) {
    await did.authenticate()
  }
  const event = await createSignedInitEvent(did, data, header)
  return event
}

/**
 * Represents a client for interacting with Ceramic models.
 *
 * The `ModelClient` class extends the `StreamClient` class to provide additional
 * methods specific to working with Ceramic models, including fetching and creating
 * model definitions, retrieving initialization events, and decoding stream data.
 */
export class ModelClient extends StreamClient {
  /**
   * Retrieves the signed initialization event of a model based on its stream ID.
   *
   * @param streamID - The stream ID of the model, either as a `StreamID` object or string.
   * @returns A promise that resolves to the `SignedEvent` for the model.
   *
   * @throws Will throw an error if the stream ID is invalid or the request fails.
   */
  async getInitEvent(streamID: StreamID | string): Promise<SignedEvent> {
    const id =
      typeof streamID === 'string' ? StreamID.fromString(streamID) : streamID
    return await this.ceramic.getEventType(SignedEvent, id.cid.toString())
  }

  /**
   * Retrieves the payload of the initialization event for a model based on its stream ID.
   *
   * @param streamID - The stream ID of the model, either as a `StreamID` object or string.
   * @param verifier - (Optional) A `DID` instance for verifying the event payload.
   * @returns A promise that resolves to the `ModelInitEventPayload`.
   *
   * @throws Will throw an error if the event or payload is invalid or verification fails.
   */
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

  /**
   * Creates a model definition and returns the resulting stream ID.
   *
   * @param definition - The model JSON definition to post.
   * @param signer - (Optional) A `DID` instance for signing the model definition.
   * @returns A promise that resolves to the `StreamID` of the posted model.
   *
   * @throws Will throw an error if the definition is invalid or the signing process fails.
   */
  async createDefinition(
    definition: ModelDefinition,
    signer?: DID,
  ): Promise<StreamID> {
    const did = this.getDID(signer)
    const event = await createInitEvent(did, definition)
    const cid = await this.ceramic.postEventType(SignedEvent, event)
    return getModelStreamID(cid)
  }

  /**
   * Retrieves the stringified model stream ID from a model instance document stream ID.
   *
   * @param streamID - The document stream ID, either as a `StreamID` object or string.
   * @returns A promise that resolves to the stringified model stream ID.
   *
   * @throws Will throw an error if the stream ID or its state is invalid.
   */
  async getDocumentModel(streamID: StreamID | string): Promise<string> {
    const id =
      typeof streamID === 'string' ? StreamID.fromString(streamID) : streamID
    const streamState = await this.getStreamState(id)
    const stream = decodeMultibaseToStreamID(streamState.dimensions.model)
    return stream.toString()
  }

  /**
   * Retrieves a model's JSON definition based on the model's stream ID.
   *
   * @param streamID - The stream ID of the model, either as a `StreamID` object or string.
   * @returns A promise that resolves to the `ModelDefinition` for the specified model.
   *
   * @throws Will throw an error if the stream ID is invalid or the data cannot be decoded.
   */
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
