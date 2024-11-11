// flight-sql-client-wrapper.js
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const {
  createFlightSqlClient,
} = require("@lakehouse-rs/flight-sql-client");

export { createFlightSqlClient };
