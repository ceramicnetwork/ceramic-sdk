import { type CeramicClient, getCeramicClient } from "@ceramic-sdk/http-client";
import type { DID } from "dids";
import { CID } from "multiformats/cid";
import { signedEventToCAR } from "@ceramic-sdk/events";
import { createDataEvent } from "./utils.js";
import { CommitID, StreamID } from "@ceramic-sdk/identifiers";
import type { components } from "@ceramic-sdk/http-client/src/__generated__/api";

type StreamState = components["schemas"]["StreamState"];
type Content = Record<string, any>;

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
   * Updates a stream by creating a diff, signing it, and submitting it as a CAR file.
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
      const currentData =
        typeof baseData === "string"
          ? JSON.parse(currentState.data)
          : currentState.data;

      // Obtain identifier values for the stream
      const did = this.getDID();
      const currentCid = CID.parse(currentState.event_cid);
      const currentStreamId = StreamID.fromString(streamId);
      const currentCommitId = CommitID.fromStream(currentStreamId, currentCid);

      // Create the new data event
      const signedDataEvent = await createDataEvent({
        controller: did,
        currentID: currentCommitId,
        currentContent: currentData,
        newContent,
        shouldIndex: true,
      });

      // Convert the signed event to a CAR file
      const signedCar = signedEventToCAR(signedDataEvent);

      // Post the event to Ceramic
      await this.#ceramic.postEventCAR(signedCar);

      // Return the updated StreamState
      const { data: updatedState, error: postError } =
        await this.#ceramic.api.GET("/streams/{stream_id}", {
          params: { path: { stream_id: streamId } },
        });
      if (postError)
        throw new Error(
          `Failed to fetch updated stream state: ${postError.message}`
        );
      return updatedState;
    } catch (error) {
      throw new Error(`Failed to update stream: ${(error as Error).message}`);
    }
  }
}
