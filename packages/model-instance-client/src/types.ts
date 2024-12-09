import type { DocumentMetadata } from '@ceramic-sdk/model-instance-protocol'

export type UnknownContent = Record<string, unknown>

export type DocumentState = {
  content: UnknownContent | null
  metadata: DocumentMetadata
}
