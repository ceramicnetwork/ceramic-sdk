import { type CeramicClient, getCeramicClient } from '@ceramic-sdk/http-client'
import type { DID } from 'dids'

export type StreamClientParams = {
  /** Ceramic HTTP client instance or Ceramic One server URL */
  ceramic: CeramicClient | string
  /** DID to use by default in method calls */
  did?: DID
}

export class StreamClient {
  #ceramic: CeramicClient
  #did?: DID

  constructor(params: StreamClientParams) {
    this.#ceramic = getCeramicClient(params.ceramic)
    this.#did = params.did
  }

  /** Ceramic HTTP client instance used to interact with Ceramic One server */
  get ceramic(): CeramicClient {
    return this.#ceramic
  }

  /** Utility method used to access the provided DID or the one attached to the instance, throws if neither is provided */
  getDID(provided?: DID): DID {
    if (provided != null) {
      return provided
    }
    if (this.#did != null) {
      return this.#did
    }
    throw new Error('Missing DID')
  }
}
