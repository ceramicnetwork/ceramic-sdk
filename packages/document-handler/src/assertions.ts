import {
  type DocumentDataEventPayload,
  type DocumentInitEventHeader,
  type DocumentMetadata,
  type JSONPatchOperation,
  getStreamID,
} from '@ceramic-sdk/document-protocol'
import type { TimeEvent } from '@ceramic-sdk/events'
import type { JSONSchema, ModelDefinition } from '@ceramic-sdk/model-protocol'
import addFormats from 'ajv-formats'
import Ajv from 'ajv/dist/2020.js'
import { equals } from 'uint8arrays'

import type { DocumentState, UnknowContent } from './types.js'
import { getUniqueFieldsValue } from './utils.js'

const validator = new Ajv({
  strict: true,
  allErrors: true,
  allowMatchingProperties: false,
  ownProperties: false,
  unevaluated: false,
})
addFormats(validator)

/**
 * Helper function to validate if immutable fields are being mutated
 */
export function assertNoImmutableFieldChange(
  operations: Array<JSONPatchOperation>,
  immutableFields: Array<string> = [],
): void {
  if (immutableFields.length === 0) {
    return
  }
  const fields = new Set(immutableFields)
  for (const entry of operations) {
    const fieldName = entry.path.slice(1).split('/').shift()
    if (fieldName != null && fields.has(fieldName)) {
      throw new Error(`Immutable field "${fieldName}" cannot be updated`)
    }
  }
}

export function assertValidContent<T extends UnknowContent>(
  modelID: string,
  modelSchema: JSONSchema.Object,
  content: unknown,
): asserts content is T {
  let validate = validator.getSchema(modelID)
  if (validate == null) {
    validator.addSchema(modelSchema, modelID)
    // biome-ignore lint/style/noNonNullAssertion: we've added the schema above, so ajv will have it
    validate = validator.getSchema(modelID)!
  }
  const isValid = validate(content)

  if (!isValid) {
    const errorMessages = validator.errorsText(validate.errors)
    throw new Error(`Validation Error: ${errorMessages}`)
  }
}

/**
 * Validates the ModelInstanceDocument header against the Model definition.
 * @param definition - definition of the Model that this ModelInstanceDocument belongs to
 * @param header - the header to validate
 */
export function assertValidInitHeader(
  definition: ModelDefinition,
  header: DocumentInitEventHeader,
): void {
  const relationType = definition.accountRelation.type
  switch (relationType) {
    case 'single':
      if (header.unique) {
        throw new Error(
          'ModelInstanceDocuments for models with SINGLE accountRelations must be created deterministically',
        )
      }
      break
    case 'set':
      if (!header.unique) {
        throw new Error(
          'ModelInstanceDocuments for models with SET accountRelations must be created with a unique field containing data from the fields providing the set semantics',
        )
      }
      break
    case 'list':
      if (!header.unique) {
        throw new Error(
          'ModelInstanceDocuments for models with LIST accountRelations must be created with a unique field',
        )
      }
      break
    case 'none':
      throw new Error(
        `ModelInstanceDocument Streams cannot be created on interface Models. Use a different model than ${definition.name} to create the ModelInstanceDocument.`,
      )
    default:
      throw new Error(
        `Unsupported account relation ${relationType} found in Model ${definition.name}`,
      )
  }
}

/*
 * Validates the ModelInstanceDocument unique constraints against the Model definition.
 * @param definition - definition of the Model that this ModelInstanceDocument belongs to
 * @param metadata - ModelInstanceDocument metadata to validate
 * @param content - ModelInstanceDocument content to validate
 */
export function assertValidUniqueValue(
  definition: ModelDefinition,
  metadata: DocumentMetadata,
  content: UnknowContent | null,
): void {
  // Unique field validation only applies to the SET account relation
  if (definition.accountRelation.type !== 'set') {
    return
  }
  if (metadata.unique == null) {
    throw new Error('Missing unique metadata value')
  }
  if (content == null) {
    throw new Error('Missing content')
  }

  const unique = getUniqueFieldsValue(
    definition.accountRelation.fields,
    content,
  )
  if (!equals(unique, metadata.unique)) {
    throw new Error(
      'Unique content fields value does not match metadata. If you are trying to change the value of these fields, this is causing this error: these fields values are not mutable.',
    )
  }
}

/**
 * Asserts that the 'id' and 'prev' properties of the given event properly link to the tip of
 * the given document state.
 *
 * By the time the code gets into a StreamtypeHandler's applyCommit function the link to the state
 * should already have been established by the stream loading and conflict resolution code, so
 * if this check were to fail as part of a StreamtypeHandler's applyCommit function, that would
 * indicate a programming error.
 */
export function assertEventLinksToState(
  payload: DocumentDataEventPayload | TimeEvent,
  state: DocumentState,
) {
  if (state.log.length === 0) {
    throw new Error('Invalid document state: log is empty')
  }

  const initCID = state.log[0]

  // Older versions of the CAS created time events without an 'id' field, so only check
  // the event payload 'id' field if it is present.
  if (payload.id != null && !payload.id.equals(initCID)) {
    throw new Error(
      `Invalid init CID in event payload for document ${getStreamID(initCID)}. Found: ${
        payload.id
      }, expected ${initCID}`,
    )
  }

  const expectedPrev = state.log[state.log.length - 1]
  if (!payload.prev.equals(expectedPrev)) {
    throw new Error(
      `Commit doesn't properly point to previous event payload in log for document ${getStreamID(initCID)}. Expected ${expectedPrev}, found 'prev' ${payload.prev}`,
    )
  }
}
