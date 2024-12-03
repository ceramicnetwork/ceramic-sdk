import { type TypeOf, record, boolean, optional, sparse, string } from "codeco";
import { cid, uint8array } from "@didtools/codecs";
import "multiformats"; // Import needed for TS reference

export const Dimensions = record(string, uint8array);
export type Dimensions = TypeOf<typeof Dimensions>;

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
    data: string,
    prev: cid,
    id: cid,
    header: optional(GenericDataEventHeader),
    dimensions: optional(Dimensions),
  },
  "DocumentDataEventPayload"
);
export type GenericDataEventPayload = TypeOf<typeof GenericDataEventPayload>;
