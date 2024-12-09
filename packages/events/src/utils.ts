import { StreamID } from '@ceramic-sdk/identifiers'
import { bases } from 'multiformats/basics'
import type { CID } from 'multiformats/cid'
import { toString as bytesToString, fromString } from 'uint8arrays'

/** @internal */
export const MAX_BLOCK_SIZE = 256000 // 256 KB

/** @internal */
export function base64urlToJSON<T = Record<string, unknown>>(value: string): T {
  return JSON.parse(bytesToString(fromString(value, 'base64url')))
}

export function decodeMultibase(multibaseString: string): Uint8Array {
  const prefix = multibaseString[0]
  const baseEntry = Object.values(bases).find((base) => base.prefix === prefix)
  if (!baseEntry) {
    throw new Error(`Unsupported multibase prefix: ${prefix}`)
  }

  return baseEntry.decode(multibaseString) // Remove prefix and decode
}

export function decodeMultibaseToJSON<T = Record<string, unknown>>(
  value: string,
): T {
  const data = decodeMultibase(value)
  return JSON.parse(new TextDecoder().decode(data))
}

export function decodeMultibaseToStreamID(value: string): StreamID {
  return StreamID.fromBytes(decodeMultibase(value))
}

/**
 * Restricts block size to MAX_BLOCK_SIZE.
 *
 * @param block - Uint8Array of IPLD block
 * @param cid - Commit CID
 * @internal
 */
export function restrictBlockSize(block: Uint8Array, cid: CID): void {
  const size = block.byteLength
  if (size > MAX_BLOCK_SIZE) {
    throw new Error(
      `${cid} commit size ${size} exceeds the maximum block size of ${MAX_BLOCK_SIZE}`,
    )
  }
}


