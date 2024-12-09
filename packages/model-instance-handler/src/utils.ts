import { DocumentDataEventPayload } from '@ceramic-sdk/model-instance-protocol'
import type { ModelDefinition } from '@ceramic-sdk/model-protocol'
import { fromString as bytesFromString } from 'uint8arrays'

import type { DocumentState, UnknownContent } from './types.js'

export function getImmutableFieldsToCheck(
  definition: ModelDefinition,
  state: DocumentState,
): Array<string> | null {
  if (
    // Check if model may have immutable fields defined
    definition.version === '1.0' ||
    // Check if model has immutable fields defined
    definition.immutableFields == null ||
    definition.immutableFields.length === 0
  ) {
    // No immutable fields to check
    return null
  }

  // Check if the stream is deterministic
  if (['set', 'single'].includes(definition.accountRelation.type)) {
    // Should check immutable fields if there is already a data event present, otherwise it is the first data event that sets the content of the deterministic stream
    return state.log.some(DocumentDataEventPayload.is)
      ? definition.immutableFields
      : []
  }

  // Should check immutable fields for all data events on non-deterministic streams
  return definition.immutableFields
}

export function encodeUniqueFieldsValue(values: Array<string>): Uint8Array {
  return bytesFromString(values.join('|'))
}

export function getUniqueFieldsValue(
  fields: Array<string>,
  content: UnknownContent,
): Uint8Array {
  const values = fields.map((field) => {
    const value = content[field]
    return value ? String(value) : ''
  })
  return encodeUniqueFieldsValue(values)
}
