import { type CeramicClient, getCeramicClient } from "@ceramic-sdk/http-client";
import type { DID } from "dids";
import { diff } from "deep-diff";
// import {
//   InitEventPayload,
//   eventToCAR,
//   eventFromCAR,
//   signedEventToCAR,
//   signEvent,
// } from "@ceramic-sdk/events";

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
  // async updateStream(
  //   streamId: string,
  //   newContent: Content,
  //   previousState?: StreamState
  // ): Promise<StreamState> {
  //   try {
  //     // Fetch the current state if previousState isn't provided
  //     const currentState =
  //       previousState || (await this.getStreamState(streamId));

  //     // Compute the diff
  //     const currentData =
  //       typeof currentState.data === "string"
  //         ? JSON.parse(currentState.data)
  //         : currentState.data;

  //     const diff = this.computeDiff(currentData, newContent);

  //     // Construct event payload
  //     const did = this.getDID();
  //     const eventPayload: InitEventPayload = {
  //       data: newContent,
  //       header: {
  //         controllers: [did.id],
  //         model: streamId,
  //         sep: "model",
  //       },
  //     };

  //     // Encode payload and create CAR file
  //     const encodedPayload = InitEventPayload.encode(eventPayload);

  //     // Sign the event
  //     const signedEvent = await signEvent(did, encodedPayload);
  //     const signedCar = signedEventToCAR(signedEvent);

  //     // Post the event to Ceramic
  //     const cid = await this.#ceramic.postEventCAR(signedCar);

  //     // Return the updated StreamState
  //     const { data: updatedState, error: postError } =
  //       await this.#ceramic.api.GET("/streams/{stream_id}", {
  //         params: { path: { stream_id: streamId } },
  //       });
  //     if (postError)
  //       throw new Error(
  //         `Failed to fetch updated stream state: ${postError.message}`
  //       );
  //     return updatedState!;
  //   } catch (error) {
  //     throw new Error(`Failed to update stream: ${(error as Error).message}`);
  //   }
  // }
  /**
   * Compute the differences between the previous and current content.
   * @param previous - The previous content (JSON object).
   * @param current - The new content (JSON object).
   * @returns The computed diff as an array of changes.
   */
  // private computeDiff(previous: Content, current: Content): Content[] {
  //   const changes = diff(previous, current);
  //   if (!changes) {
  //     throw new Error(
  //       "No differences detected between previous and current content."
  //     );
  //   }
  //   return changes;
  // }
}
