import { CeramicClient } from "@ceramic-sdk/http-client";
import {
  CommitID,
  createCID,
  randomCID,
  randomStreamID,
} from "@ceramic-sdk/identifiers";
import { getSignedEventPayload, SignedEvent } from "@ceramic-sdk/events";
import { getAuthenticatedDID } from "@didtools/key-did";
import { DID } from "dids";
import {
  StreamClient,
  createDataEvent,
  GenericDataEventPayload,
} from "../src/index.js";
import { jest } from "@jest/globals";

const authenticatedDID = await getAuthenticatedDID(new Uint8Array(32));

describe("StreamClient", () => {
  describe("ceramic getter", () => {
    test("returns the CeramicClient instance set in constructor", () => {
      const ceramic = new CeramicClient({ url: "http://localhost:5101" });
      const client = new StreamClient({ ceramic });
      expect(client.ceramic).toBe(ceramic);
    });

    test("returns a CeramicClient instance using the provided URL", () => {
      const client = new StreamClient({ ceramic: "http://localhost:5101" });
      expect(client.ceramic).toBeInstanceOf(CeramicClient);
    });
  });

  describe("getDID() method", () => {
    test("throws if no DID is provided or set in the constructor", () => {
      const client = new StreamClient({ ceramic: "http://localhost:5101" });
      expect(() => client.getDID()).toThrow("Missing DID");
    });

    test("returns the DID set in the constructor", () => {
      const did = new DID();
      const client = new StreamClient({
        ceramic: "http://localhost:5101",
        did,
      });
      expect(client.getDID()).toBe(did);
    });

    test("returns the DID provided as argument", async () => {
      const did = new DID();
      const client = new StreamClient({
        ceramic: "http://localhost:5101",
        did: new DID(),
      });
      expect(client.getDID(did)).toBe(did);
    });
  });

  describe("getStreamState() method", () => {
    test("fetches the state of a stream by its ID", async () => {
      const streamId = "streamId123";
      const mockStreamState = {
        id: streamId,
        controller: "did:example:123",
        data: "someEncodedData",
        event_cid: "someCid",
        dimensions: {},
      };

      // Mock CeramicClient and its API
      const mockGet = jest.fn(() =>
        Promise.resolve({
          data: mockStreamState,
          error: null,
        })
      );
      const mockCeramicClient = {
        api: { GET: mockGet },
      } as unknown as CeramicClient;

      const client = new StreamClient({ ceramic: mockCeramicClient });
      const state = await client.getStreamState(streamId);

      expect(state).toEqual(mockStreamState);
      expect(mockGet).toHaveBeenCalledWith("/streams/{stream_id}", {
        params: { path: { stream_id: streamId } },
      });
    });

    test("throws an error if the stream is not found", async () => {
      const streamId = "invalidStreamId";
      const mockError = { message: "Stream not found" };

      // Mock CeramicClient and its API
      const mockGet = jest.fn(() =>
        Promise.resolve({
          data: null,
          error: mockError,
        })
      );
      const mockCeramicClient = {
        api: { GET: mockGet },
      } as unknown as CeramicClient;

      const client = new StreamClient({ ceramic: mockCeramicClient });

      await expect(client.getStreamState(streamId)).rejects.toThrow(
        "Stream not found"
      );
      expect(mockGet).toHaveBeenCalledWith("/streams/{stream_id}", {
        params: { path: { stream_id: streamId } },
      });
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
        GenericDataEventPayload,
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
        shouldIndex: true,
      });
      const payload = await getSignedEventPayload(
        GenericDataEventPayload,
        event
      );
      expect(payload.header).toEqual({ shouldIndex: true });
    });
  });
  describe("updateStream() method", () => {
    const mockStreamId = randomStreamID();
    const mockEventCid = randomCID();
    let mockCeramicClient;
    let client;

    beforeEach(async () => {
      mockCeramicClient = {
        api: {
          GET: jest.fn(),
        },
        postEventType: jest.fn(),
      } as unknown as CeramicClient;

      client = new StreamClient({
        ceramic: mockCeramicClient,
        did: authenticatedDID,
      });
    });

    test("successfully updates stream with new content", async () => {
      const currentState = {
        data: JSON.stringify({ title: "Old Title" }),
        event_cid: mockEventCid,
      };

      const newContent = { title: "New Title" };

      mockCeramicClient.api.GET.mockResolvedValue({
        data: currentState,
        error: null,
      });

      mockCeramicClient.postEventType.mockResolvedValue(
        createCID(mockEventCid)
      );

      const result = await client.updateStream(mockStreamId, newContent);

      expect(result.data).toBe(JSON.stringify(newContent));
      expect(result.event_cid).toBeDefined();
      expect(mockCeramicClient.postEventType).toHaveBeenCalledWith(
        SignedEvent,
        expect.any(Object)
      );
    });

    test("uses provided previousState instead of fetching", async () => {
      const previousState = {
        data: JSON.stringify({ title: "Previous Title" }),
        event_cid: mockEventCid,
      };

      const newContent = { title: "Updated Title" };

      mockCeramicClient.postEventType.mockResolvedValue(
        createCID(mockEventCid)
      );

      await client.updateStream(mockStreamId, newContent, previousState);

      // Verify that GET was not called since we provided previousState
      expect(mockCeramicClient.api.GET).not.toHaveBeenCalled();
    });

    test("throws error when update fails", async () => {
      const newContent = { title: "New Title" };
      const errorMessage = "Network error";

      mockCeramicClient.api.GET.mockResolvedValue({
        data: {
          data: JSON.stringify({ title: "Old Title" }),
          event_cid: mockEventCid,
        },
        error: null,
      });

      mockCeramicClient.postEventType.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(
        client.updateStream(mockStreamId, newContent)
      ).rejects.toThrow(`Failed to update stream: ${errorMessage}`);
    });
  });
});
