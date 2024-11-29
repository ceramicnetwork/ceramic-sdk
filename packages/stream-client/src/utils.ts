import type { CommitID } from "@ceramic-sdk/identifiers";
import type { DID } from "dids";
import { type SignedEvent, signEvent } from "@ceramic-sdk/events";
import { type JSONPatchOperation } from "@ceramic-sdk/model-instance-protocol";
import jsonpatch from "fast-json-patch";
import { GenericDataEventHeader, GenericDataEventPayload } from "./codecs.js";

export type UnknownContent = Record<string, unknown>;

export type CreateDataEventParams<T extends UnknownContent = UnknownContent> = {
  /** DID controlling the stream */
  controller: DID;
  /** Commit ID of the current tip of the stream */
  currentID: CommitID;
  /** Current JSON object content for the stream, used with `newContent` to create the JSON patch */
  currentContent?: T;
  /** New JSON object content for the stream, used with `currentContent` to create the JSON patch */
  newContent?: T;
  /** Flag notifying indexers if they should index the stream or not */
  shouldIndex?: boolean;
};

/** @internal */
export function getPatchOperations<T extends UnknownContent = UnknownContent>(
  fromContent?: T,
  toContent?: T
): Array<JSONPatchOperation> {
  return jsonpatch.compare(
    fromContent ?? {},
    toContent ?? {}
  ) as Array<JSONPatchOperation>;
}

/**
 * Create a data event payload for a generic stream
 */
export function createDataEventPayload(
  current: CommitID,
  data: Array<JSONPatchOperation>,
  header?: GenericDataEventHeader
): GenericDataEventPayload {
  const payload: GenericDataEventPayload = {
    data,
    id: current.baseID.cid,
    prev: current.commit,
  };
  if (header != null) {
    payload.header = header;
  }
  if (!GenericDataEventPayload.is(payload)) {
    throw new Error("Invalid payload");
  }
  return payload;
}

export async function createDataEvent<
  T extends UnknownContent = UnknownContent,
>(params: CreateDataEventParams<T>): Promise<SignedEvent> {
  const operations = getPatchOperations(
    params.currentContent,
    params.newContent
  );
  // Header must only be provided if there are values
  // CBOR encoding doesn't support undefined values
  const header =
    params.shouldIndex == null
      ? undefined
      : { shouldIndex: params.shouldIndex };
  const payload = createDataEventPayload(params.currentID, operations, header);
  return await signEvent(params.controller, payload);
}
