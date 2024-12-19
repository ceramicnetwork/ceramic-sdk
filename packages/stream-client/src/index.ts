import { type CeramicClient, getCeramicClient } from '@ceramic-sdk/http-client'
import type { StreamID } from '@ceramic-sdk/identifiers'
import type { DID } from 'dids'

export type StreamState = {
  /** Multibase encoding of the stream id */
  id: string
  /** CID of the event that produced this state */
  event_cid: string
  /** Controller of the stream */
  controller: string
  /** Dimensions of the stream, each value is multibase encoded */
  dimensions: Record<string, string>
  /** Multibase encoding of the data of the stream. Content is stream type specific */
  data: string
}

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

  /**
   * Get the state of a stream by its ID
   * @param streamId - Multibase encoded stream ID
   * @returns The StreamState object of the stream
   */
  async getStreamState(streamId: StreamID | string): Promise<StreamState> {
    const { data, error } = await this.#ceramic.api.GET(
      '/streams/{stream_id}',
      {
        params: {
          path: {
            stream_id:
              typeof streamId === 'string' ? streamId : streamId.toString(),
          },
        },
      },
    )

    if (error != null) {
      throw new Error(error.message)
    }

    return data
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
