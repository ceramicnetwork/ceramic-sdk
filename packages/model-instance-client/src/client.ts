import {
  InitEventPayload,
  SignedEvent,
  decodeMultibaseToJSON,
  decodeMultibaseToStreamID,
} from '@ceramic-sdk/events'
import { CommitID, StreamID } from '@ceramic-sdk/identifiers'
import {
  DocumentEvent,
  getStreamID,
} from '@ceramic-sdk/model-instance-protocol'
import { StreamClient, type StreamState } from '@ceramic-sdk/stream-client'
import type { DIDString } from '@didtools/codecs'
import type { DID } from 'dids'
import {
  type CreateDataEventParams,
  type CreateInitEventParams,
  type PostDataEventParams,
  createDataEvent,
  createInitEvent,
  getDeterministicInitEventPayload,
} from './events.js'
import type { DocumentState, UnknownContent } from './types.js'

export type PostDeterministicInitParams = {
  model: StreamID
  controller: DIDString | string
  uniqueValue?: Uint8Array
}

export type PostSignedInitParams<T extends UnknownContent = UnknownContent> =
  Omit<CreateInitEventParams<T>, 'controller'> & {
    controller?: DID
  }

export type PostDataParams<T extends UnknownContent = UnknownContent> = Omit<
  CreateDataEventParams<T>,
  'controller'
> & {
  controller?: DID
}

export type UpdateDataParams<T extends UnknownContent = UnknownContent> = Omit<
  PostDataEventParams<T>,
  'controller'
> & {
  controller?: DID
}

export class ModelInstanceClient extends StreamClient {
  /** Get a DocumentEvent based on its commit ID */
  async getEvent(commitID: CommitID | string): Promise<DocumentEvent> {
    const id =
      typeof commitID === 'string' ? CommitID.fromString(commitID) : commitID
    return (await this.ceramic.getEventType(
      DocumentEvent,
      id.commit.toString(),
    )) as DocumentEvent
  }

  /**
   * Post a deterministic init event and return its commit ID
   *
   * @remarks This method is used to post an init event that is deterministic, meaning that the
   * resulting stream ID is derived from the uniqueValue parameter. This is used when creating
   * model instance documents of type `set` and `single`.
   *
   * @param params - Parameters for posting a deterministic init event
   * @returns Commit ID of the posted event
   *
   */
  async postDeterministicInit(
    params: PostDeterministicInitParams,
  ): Promise<CommitID> {
    const event = getDeterministicInitEventPayload(
      params.model,
      params.controller,
      params.uniqueValue,
    )
    const cid = await this.ceramic.postEventType(InitEventPayload, event)
    return CommitID.fromStream(getStreamID(cid))
  }

  /**
   * Post a signed init event and return its commit ID
   *
   * @remarks This method is used to post an init event that is non-deterministic, meaning that the
   * resulting stream ID is not derived from the uniqueValue parameter. This is used when creating
   * model instance documents of type `list`.
   *
   * @param params - Parameters for posting a signed init event
   * @returns Commit ID of the posted event
   */
  async postSignedInit<T extends UnknownContent = UnknownContent>(
    params: PostSignedInitParams<T>,
  ): Promise<CommitID> {
    const { controller, ...rest } = params
    const event = await createInitEvent({
      ...rest,
      controller: this.getDID(controller),
    })
    const cid = await this.ceramic.postEventType(SignedEvent, event)
    return CommitID.fromStream(getStreamID(cid))
  }

  /** Post a data event and return its commit ID */
  async postData<T extends UnknownContent = UnknownContent>(
    params: PostDataParams<T>,
  ): Promise<CommitID> {
    const { controller, ...rest } = params
    const event = await createDataEvent({
      ...rest,
      controller: this.getDID(controller),
    })
    const cid = await this.ceramic.postEventType(SignedEvent, event)
    return CommitID.fromStream(params.currentID.baseID, cid)
  }

  /** Gets currentID */
  getCurrentID(streamID: string): CommitID {
    return new CommitID(3, streamID)
  }

  /** Transform StreamState into DocumentState */
  streamStateToDocumentState(streamState: StreamState): DocumentState {
    const decodedData = decodeMultibaseToJSON(streamState.data)
    const controller = streamState.controller
    const modelID = decodeMultibaseToStreamID(streamState.dimensions.model)
    return {
      content: decodedData.content as UnknownContent | null,
      metadata: {
        model: modelID,
        controller: controller as DIDString,
        ...(typeof decodedData.metadata === 'object'
          ? decodedData.metadata
          : {}),
      },
    }
  }

  /** Retrieve and return document state */
  async getDocumentState(streamID: StreamID | string): Promise<DocumentState> {
    const id =
      typeof streamID === 'string' ? StreamID.fromString(streamID) : streamID
    const streamState = await this.getStreamState(id)
    return this.streamStateToDocumentState(streamState)
  }

  /**
   * Update a document with new content and return the updated document state
   *
   * @remarks This method is used to update the content of a document. The new content is
   * posted as a data event and the document state is returned with the updated content. The
   * document's current state can be provided as a parameter to avoid fetching it from the
   * Ceramic node.
   *
   * @param params - Parameters for updating a document
   * @returns Updated document state
   */
  async updateDocument<T extends UnknownContent = UnknownContent>(
    params: UpdateDataParams<T>,
  ): Promise<DocumentState> {
    let currentState: DocumentState
    let currentId: CommitID
    // If currentState is not provided, fetch the current state
    if (!params.currentState) {
      const streamState = await this.getStreamState(
        StreamID.fromString(params.streamID),
      )
      currentState = this.streamStateToDocumentState(streamState)
      currentId = this.getCurrentID(streamState.event_cid)
    } else {
      currentState = this.streamStateToDocumentState(params.currentState)
      currentId = this.getCurrentID(params.currentState.event_cid)
    }
    const { content } = currentState
    const { controller, newContent, shouldIndex } = params
    // Use existing postData utility to access the ceramic api
    await this.postData({
      controller: this.getDID(controller),
      currentContent: content ?? undefined,
      newContent: newContent,
      currentID: currentId,
      shouldIndex: shouldIndex,
    })
    return {
      content: params.newContent,
      metadata: {
        model: currentState.metadata.model,
        controller: currentState.metadata.controller,
        ...(typeof currentState.metadata === 'object'
          ? currentState.metadata
          : {}),
      },
    }
  }
}
