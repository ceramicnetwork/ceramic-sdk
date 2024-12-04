import {
  assertSignedEvent,
  getSignedEventPayload,
  SignedEvent,
} from "@ceramic-sdk/events";
import type { CeramicClient } from "@ceramic-sdk/http-client";
import { CommitID, randomCID, randomStreamID } from "@ceramic-sdk/identifiers";
import {
  DataInitEventPayload,
  DocumentDataEventPayload,
  DocumentEvent,
  STREAM_TYPE_ID,
} from "@ceramic-sdk/model-instance-protocol";
import { getAuthenticatedDID } from "@didtools/key-did";
import { jest } from "@jest/globals";
import { equals } from "uint8arrays";

import {
  DocumentClient,
  createDataEvent,
  createInitEvent,
  getDeterministicInitEvent,
  getDeterministicInitEventPayload,
} from "../src/index.js";

const authenticatedDID = await getAuthenticatedDID(new Uint8Array(32));

describe("getDeterministicInitEventPayload()", () => {
  test("returns the deterministic event payload without unique value by default", () => {
    const model = randomStreamID();
    const event = getDeterministicInitEventPayload(model, "did:key:123");
    expect(event.data).toBeNull();
    expect(event.header.controllers).toEqual(["did:key:123"]);
    expect(event.header.model).toBe(model);
    expect(event.header.unique).toBeUndefined();
  });

  test("returns the deterministic event payload with the provided unique value", () => {
    const model = randomStreamID();
    const unique = new Uint8Array([0, 1, 2]);
    const event = getDeterministicInitEventPayload(
      model,
      "did:key:123",
      unique
    );
    expect(event.data).toBeNull();
    expect(event.header.controllers).toEqual(["did:key:123"]);
    expect(event.header.model).toBe(model);
    expect(event.header.unique).toBe(unique);
  });
});

describe("getDeterministicInitEvent()", () => {
  test("returns the deterministic event without unique value by default", () => {
    const model = randomStreamID();
    const event = getDeterministicInitEvent(model, "did:key:123");
    expect(event.data).toBeNull();
    expect(event.header.controllers).toEqual(["did:key:123"]);
    expect(equals(event.header.model, model.bytes)).toBe(true);
    expect(event.header.unique).toBeUndefined();
  });

  test("returns the deterministic event with the provided unique value", () => {
    const model = randomStreamID();
    const unique = new Uint8Array([0, 1, 2]);
    const event = getDeterministicInitEvent(model, "did:key:123", unique);
    expect(event.data).toBeNull();
    expect(event.header.controllers).toEqual(["did:key:123"]);
    expect(equals(event.header.model, model.bytes)).toBe(true);
    expect(event.header.unique).toBe(unique);
  });
});

describe("createInitEvent()", () => {
  test("creates unique events by adding a random unique value", async () => {
    const model = randomStreamID();
    const event1 = await createInitEvent({
      content: { hello: "world" },
      controller: authenticatedDID,
      model,
    });
    assertSignedEvent(event1);

    const event2 = await createInitEvent({
      content: { hello: "world" },
      controller: authenticatedDID,
      model,
    });
    expect(event2).not.toEqual(event1);
  });

  test("adds the context and shouldIndex when if provided", async () => {
    const model = randomStreamID();
    const event1 = await createInitEvent({
      content: { hello: "world" },
      controller: authenticatedDID,
      model,
    });
    const payload1 = await getSignedEventPayload(DataInitEventPayload, event1);
    expect(payload1.header.context).toBeUndefined();
    expect(payload1.header.shouldIndex).toBeUndefined();

    const context = randomStreamID();
    const event2 = await createInitEvent({
      content: { hello: "world" },
      controller: authenticatedDID,
      model,
      context,
      shouldIndex: true,
    });
    const payload2 = await getSignedEventPayload(DataInitEventPayload, event2);
    expect(payload2.header.context?.equals(context)).toBe(true);
    expect(payload2.header.shouldIndex).toBe(true);
  });
});

