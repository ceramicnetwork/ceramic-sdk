#![deny(clippy::all)]

mod conversion;
mod error;
mod flight_client;

use arrow_array::{ArrayRef, Datum as _, RecordBatch, StringArray};
use arrow_cast::CastOptions;
use arrow_flight::sql::{client::FlightSqlServiceClient, CommandGetDbSchemas, CommandGetTables};
use arrow_schema::Schema;
use napi::bindgen_prelude::*;
use napi_derive::napi;
use snafu::prelude::*;
use tokio::sync::Mutex;
use tonic::transport::Channel;

use crate::conversion::record_batch_to_buffer;
use crate::error::{ArrowSnafu, Result};
use crate::flight_client::{execute_flight, setup_client, ClientOptions};

#[napi]
pub struct FlightSqlClient {
    client: Mutex<FlightSqlServiceClient<Channel>>,
}

#[napi]
impl FlightSqlClient {
    #[napi]
    pub async fn query(&self, query: String) -> napi::Result<Buffer> {
        let mut client = self.client.lock().await;
        let mut prepared_stmt = client.prepare(query, None).await.context(ArrowSnafu {
            message: "failed to prepare statement",
        })?;
        let flight_info = prepared_stmt.execute().await.context(ArrowSnafu {
            message: "failed to execute prepared statement",
        })?;
        let batches = execute_flight(&mut client, flight_info).await?;
        Ok(record_batch_to_buffer(batches)?.into())
    }

    #[napi]
    pub async fn prepared_statement(
        &self,
        query: String,
        params: Vec<(String, String)>,
    ) -> napi::Result<Buffer> {
        let mut client = self.client.lock().await;
        let mut prepared_stmt = client.prepare(query, None).await.context(ArrowSnafu {
            message: "failed to prepare statement",
        })?;
        let schema = prepared_stmt.parameter_schema().context(ArrowSnafu {
            message: "failed to retrieve parameter schema from prepare statement",
        })?;
        prepared_stmt
            .set_parameters(construct_record_batch_from_params(&params, schema)?)
            .context(ArrowSnafu {
                message: "failed to bind parameters",
            })?;
        let flight_info = prepared_stmt.execute().await.context(ArrowSnafu {
            message: "failed to execute prepared statement",
        })?;
        let batches = execute_flight(&mut client, flight_info).await?;
        Ok(record_batch_to_buffer(batches)?.into())
    }

    #[napi]
    pub async fn get_catalogs(&self) -> napi::Result<Buffer> {
        let mut client = self.client.lock().await;
        let flight_info = client.get_catalogs().await.context(ArrowSnafu {
            message: "failed to execute prepared statement",
        })?;
        let batches = execute_flight(&mut client, flight_info).await?;
        Ok(record_batch_to_buffer(batches)?.into())
    }

    #[napi]
    pub async fn get_db_schemas(&self, options: GetDbSchemasOptions) -> napi::Result<Buffer> {
        let command = CommandGetDbSchemas {
            catalog: options.catalog,
            db_schema_filter_pattern: options.db_schema_filter_pattern,
        };
        let mut client = self.client.lock().await;
        let flight_info = client.get_db_schemas(command).await.context(ArrowSnafu {
            message: "failed to execute prepared statement",
        })?;
        let batches = execute_flight(&mut client, flight_info).await?;
        Ok(record_batch_to_buffer(batches)?.into())
    }

    #[napi]
    pub async fn get_tables(&self, options: GetTablesOptions) -> napi::Result<Buffer> {
        let command = CommandGetTables {
            catalog: options.catalog,
            db_schema_filter_pattern: options.db_schema_filter_pattern,
            table_name_filter_pattern: options.table_name_filter_pattern,
            table_types: options.table_types.unwrap_or_default(),
            include_schema: options.include_schema.unwrap_or_default(),
        };
        let mut client = self.client.lock().await;
        let flight_info = client.get_tables(command).await.context(ArrowSnafu {
            message: "failed to execute prepared statement",
        })?;
        let batches = execute_flight(&mut client, flight_info).await?;
        Ok(record_batch_to_buffer(batches)?.into())
    }
}

#[napi]
pub async fn create_flight_sql_client(
    options: ClientOptions,
) -> Result<FlightSqlClient, napi::Error> {
    Ok(FlightSqlClient {
        client: Mutex::new(setup_client(options).await.context(ArrowSnafu {
            message: "failed setting up flight sql client",
        })?),
    })
}

#[napi]
pub fn rust_crate_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

#[napi(object)]
pub struct GetDbSchemasOptions {
    /// Specifies the Catalog to search for the tables.
    /// An empty string retrieves those without a catalog.
    /// If omitted the catalog name should not be used to narrow the search.
    pub catalog: Option<String>,

    /// Specifies a filter pattern for schemas to search for.
    /// When no db_schema_filter_pattern is provided, the pattern will not be used to narrow the search.
    /// In the pattern string, two special characters can be used to denote matching rules:
    ///     - "%" means to match any substring with 0 or more characters.
    ///     - "_" means to match any one character.
    pub db_schema_filter_pattern: Option<String>,
}

#[napi(object)]
pub struct GetTablesOptions {
    /// Specifies the Catalog to search for the tables.
    /// An empty string retrieves those without a catalog.
    /// If omitted the catalog name should not be used to narrow the search.
    pub catalog: Option<String>,

    /// Specifies a filter pattern for schemas to search for.
    /// When no db_schema_filter_pattern is provided, the pattern will not be used to narrow the search.
    /// In the pattern string, two special characters can be used to denote matching rules:
    ///     - "%" means to match any substring with 0 or more characters.
    ///     - "_" means to match any one character.
    pub db_schema_filter_pattern: Option<String>,

    /// Specifies a filter pattern for tables to search for.
    /// When no table_name_filter_pattern is provided, all tables matching other filters are searched.
    /// In the pattern string, two special characters can be used to denote matching rules:
    ///     - "%" means to match any substring with 0 or more characters.
    ///     - "_" means to match any one character.
    pub table_name_filter_pattern: Option<String>,

    /// Specifies a filter of table types which must match.
    /// The table types depend on vendor/implementation.
    /// It is usually used to separate tables from views or system tables.
    /// TABLE, VIEW, and SYSTEM TABLE are commonly supported.
    pub table_types: Option<Vec<String>>,

    /// Specifies if the Arrow schema should be returned for found tables.
    pub include_schema: Option<bool>,
}

fn construct_record_batch_from_params(
    params: &[(String, String)],
    parameter_schema: &Schema,
) -> Result<RecordBatch> {
    let mut items = Vec::<(&String, ArrayRef)>::new();

    for (name, value) in params {
        let field = parameter_schema.field_with_name(name).context(ArrowSnafu {
            message: "failed to find field name in parameter schemas",
        })?;
        let value_as_array = StringArray::new_scalar(value);
        let casted = arrow_cast::cast_with_options(
            value_as_array.get().0,
            field.data_type(),
            &CastOptions::default(),
        )
        .context(ArrowSnafu {
            message: "failed to cast parameter",
        })?;
        items.push((name, casted))
    }

    RecordBatch::try_from_iter(items).context(ArrowSnafu {
        message: "failed to build record batch",
    })
}
