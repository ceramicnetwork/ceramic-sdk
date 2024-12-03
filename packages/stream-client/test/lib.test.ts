import { CeramicClient } from "@ceramic-sdk/http-client";
import {
  createCID,
  randomCID,
  randomStreamID,
} from "@ceramic-sdk/identifiers";
import {
  SignedEvent,
  signEvent,
} from "@ceramic-sdk/events";
import { getAuthenticatedDID } from "@didtools/key-did";
import { DID } from "dids";
import {
  StreamClient,
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
  describe("postData() method", () => {
    const mockStreamId = randomStreamID();
    const mockEventCid = randomCID();
    let mockCeramicClient;
    let client;
    let authenticatedDID;

    beforeEach(async () => {
      authenticatedDID = await getAuthenticatedDID(new Uint8Array(32));

      mockCeramicClient = {
        postEventType: jest.fn(),
      } as unknown as CeramicClient;

      client = new StreamClient({
        ceramic: mockCeramicClient,
        did: authenticatedDID,
      });
    });

    test("successfully posts a signed event and returns stream state", async () => {
      const mockPayload: GenericDataEventPayload = {
        id: mockEventCid,
        prev: mockEventCid,
        data: JSON.stringify([
          { op: "replace", path: "/hello", value: "world" },
          { op: "add", path: "/test", value: true },
        ]),
        dimensions: {
          model: new Uint8Array([1, 2, 3]),
        },
        header: {
          shouldIndex: true,
        },
      };

      const mockSignedEvent = await signEvent(authenticatedDID, mockPayload);

      mockCeramicClient.postEventType.mockResolvedValue(
        createCID(mockEventCid)
      );

      // Mock successful event posting
      mockCeramicClient.postEventType.mockResolvedValue(mockEventCid);

      const result = await client.postData(
        mockStreamId.toString(),
        mockSignedEvent
      );

      expect(result.data).toEqual(JSON.stringify(mockPayload.data));

      expect(result).toEqual(expect.any(Object));

      expect(mockCeramicClient.postEventType).toHaveBeenCalledWith(
        SignedEvent,
        mockSignedEvent
      );
    });
    test("handles empty dimensions", async () => {
      const mockPayload: GenericDataEventPayload = {
        id: mockEventCid,
        prev: mockEventCid,
        data: JSON.stringify({ test: "data" }),
      };

      const mockSignedEvent = await signEvent(authenticatedDID, mockPayload);
      mockCeramicClient.postEventType.mockResolvedValue(
        createCID(mockEventCid)
      );

      const result = await client.postData(
        mockStreamId.toString(),
        mockSignedEvent
      );

      expect(result.dimensions).toEqual({});
    });

    test("throws error when posting fails", async () => {
      const mockPayload: GenericDataEventPayload = {
        id: mockEventCid,
        prev: mockEventCid,
        data: JSON.stringify({ test: "data" }),
      };

      const mockSignedEvent = await signEvent(authenticatedDID, mockPayload);
      const errorMessage = "Network error";
      mockCeramicClient.postEventType.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(
        client.postData(mockStreamId.toString(), mockSignedEvent)
      ).rejects.toThrow(`Failed to update stream: ${errorMessage}`);
    });

    test("throws error when missing DID", async () => {
      const clientWithoutDID = new StreamClient({ ceramic: mockCeramicClient });
      const mockPayload: GenericDataEventPayload = {
        id: mockEventCid,
        prev: mockEventCid,
        data: JSON.stringify({ test: "data" }),
      };

      const mockSignedEvent = await signEvent(authenticatedDID, mockPayload);

      await expect(
        clientWithoutDID.postData(mockStreamId.toString(), mockSignedEvent)
      ).rejects.toThrow("Missing DID");
    });

    test("handles complex data structures", async () => {
      const complexData = {
        nested: { array: [1, 2, 3], object: { key: "value" } },
        date: new Date().toISOString(),
      };

      const mockPayload: GenericDataEventPayload = {
        id: mockEventCid,
        prev: mockEventCid,
        data: JSON.stringify(complexData),
        dimensions: {
          model: new Uint8Array([1, 2, 3]),
          controller: new Uint8Array([4, 5, 6]),
        },
      };

      const mockSignedEvent = await signEvent(authenticatedDID, mockPayload);
      mockCeramicClient.postEventType.mockResolvedValue(
        createCID(mockEventCid)
      );

      const result = await client.postData(
        mockStreamId.toString(),
        mockSignedEvent
      );

      expect(JSON.parse(result.data)).toBe(JSON.stringify(complexData));
      expect(result.dimensions).toEqual(mockPayload.dimensions);
    });
  });
});
