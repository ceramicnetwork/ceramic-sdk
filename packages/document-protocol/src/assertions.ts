import sizeof from 'object-sizeof'

import { MAX_DOCUMENT_SIZE } from './constants.js'

/**
 * Validate that content does not exceed the maximum allowed
 * @param content Content to validate
 */
export function assertValidContentLength(content: unknown) {
  if (content != null) {
    const contentLength = sizeof(content)
    if (contentLength > MAX_DOCUMENT_SIZE) {
      throw new Error(
        `Content has size of ${contentLength}B which exceeds maximum size of ${MAX_DOCUMENT_SIZE}B`,
      )
    }
  }
}
