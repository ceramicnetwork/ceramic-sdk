import {
  type ClientOptions,
  type FlightSqlClient,
  createFlightSqlClient,
} from "@ceramic-sdk/flight-sql-client";
import { tableFromIPC } from "apache-arrow";
import CeramicOneContainer from "../src";
import type { EnvironmentOptions } from "../src";
import { StreamID } from "@ceramic-sdk/identifiers";
import { InitEventPayload, SignedEvent, signEvent } from "@ceramic-sdk/events";
import { getAuthenticatedDID } from "@didtools/key-did";
import { asDIDString } from "@didtools/codecs";
import { CeramicClient } from "@ceramic-sdk/http-client";

const CONTAINER_OPTS: EnvironmentOptions = {
  containerName: "ceramic-test-flight",
  apiPort: 5222,
  flightSqlPort: 5223,
  testPort: 5223,
};

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

describe("flight sql", () => {
  let c1Container: CeramicOneContainer;
  const ceramicClient = new CeramicClient({
    url: `http://127.0.0.1:${CONTAINER_OPTS.apiPort}`,
  });

  beforeAll(async () => {
    const authenticatedDID = await getAuthenticatedDID(new Uint8Array(32));
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
    await ceramicClient.postEventType(SignedEvent, signedEvent);
  }, 10000);

  test("makes query", async () => {
    const client = await getClient();
    const buffer = await client.query("SELECT * FROM conclusion_events");
    const data = tableFromIPC(buffer);
    // console.log(JSON.stringify(data));
    const row = data.get(0);
    expect(row).toBeDefined();
  });

  test("catalogs", async () => {
    const client = await getClient();
    const buffer = await client.getCatalogs();
    const data = tableFromIPC(buffer);
    // console.log(JSON.stringify(data));
    const row = data.get(0);
    expect(row).toBeDefined();
  });

  test("schemas", async () => {
    const client = await getClient();
    const buffer = await client.getDbSchemas({});
    const data = tableFromIPC(buffer);
    // console.log(JSON.stringify(data));
    const row = data.get(0);
    expect(row).toBeDefined();
  });

  test("tables", async () => {
    const client = await getClient();
    const withSchema = await client.getTables({ includeSchema: true });
    const noSchema = await client.getTables({ includeSchema: false });
    // console.log(JSON.stringify(tableFromIPC(withSchema)));
    expect(withSchema).not.toBe(noSchema);
  });

  // disabled until server support is implemented
  test.skip("prepared stmt", async () => {
    const client = await createFlightSqlClient(OPTIONS);
    const buffer = await client.preparedStatement(
      "SELECT * from conclusion_events where stream_type = $1",
      [["1", "3"]]  // Position is "1", not "$1"
    );
    // test to make sure that 3 was passed in
    const data = tableFromIPC(buffer);
    const row = data.get(0);
    const streamType = row?.stream_type;
    expect(streamType).toBe("3");
  });

  afterAll(async () => {
    await c1Container.teardown();
  });
});
