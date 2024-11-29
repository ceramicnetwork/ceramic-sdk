import { JSONPatchOperation } from "@ceramic-sdk/model-instance-protocol";
import { type TypeOf, array, boolean, optional, sparse } from "codeco";
import { cid } from "@didtools/codecs";
import "multiformats"; // Import needed for TS reference

/**
 * Data event header for a generic Stream
 */
export const GenericDataEventHeader = sparse(
  {
    shouldIndex: optional(boolean),
  },
  "GenericDataEventHeader"
);
export type GenericDataEventHeader = TypeOf<typeof GenericDataEventHeader>;

/**
 * Data event payload for a generic Stream
 */
export const GenericDataEventPayload = sparse(
  {
    data: array(JSONPatchOperation),
    prev: cid,
    id: cid,
    header: optional(GenericDataEventHeader),
  },
  "DocumentDataEventPayload"
);
export type GenericDataEventPayload = TypeOf<typeof GenericDataEventPayload>;
