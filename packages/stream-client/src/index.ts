import { type CeramicClient, getCeramicClient } from '@ceramic-sdk/http-client'
import type { DID } from 'dids'

export type StreamClientParams = {
  ceramic: CeramicClient | string
  did?: DID
}

export class StreamClient {
  #ceramic: CeramicClient
  #did?: DID

  constructor(params: StreamClientParams) {
    this.#ceramic = getCeramicClient(params.ceramic)
    this.#did = params.did
  }

  get ceramic(): CeramicClient {
    return this.#ceramic
  }

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
