import { DocumentInitEventHeader } from '@ceramic-sdk/document-protocol'
import type { StreamID } from '@ceramic-sdk/identifiers'
import { type DIDString, asDIDString } from '@didtools/codecs'
import { decode } from 'codeco'

export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

export type CreateInitHeaderParams = {
  model: StreamID
  controller: DIDString | string
  unique?: Uint8Array | boolean
  context?: StreamID
  shouldIndex?: boolean
}

export function createInitHeader(
  params: CreateInitHeaderParams,
): DocumentInitEventHeader {
  const header: DocumentInitEventHeader = {
    controllers: [asDIDString(params.controller)],
    model: params.model,
    sep: 'model',
  }

  // Handle unique field
  if (params.unique == null || params.unique === false) {
    // Generate a random unique value (account relation of type "list")
    header.unique = randomBytes(12)
  } else if (params.unique instanceof Uint8Array) {
    // Use the provided unique value (account relation of type "set")
    header.unique = params.unique
  } // Otherwise don't set any unique value (account relation of type "single")

  // Add optional fields
  if (params.context != null) {
    header.context = params.context
  }
  if (params.shouldIndex != null) {
    header.shouldIndex = params.shouldIndex
  }

  // Validate header before returning
  return decode(DocumentInitEventHeader, header)
}
