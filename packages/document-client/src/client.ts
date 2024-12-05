import { InitEventPayload, SignedEvent } from '@ceramic-sdk/events'
import { CommitID, type StreamID } from '@ceramic-sdk/identifiers'
import {
  DocumentEvent,
  getStreamID,
} from '@ceramic-sdk/model-instance-protocol'
import { StreamClient } from '@ceramic-sdk/stream-client'
import type { DIDString } from '@didtools/codecs'
import type { DID } from 'dids'

import {
  type CreateDataEventParams,
  type CreateInitEventParams,
  createDataEvent,
  createInitEvent,
  getDeterministicInitEventPayload,
} from './events.js'
import type { UnknownContent } from './types.js'

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

export class DocumentClient extends StreamClient {
  /** Get a DocumentEvent based on its commit ID */
  async getEvent(commitID: CommitID | string): Promise<DocumentEvent> {
    const id =
      typeof commitID === 'string' ? CommitID.fromString(commitID) : commitID
    return (await this.ceramic.getEventType(
      DocumentEvent,
      id.commit.toString(),
    )) as DocumentEvent
  }

  /** Post a deterministic init event and return its commit ID */
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

  /** Post a signed (non-deterministic) init event and return its commit ID */
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
}
