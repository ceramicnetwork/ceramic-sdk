import type { EnvironmentOptions } from "../src";
import { asDIDString } from "@didtools/codecs";
import { getAuthenticatedDID } from "@didtools/key-did";
import CeramicOneContainer from "../src";
import { CeramicClient } from "@ceramic-sdk/http-client";
import {
  InitEventPayload,
  SignedEvent,
  signEvent,
} from "@ceramic-sdk/events";
import { StreamID } from "@ceramic-sdk/identifiers";

const CONTAINER_OPTS: EnvironmentOptions = {
  containerName: "ceramic-test-stream-client",
  apiPort: 5222,
  flightSqlPort: 5223,
  testPort: 5223,
};

const authenticatedDID = await getAuthenticatedDID(new Uint8Array(32));

describe("http client", () => {
  let c1Container: CeramicOneContainer;
  const ceramicClient = new CeramicClient({
    url: `http://127.0.0.1:${CONTAINER_OPTS.apiPort}`,
  });
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
  }, 10000);

  test.skip("gets an event", async () => {
    const event = await ceramicClient.getEvent(cid.toString());
    expect(event).toBeDefined();
    expect(event.id.toString()).toEqual(cid.toString());
  }, 10000);

  afterAll(async () => {
    await c1Container.teardown();
  });
});