describe("createDataEvent()", () => {
  const commitID = CommitID.fromStream(randomStreamID(), randomCID());

  test("creates the JSON patch payload", async () => {
    const event = await createDataEvent({
      controller: authenticatedDID,
      currentID: commitID,
      currentContent: { hello: "test" },
      newContent: { hello: "world", test: true },
    });
    const payload = await getSignedEventPayload(
      DocumentDataEventPayload,
      event
    );
    expect(payload.data).toEqual([
      { op: "replace", path: "/hello", value: "world" },
      { op: "add", path: "/test", value: true },
    ]);
    expect(payload.header).toBeUndefined();
  });

  test("adds the shouldIndex header when provided", async () => {
    const event = await createDataEvent({
      controller: authenticatedDID,
      currentID: commitID,
      newContent: { hello: "world" },
      currentContent: { hello: "test" },
      shouldIndex: true,
    });
    const payload = await getSignedEventPayload(
      DocumentDataEventPayload,
      event
    );
    expect(payload.header).toEqual({ shouldIndex: true });
  });
});

describe("DocumentClient", () => {
  describe("getEvent() method", () => {
    test("gets a MID event by commit ID", async () => {
      const streamID = randomStreamID();
      const docEvent = getDeterministicInitEvent(streamID, "did:key:123");
      const getEventType = jest.fn(() => docEvent);
      const ceramic = { getEventType } as unknown as CeramicClient;
      const client = new DocumentClient({ ceramic, did: authenticatedDID });

      const commitID = CommitID.fromStream(streamID);
      const event = await client.getEvent(CommitID.fromStream(streamID));
      expect(getEventType).toHaveBeenCalledWith(
        DocumentEvent,
        commitID.cid.toString()
      );
      expect(event).toBe(docEvent);
    });
  });

  describe("postDeterministicInit() method", () => {
    test("posts the deterministic init event and returns the MID init CommitID", async () => {
      const postEventType = jest.fn(() => randomCID());
      const ceramic = { postEventType } as unknown as CeramicClient;
      const client = new DocumentClient({ ceramic, did: authenticatedDID });

      const id = await client.postDeterministicInit({
        controller: "did:key:123",
        model: randomStreamID(),
      });
      expect(postEventType).toHaveBeenCalled();
      expect(id).toBeInstanceOf(CommitID);
      expect(id.baseID.type).toBe(STREAM_TYPE_ID);
    });
  });

  describe("postSignedInit() method", () => {
    test("posts the signed init event and returns the MID init CommitID", async () => {
      const postEventType = jest.fn(() => randomCID());
      const ceramic = { postEventType } as unknown as CeramicClient;
      const client = new DocumentClient({ ceramic, did: authenticatedDID });

      const id = await client.postSignedInit({
        content: { test: true },
        controller: authenticatedDID,
        model: randomStreamID(),
      });
      expect(postEventType).toHaveBeenCalled();
      expect(id).toBeInstanceOf(CommitID);
      expect(id.baseID.type).toBe(STREAM_TYPE_ID);
    });
  });

  describe("postUpdate() method", () => {
    test("creates a data event, uses stream-client to post, and returns the CommitID", async () => {
      const eventCid = randomCID();
      const streamID = randomStreamID();
      const commitID = CommitID.fromStream(streamID);

      // Mock the ceramic client's postEventType method
      const mockCeramic = {
        // @ts-ignore
        postEventType: jest.fn().mockResolvedValue(eventCid.toString()),
      } as unknown as CeramicClient;

      const client = new DocumentClient({
        ceramic: mockCeramic,
        did: authenticatedDID,
      });

      const dataCommitID = await client.postUpdate(streamID.toString(), {
        currentID: commitID,
        currentContent: { test: 1 },
        newContent: { test: 2 },
        shouldIndex: true,
      });

      const mockedSignedEvent = await createDataEvent({
        controller: authenticatedDID,
        currentID: commitID,
        currentContent: { test: 1 },
        newContent: { test: 2 },
        shouldIndex: true,
      });

      // Verify postEventType was called on the ceramic client
      expect(mockCeramic.postEventType).toHaveBeenCalledWith(
        SignedEvent,
        mockedSignedEvent
      );

      // Verify the returned CommitID
      expect(dataCommitID).toBeInstanceOf(CommitID);
      expect(dataCommitID.commit.toString()).toBe(eventCid.toString());
    });

    test("handles content validation errors", async () => {
      const streamID = randomStreamID();
      const commitID = CommitID.fromStream(streamID);

      const ceramic = {
        postEventType: jest.fn(),
        updateStream: jest.fn(),
      } as unknown as CeramicClient;

      const client = new DocumentClient({ ceramic, did: authenticatedDID });

      // Test with invalid content that would fail JSON patch creation
      await expect(
        client.postUpdate(streamID.toString(), {
          currentID: commitID,
          currentContent: undefined as any, // This should trigger validation error
          newContent: { test: 2 },
        })
      ).rejects.toThrow();
    });

    test("throws error when missing DID", async () => {
      const streamID = randomStreamID();
      const commitID = CommitID.fromStream(streamID);

      const ceramic = {
        postEventType: jest.fn(),
        updateStream: jest.fn(),
      } as unknown as CeramicClient;

      const client = new DocumentClient({ ceramic });

      await expect(
        client.postUpdate(streamID.toString(), {
          currentID: commitID,
          currentContent: { test: 1 },
          newContent: { test: 2 },
        })
      ).rejects.toThrow("Missing DID");
    });
  });
  describe("updateDocument() method", () => {
    test("updates document with provided current state", async () => {
      const eventCid = randomCID();
      const streamID = randomStreamID();
      const commitID = CommitID.fromStream(streamID);
      const currentState = {
        id: streamID.toString(),
        controller: authenticatedDID.id,
        data: JSON.stringify({ test: 1 }),
        event_cid: commitID.toString(),
        dimensions: {},
      };

      const mockCeramic = {
        // @ts-ignore
        postEventType: jest.fn().mockResolvedValue(eventCid),
        // @ts-ignore
        updateStream: jest.fn().mockResolvedValue({
          event_cid: eventCid.toString(),
        }),
      } as unknown as CeramicClient;

      const client = new DocumentClient({
        ceramic: mockCeramic,
        did: authenticatedDID,
      });

      const result = await client.updateDocument({
        id: streamID.toString(),
        currentState,
        newContent: { test: 2 },
        shouldIndex: true,
      });

      expect(result).toEqual({
        id: expect.any(String),
        content: { test: 2 },
      });
      expect(mockCeramic.postEventType).toHaveBeenCalledWith(
        SignedEvent,
        expect.any(Object)
      );
    });

    test("fetches current state if not provided", async () => {
      const eventCid = randomCID();
      const streamID = randomStreamID();
      const commitID = CommitID.fromStream(streamID);
      const currentState = {
        id: streamID.toString(),
        controller: authenticatedDID.id,
        data: JSON.stringify({ test: 1 }),
        event_cid: commitID.toString(),
        dimensions: {},
      };
      // @ts-ignore
      const mockGet = jest.fn().mockResolvedValue({
        data: currentState,
        error: null,
      });

      const mockCeramic = {
        // @ts-ignore
        postEventType: jest.fn().mockResolvedValue(eventCid),
        api: { GET: mockGet },
      } as unknown as CeramicClient;

      const client = new DocumentClient({
        ceramic: mockCeramic,
        did: authenticatedDID,
      });

      // @ts-ignore
      const result = await client.updateDocument({
        id: streamID.toString(),
        newContent: { test: 2 },
        shouldIndex: true,
      });

      expect(mockGet).toHaveBeenCalledWith(
        "/streams/{stream_id}",
        expect.any(Object)
      );
      expect(result).toEqual({
        id: expect.any(String),
        content: { test: 2 },
      });
    });

    test("handles parsing errors in current state data", async () => {
      const streamID = randomStreamID();
      const commitID = CommitID.fromStream(streamID);
      const currentState = {
        id: streamID.toString(),
        controller: authenticatedDID.id,
        data: "invalid-json",
        event_cid: commitID.toString(),
        dimensions: {},
      };

      const client = new DocumentClient({
        ceramic: {} as CeramicClient,
        did: authenticatedDID,
      });

      await expect(
        client.updateDocument({
          id: streamID.toString(),
          currentState,
          newContent: { test: 2 },
        })
      ).rejects.toThrow();
    });
  });
});
