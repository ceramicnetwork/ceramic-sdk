import { type CeramicClient, getCeramicClient } from "@ceramic-sdk/http-client";
import type { DID } from "dids";
import { getSignedEventPayload, SignedEvent } from "@ceramic-sdk/events";
import { GenericDataEventPayload } from "./codecs.js";

export type StreamState = {
  /** Multibase encoding of the stream id */
  id: string;
  /** CID of the event that produced this state */
  event_cid: string;
  /** Controller of the stream */
  controller: string;
  /** Dimensions of the stream, each value is multibase encoded */
  dimensions: Record<string, Uint8Array>;
  /** Multibase encoding of the data of the stream. Content is stream type specific */
  data: string;
};

export type Content = Record<string, any>;

export type StreamClientParams = {
  /** Ceramic HTTP client instance or Ceramic One server URL */
  ceramic: CeramicClient | string;
  /** DID to use by default in method calls */
  did?: DID;
};

export class StreamClient {
  #ceramic: CeramicClient;
  #did?: DID;

  constructor(params: StreamClientParams) {
    this.#ceramic = getCeramicClient(params.ceramic);
    this.#did = params.did;
  }

  /** Ceramic HTTP client instance used to interact with Ceramic One server */
  get ceramic(): CeramicClient {
    return this.#ceramic;
  }

  /** Utility method used to access the provided DID or the one attached to the instance, throws if neither is provided */
  getDID(provided?: DID): DID {
    if (provided != null) {
      return provided;
    }
    if (this.#did != null) {
      return this.#did;
    }
    throw new Error("Missing DID");
  }

  /**
   * Get the state of a stream by its ID
   * @param streamId - Multibase encoded stream ID
   * @returns The state of the stream
   */
  async getStreamState(streamId: string): Promise<StreamState> {
    const { data, error } = await this.#ceramic.api.GET(
      "/streams/{stream_id}",
      {
        params: { path: { stream_id: streamId } },
      }
    );

    if (error != null) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Posts an update to a stream and returns new StreamState.
   * @param signedEvent - A DID-signed event to post to the http-client
   * @param streamId - The stream ID to update
   * @returns The updated stream state
   */
  async postData(streamId: string, signedEvent: SignedEvent): Promise<StreamState> {
    try {
      // Post the data event using the http-client
      const cid = await this.ceramic.postEventType(SignedEvent, signedEvent);

      // get the new stream state from the signed event
      const payload = await getSignedEventPayload(
        GenericDataEventPayload,
        signedEvent
      );

      // Return the updated state without performing additional read
      return {
        id: streamId,
        controller: this.getDID().id,
        dimensions: payload.dimensions || {},
        data: JSON.stringify(payload.data),
        event_cid: cid.toString(),
      };
    } catch (error) {
      throw new Error(`Failed to update stream: ${(error as Error).message}`);
    }
  }
}
