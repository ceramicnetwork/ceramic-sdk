import {
  InitEventHeader,
  type SignedEvent,
  createSignedInitEvent,
  signEvent,
} from '@ceramic-sdk/events'
import type { CommitID, StreamID } from '@ceramic-sdk/identifiers'
import {
  type DeterministicInitEventPayload,
  type DocumentDataEventHeader,
  DocumentDataEventPayload,
  type EncodedDeterministicInitEventPayload,
  type JSONPatchOperation,
  assertValidContentLength,
  assertValidPatchOperations,
} from '@ceramic-sdk/model-instance-protocol'
import type { DIDString } from '@didtools/codecs'
import type { DID } from 'dids'

import type { UnknownContent } from './types.js'
import { createInitHeader, getPatchOperations } from './utils.js'

export type CreateInitEventParams<T extends UnknownContent = UnknownContent> = {
  /** Initial JSON object content for the ModelInstanceDocument stream */
  content: T
  /** DID controlling the ModelInstanceDocument stream */
  controller: DID
  /** Stream ID of the Model used by the ModelInstanceDocument stream */
  model: StreamID
  /** Optional context */
  context?: StreamID
  /** Flag notifying indexers if they should index the ModelInstanceDocument stream or not, defaults to `true` */
  shouldIndex?: boolean
}

/**
 * Create a non-deterministic init event for a ModelInstanceDocument stream.
 * @see {@link getDeterministicInitEventPayload} for deterministic events.
 */
export async function createInitEvent<
  T extends UnknownContent = UnknownContent,
>(params: CreateInitEventParams<T>): Promise<SignedEvent> {
  const { content, controller, ...headerParams } = params
  assertValidContentLength(content)
  const header = createInitHeader({
    ...headerParams,
    controller: controller.id,
    unique: false, // non-deterministic event
  })
  return await createSignedInitEvent(controller, content, header)
}

/**
 * Get a deterministic init event payload for a ModelInstanceDocument stream.
 * @see {@link createInitEvent} for creating non-deterministic events.
 */
export function getDeterministicInitEventPayload(
  model: StreamID,
  controller: DIDString | string,
  uniqueValue?: Uint8Array,
): DeterministicInitEventPayload {
  return {
    data: null,
    header: createInitHeader({
      model,
      controller,
      unique: uniqueValue ?? true,
    }),
  }
}

/**
 * Get an encoded deterministic init event for a ModelInstanceDocument stream
 */
export function getDeterministicInitEvent(
  model: StreamID,
  controller: DIDString | string,
  uniqueValue?: Uint8Array,
): EncodedDeterministicInitEventPayload {
  const { header } = getDeterministicInitEventPayload(
    model,
    controller,
    uniqueValue,
  )
  // @ts-ignore: "sep" value is typed as string rather than "model" literal
  return { data: null, header: InitEventHeader.encode(header) }
}

/**
 * Create a data event payload for a ModelInstanceDocument stream
 */
export function createDataEventPayload(
  current: CommitID,
  data: Array<JSONPatchOperation>,
  header?: DocumentDataEventHeader,
): DocumentDataEventPayload {
  assertValidPatchOperations(data)
  const payload: DocumentDataEventPayload = {
    data,
    id: current.baseID.cid,
    prev: current.commit,
  }
  if (header != null) {
    payload.header = header
  }
  if (!DocumentDataEventPayload.is(payload)) {
    throw new Error('Invalid payload')
  }
  return payload
}

export type CreateDataEventParams<T extends UnknownContent = UnknownContent> = {
  /** DID controlling the ModelInstanceDocument stream */
  controller: DID
  /** Commit ID of the current tip of the ModelInstanceDocument stream */
  currentID: CommitID
  /** Current JSON object content for the ModelInstanceDocument stream, used with `newContent` to create the JSON patch */
  currentContent?: T
  /** New JSON object content for the ModelInstanceDocument stream, used with `currentContent` to create the JSON patch */
  newContent?: T
  /** Flag notifying indexers if they should index the ModelInstanceDocument stream or not */
  shouldIndex?: boolean
}

/**
 * Create a signed data event for a ModelInstanceDocument stream
 */
export async function createDataEvent<
  T extends UnknownContent = UnknownContent,
>(params: CreateDataEventParams<T>): Promise<SignedEvent> {
  const operations = getPatchOperations(
    params.currentContent,
    params.newContent,
  )
  // Header must only be provided if there are values
  // CBOR encoding doesn't support undefined values
  const header =
    params.shouldIndex == null ? undefined : { shouldIndex: params.shouldIndex }
  const payload = createDataEventPayload(params.currentID, operations, header)
  return await signEvent(params.controller, payload)
}
