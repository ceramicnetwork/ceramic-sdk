import { Table, tableFromIPC, Utf8, Binary, TypeMap } from 'apache-arrow';

import { FlightSqlClient, GetTablesOptions, GetDbSchemasOptions, ClientOptions, createFlightSqlClient } from '../index';

type catalogsSchema = {
  catalog_name: Utf8;
};

type dbSchemasSchema = {
  catalog_name: Utf8;
  db_schema_name: Utf8;
};

type tablesSchema = {
  catalog_name: Utf8;
  db_schema_name: Utf8;
  table_name: Utf8;
  table_type: Utf8;
  table_schema?: Binary;
};

export class ArrowFlightClient {
  static async fromOptions(options: ClientOptions): Promise<ArrowFlightClient> {
    const client = await createFlightSqlClient(options);
    return new ArrowFlightClient(client);
  }

  constructor(private readonly client: FlightSqlClient) {}

  async query<T extends TypeMap = any>(query: string): Promise<Table<T>> {
    const result = await this.client.query(query);
    return tableFromIPC(result);
  }

  async preparedStatement<T extends TypeMap = any>(
    query: string,
    parameters: Array<[string, string]>,
  ): Promise<Table<T>> {
    const result = await this.client.preparedStatement(query, parameters);
    return tableFromIPC(result);
  }

  /**
   * Retrieve the list of catalogs on a Flight SQL enabled backend.
   *
   * The definition of a catalog depends on vendor/implementation.
   * It is usually the database itself
   *
   * @returns Arrow Table with catalog information
   */
  async getCatalogs(): Promise<Table<catalogsSchema>> {
    const result = await this.client.getCatalogs();
    return tableFromIPC(result);
  }

  /**
   * Retrieve the list of database schemas on a Flight SQL enabled backend.
   *
   * The definition of a database schema depends on vendor/implementation.
   * It is usually a collection of tables.
   *
   * @param options filters to limit returned schemas
   * @returns Arrow Table with schema information
   */
  async getDbSchemas(options: GetDbSchemasOptions): Promise<Table<dbSchemasSchema>> {
    const result = await this.client.getDbSchemas(options);
    return tableFromIPC(result);
  }

  /**
   * Retrieve the list of tables, and optionally their schemas, on a Flight SQL enabled backend.
   *
   * @param options filters to limit returned tables
   * @returns Arrow Table with table information
   */
  async getTables(options: GetTablesOptions): Promise<Table<tablesSchema>> {
    const result = await this.client.getTables(options);
    return tableFromIPC(result);
  }
}
