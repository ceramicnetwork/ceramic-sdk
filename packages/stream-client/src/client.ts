import { type CeramicClient, getCeramicClient } from "@ceramic-sdk/http-client";
import type { DID } from "dids";
import { SignedEvent } from "@ceramic-sdk/events";
import { createDataEvent } from "./utils.js";
import { CommitID, StreamID, createCID } from "@ceramic-sdk/identifiers";
import type { components } from "@ceramic-sdk/http-client/src/__generated__/api.js";

export type StreamState = components["schemas"]["StreamState"];
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
   * Updates a stream by creating a diff, signing it, submitting it as a CAR file, and returns new StreamState.
   * @param streamId - Multibase encoded stream ID
   * @param newContent - The new JSON content to update the stream with
   * @param previousState - The previous state of the stream (optional)
   * @returns The updated stream state
   */
  async updateStream(
    streamId: string,
    newContent: Content,
    previousState?: StreamState
  ): Promise<StreamState> {
    try {
      // Fetch the current state if previousState isn't provided
      const currentState =
        previousState || (await this.getStreamState(streamId));

      const baseData = currentState?.data || {};

      // Determine the updated content
      const currentContent =
        typeof baseData === "string"
          ? JSON.parse(currentState.data)
          : currentState.data;

      const shouldIndex = true;

      // Obtain identifier values for the stream
      const controller = this.getDID();
      const currentCid = createCID(currentState.event_cid);
      const currentStreamId = StreamID.fromString(streamId);
      const currentID = CommitID.fromStream(currentStreamId, currentCid);

      // Create the new data event
      const event = await createDataEvent({
        controller,
        currentID,
        currentContent,
        newContent,
        shouldIndex,
      });

      const cid = await this.ceramic.postEventType(SignedEvent, event);

      // Return the updated state without performing additional read
      const commitId = CommitID.fromStream(currentStreamId, cid);
      return {
        ...currentState,
        data: JSON.stringify(newContent),
        event_cid: commitId.cid.toString(),
      };
    } catch (error) {
      throw new Error(`Failed to update stream: ${(error as Error).message}`);
    }
  }
}
