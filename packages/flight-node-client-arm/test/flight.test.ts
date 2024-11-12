import { CeramicFlightSqlClient, ClientOptions } from "../src";

const OPTIONS: ClientOptions = {
  headers: new Array(),
  username: undefined,
  password: undefined,
  token: undefined,
  tls: false,
  host: "127.0.0.1",
  port: 5102,
};

function getClient(): CeramicFlightSqlClient {
  return new CeramicFlightSqlClient(OPTIONS);
}

describe("fligh sql", () => {
  test("makes query", async () => {
    const data = await getClient().runQuery("SELECT * FROM conclusion_feed");
    console.log(JSON.stringify(data));
  });
  test("catalogs", async () => {
    const data = await getClient().catalogs();
    console.log(JSON.stringify(data));
  });
  test("schemas", async () => {
    const data = await getClient().dbSchemas({});
    console.log(JSON.stringify(data));
  });
  test("tables", async () => {
    const client = getClient();
    const withSchema = await client.tables({ includeSchema: true });
    const noSchema = await client.tables({ includeSchema: false });
    console.log(JSON.stringify(withSchema));
    console.log(JSON.stringify(noSchema));
    expect(withSchema).not.toBe(noSchema);
  });
});
