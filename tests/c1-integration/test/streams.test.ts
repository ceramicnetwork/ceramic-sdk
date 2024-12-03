import {
  ClientOptions,
  createFlightSqlClient,
  FlightSqlClient,
} from "@ceramic-sdk/flight-sql-client";
import type { EnvironmentOptions } from "../src";
import { StreamClient } from "@ceramic-sdk/stream-client";
import { CID } from "multiformats";
import { asDIDString } from "@didtools/codecs";
import { getAuthenticatedDID } from "@didtools/key-did";
import CeramicOneContainer from "../src";
import { CeramicClient } from "@ceramic-sdk/http-client";
import { StreamID } from "@ceramic-sdk/identifiers";
import { InitEventPayload, SignedEvent, signEvent } from "@ceramic-sdk/events";
import { tableFromIPC } from "apache-arrow";
import { jest } from "@jest/globals";

const CONTAINER_OPTS: EnvironmentOptions = {
  containerName: "ceramic-test-stream-client",
  apiPort: 5222,
  flightSqlPort: 5223,
  testPort: 5223,
};

const authenticatedDID = await getAuthenticatedDID(new Uint8Array(32));

const OPTIONS: ClientOptions = {
  headers: new Array(),
  username: undefined,
  password: undefined,
  token: undefined,
  tls: false,
  host: "127.0.0.1",
  port: CONTAINER_OPTS.flightSqlPort,
};

async function getClient(): Promise<FlightSqlClient> {
  return createFlightSqlClient(OPTIONS);
}

describe("stream client", () => {
  let c1Container: CeramicOneContainer;
  const ceramicClient = new CeramicClient({
    url: `http://127.0.0.1:${CONTAINER_OPTS.apiPort}`,
  });
  let streamId;
  let cid;
  beforeAll(async () => {
    c1Container =
      await CeramicOneContainer.startContainerWithAggregator(CONTAINER_OPTS);

    // create a new event
    const model = StreamID.fromString(
      "kjzl6hvfrbw6c5he7fxl3oakeckm2kchkqboqug08inkh1tmfqpd8v3oceriml2"
    );
    const eventPayload: InitEventPayload = {
      data: {
        body: "This is a simple message",
      },
      header: {
        controllers: [asDIDString(authenticatedDID.id)],
        model,
        sep: "test",
      },
    };
    const encodedPayload = InitEventPayload.encode(eventPayload);
    const signedEvent = await signEvent(authenticatedDID, encodedPayload);
    cid = await ceramicClient.postEventType(SignedEvent, signedEvent);
    // Get stream ID from the database
    const client = await getClient();
    const buffer = await client.query(
      "SELECT * FROM conclusion_events LIMIT 1"
    );
    const data = tableFromIPC(buffer);
    const row = data.get(0);
    const streamCidBytes = new Uint8Array(Object.values(row?.stream_cid));
    const streamCid = CID.decode(streamCidBytes).toString();
    const streamType = row?.stream_type;
    streamId = new StreamID(streamType, streamCid);
  }, 10000);

  test("gets stream state", async () => {
    jest.setTimeout(10000);
    const client = new StreamClient({ ceramic: ceramicClient });
    const streamState = await client.getStreamState(streamId.toString());
    console.log(streamState);
  });

  afterAll(async () => {
    await c1Container.teardown();
  });
});
