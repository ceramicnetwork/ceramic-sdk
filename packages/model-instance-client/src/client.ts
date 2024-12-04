import { InitEventPayload, SignedEvent } from "@ceramic-sdk/events";
import { CommitID, createCID, type StreamID } from "@ceramic-sdk/identifiers";
import {
  DocumentEvent,
  getStreamID,
} from "@ceramic-sdk/model-instance-protocol";
import { StreamClient, StreamState } from "@ceramic-sdk/stream-client";
import type { DIDString } from "@didtools/codecs";
import type { DID } from "dids";

import {
  type CreateDataEventParams,
  type CreateInitEventParams,
  createDataEvent,
  createInitEvent,
  getDeterministicInitEventPayload,
} from "./events.js";
import type { UnknownContent } from "./types.js";

export type PostDeterministicInitParams = {
  model: StreamID;
  controller: DIDString | string;
  uniqueValue?: Uint8Array;
};

export type PostSignedInitParams<T extends UnknownContent = UnknownContent> =
  Omit<CreateInitEventParams<T>, "controller"> & {
    controller?: DID;
  };

export type PostDataParams<T extends UnknownContent = UnknownContent> = Omit<
  CreateDataEventParams<T>,
  "controller"
> & {
  controller?: DID;
};

export type UpdateDocumentParams<T extends UnknownContent = UnknownContent> = {
  id: string; // the stream ID of the document
  newContent: T;
  currentState: StreamState;
  shouldIndex?: boolean;
};

export type UpdatedDocumentState = {
  id: string;
  // metadata: DocumentMetadata
  content: Record<string, any>;
};

export class DocumentClient extends StreamClient {
  /** Get a DocumentEvent based on its commit ID */
  async getEvent(commitID: CommitID | string): Promise<DocumentEvent> {
    const id =
      typeof commitID === "string" ? CommitID.fromString(commitID) : commitID;
    return (await this.ceramic.getEventType(
      DocumentEvent,
      id.commit.toString()
    )) as DocumentEvent;
  }

  /** Post a deterministic init event and return its commit ID */
  async postDeterministicInit(
    params: PostDeterministicInitParams
  ): Promise<CommitID> {
    const event = getDeterministicInitEventPayload(
      params.model,
      params.controller,
      params.uniqueValue
    );
    const cid = await this.ceramic.postEventType(InitEventPayload, event);
    return CommitID.fromStream(getStreamID(cid));
  }

  /** Post a signed (non-deterministic) init event and return its commit ID */
  async postSignedInit<T extends UnknownContent = UnknownContent>(
    params: PostSignedInitParams<T>
  ): Promise<CommitID> {
    const { controller, ...rest } = params;
    const event = await createInitEvent({
      ...rest,
      controller: this.getDID(controller),
    });
    const cid = await this.ceramic.postEventType(SignedEvent, event);
    return CommitID.fromStream(getStreamID(cid));
  }

  /** Post a data event and return its commit ID. Assumes current data is defined */
  async postUpdate<T extends UnknownContent = UnknownContent>(
    streamID: string,
    params: PostDataParams<T>
  ): Promise<CommitID> {
    const { controller, ...rest } = params;
    const event = await createDataEvent({
      ...rest,
      controller: this.getDID(controller),
    });
    const { event_cid } = await this.updateStream(streamID, event);
    return CommitID.fromStream(params.currentID.baseID, event_cid);
  }

  /** Creates a document update and optionally obtains current state if not provided to do so */
  async updateDocument<T extends UnknownContent = UnknownContent>(
    params: UpdateDocumentParams<T>
  ): Promise<UpdatedDocumentState> {
    const { id, newContent, shouldIndex } = params;
    // Get the current state of the document if not provided
    const currentState = params.currentState || (await this.getStreamState(id));
    // use existing postUpdate utility to create the update
    const update = await this.postUpdate(id, {
      currentID: new CommitID("MID", createCID(currentState.id)),
      currentContent: JSON.parse(currentState.data),
      newContent,
      shouldIndex,
    });
    return {
      id: update.toString(),
      content: newContent,
    };
  }
}
