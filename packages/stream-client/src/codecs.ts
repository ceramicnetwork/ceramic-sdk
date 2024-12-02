import {
  type TypeOf,
  array,
  boolean,
  literal,
  optional,
  sparse,
  strict,
  string,
  union,
  unknown,
} from "codeco";
import { cid } from "@didtools/codecs";
import "multiformats"; // Import needed for TS reference

/**
 * JSON patch operations.
 */

export const JSONPatchAddOperation = strict(
  {
    op: literal("add"),
    path: string,
    value: unknown,
  },
  "JSONPatchAddOperation"
);

export const JSONPatchRemoveOperation = strict(
  {
    op: literal("remove"),
    path: string,
  },
  "JSONPatchRemoveOperation"
);

export const JSONPatchReplaceOperation = strict(
  {
    op: literal("replace"),
    path: string,
    value: unknown,
  },
  "JSONPatchReplaceOperation"
);

export const JSONPatchMoveOperation = strict(
  {
    op: literal("move"),
    path: string,
    from: string,
  },
  "JSONPatchMoveOperation"
);

export const JSONPatchCopyOperation = strict(
  {
    op: literal("copy"),
    path: string,
    from: string,
  },
  "JSONPatchCopyOperation"
);

export const JSONPatchTestOperation = strict(
  {
    op: literal("test"),
    path: string,
    value: unknown,
  },
  "JSONPatchTestOperation"
);

export const JSONPatchOperation = union(
  [
    JSONPatchAddOperation,
    JSONPatchRemoveOperation,
    JSONPatchReplaceOperation,
    JSONPatchMoveOperation,
    JSONPatchCopyOperation,
    JSONPatchTestOperation,
  ],
  "JSONPatchOperation"
);
export type JSONPatchOperation = TypeOf<typeof JSONPatchOperation>;

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
