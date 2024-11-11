import { createFlightSqlClient } from "./flight-sql-client-wrapper.js";
import { tableFromIPC, Table } from "apache-arrow";

/** A ':' separated key value pair */
export interface KeyValue {
  key: string;
  value: string;
}

export interface ClientOptions {

  headers: Array<KeyValue>;
  /** Username */
  username?: string;
  /** Password */
  password?: string;
  /** Auth token. */
  token?: string;
  /** Use TLS. */
  tls: boolean;
  /** Server host. */
  host: string;
  /** Server port. */
  port?: number;
}
export interface GetDbSchemasOptions {
  /**
   * Specifies the Catalog to search for the tables.
   * An empty string retrieves those without a catalog.
   * If omitted the catalog name should not be used to narrow the search.
   */
  catalog?: string;
  /**
   * Specifies a filter pattern for schemas to search for.
   * When no db_schema_filter_pattern is provided, the pattern will not be used to narrow the search.
   * In the pattern string, two special characters can be used to denote matching rules:
   *     - "%" means to match any substring with 0 or more characters.
   *     - "_" means to match any one character.
   */
  dbSchemaFilterPattern?: string;
}
export interface GetTablesOptions {
  /**
   * Specifies the Catalog to search for the tables.
   * An empty string retrieves those without a catalog.
   * If omitted the catalog name should not be used to narrow the search.
   */
  catalog?: string;
  /**
   * Specifies a filter pattern for schemas to search for.
   * When no db_schema_filter_pattern is provided, the pattern will not be used to narrow the search.
   * In the pattern string, two special characters can be used to denote matching rules:
   *     - "%" means to match any substring with 0 or more characters.
   *     - "_" means to match any one character.
   */
  dbSchemaFilterPattern?: string;
  /**
   * Specifies a filter pattern for tables to search for.
   * When no table_name_filter_pattern is provided, all tables matching other filters are searched.
   * In the pattern string, two special characters can be used to denote matching rules:
   *     - "%" means to match any substring with 0 or more characters.
   *     - "_" means to match any one character.
   */
  tableNameFilterPattern?: string;
  /**
   * Specifies a filter of table types which must match.
   * The table types depend on vendor/implementation.
   * It is usually used to separate tables from views or system tables.
   * TABLE, VIEW, and SYSTEM TABLE are commonly supported.
   */
  tableTypes?: Array<string>;
  /** Specifies if the Arrow schema should be returned for found tables. */
  includeSchema?: boolean;
}

interface FlightSqlClient {
  query(query: string): Promise<Buffer>;
  getCatalogs(): Promise<Buffer>;
  getDbSchemas(options: GetDbSchemasOptions): Promise<Buffer>;
  getTables(options: GetTablesOptions): Promise<Buffer>;
}

export class CeramicFlightSqlClient {
  private client: Promise<FlightSqlClient>;

  constructor(params: ClientOptions) {
    // Directly initialize the client
    this.client = this.createClient(params);
  }

  // Initialization method to create and return the client instance
  private async createClient(params: ClientOptions): Promise<FlightSqlClient> {
    const { ...options } = params;
    return await createFlightSqlClient({
      ...options,
    });
  }

  // Get the raw Flight SQL client that returns byte arrays
  async getClient(): Promise<FlightSqlClient> {
    return await this.client;
  }

  // Query method using the initialized client
  async runQuery(query: string): Promise<Table> {
    const client = await this.getClient();
    const queryBuffer = await client.query(query);
    return tableFromIPC(queryBuffer);
  }

  async catalogs(): Promise<Table> {
    const client = await this.getClient();
    const buffer = await client.getCatalogs()
    return tableFromIPC(buffer);
  }

  async dbSchemas(opts: GetDbSchemasOptions): Promise<Table> {
    const client = await this.getClient();
    const buffer = await client.getDbSchemas(opts)
    return tableFromIPC(buffer);
  }

  async tables(opts: GetTablesOptions): Promise<Table> {
    const client = await this.getClient();
    const buffer = await client.getTables(opts);
    return tableFromIPC(buffer);
  }
}
