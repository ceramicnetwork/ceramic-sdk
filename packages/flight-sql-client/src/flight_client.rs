use std::{sync::Arc, time::Duration};

use arrow_array::{ArrayRef, Datum, RecordBatch, StringArray};
use arrow_cast::{cast_with_options, CastOptions};
use arrow_flight::{sql::client::FlightSqlServiceClient, FlightInfo};
use arrow_schema::{ArrowError, Schema};
use futures::TryStreamExt;
use napi_derive::napi;
use snafu::ResultExt;
use tonic::transport::{Channel, ClientTlsConfig, Endpoint};
use tracing_log::log::{debug, info};

use crate::error::{ArrowSnafu, FlightSnafu, Result};

/// A ':' separated key value pair
#[derive(Debug, Clone)]
#[napi(object)]
pub struct KeyValue {
    pub key: String,
    pub value: String,
}

#[derive(Debug)]
#[napi(object)]
pub struct ClientOptions {
    /// Additional headers.
    ///
    /// Values should be key value pairs separated by ':'
    pub headers: Vec<KeyValue>,

    /// Username
    pub username: Option<String>,

    /// Password
    pub password: Option<String>,

    /// Auth token.
    pub token: Option<String>,

    /// Use TLS.
    pub tls: bool,

    /// Server host.
    pub host: String,

    /// Server port.
    pub port: Option<u16>,
}

pub(crate) async fn execute_flight(
    client: &mut FlightSqlServiceClient<Channel>,
    info: FlightInfo,
) -> Result<Vec<RecordBatch>> {
    let schema = Arc::new(Schema::try_from(info.clone()).context(ArrowSnafu {
        message: "creating schema from flight info",
    })?);
    let mut batches = Vec::with_capacity(info.endpoint.len() + 1);
    batches.push(RecordBatch::new_empty(schema));

    debug!("decoded schema");

    for endpoint in info.endpoint {
        let Some(ticket) = &endpoint.ticket else {
            panic!("did not get ticket");
        };
        let flight_data = client.do_get(ticket.clone()).await.context(ArrowSnafu {
            message: "do_get_request",
        })?;
        let mut flight_data: Vec<_> = flight_data
            .try_collect()
            .await
            .context(FlightSnafu {
                message: "collect data stream",
            })
            .expect("collect data stream");
        batches.append(&mut flight_data);
    }

    debug!("received data");

    Ok(batches)
}

#[allow(unused)]
fn construct_record_batch_from_params(
    params: &[(String, String)],
    parameter_schema: &Schema,
) -> Result<RecordBatch, ArrowError> {
    let mut items = Vec::<(&String, ArrayRef)>::new();

    for (name, value) in params {
        let field = parameter_schema.field_with_name(name)?;
        let value_as_array = StringArray::new_scalar(value);
        let casted = cast_with_options(
            value_as_array.get().0,
            field.data_type(),
            &CastOptions::default(),
        )?;
        items.push((name, casted))
    }

    RecordBatch::try_from_iter(items)
}

#[allow(unused)]
fn setup_logging() {
    tracing_log::LogTracer::init().expect("tracing log init");
    tracing_subscriber::fmt::init();
}

pub(crate) async fn setup_client(
    args: ClientOptions,
) -> Result<FlightSqlServiceClient<Channel>, ArrowError> {
    let port = args.port.unwrap_or(if args.tls { 443 } else { 80 });

    let protocol = if args.tls { "https" } else { "http" };

    let mut endpoint = Endpoint::new(format!("{}://{}:{}", protocol, args.host, port))
        .map_err(|err| ArrowError::ExternalError(Box::new(err)))?
        .connect_timeout(Duration::from_secs(20))
        .timeout(Duration::from_secs(20))
        .tcp_nodelay(true) // Disable Nagle's Algorithm since we don't want packets to wait
        .tcp_keepalive(Option::Some(Duration::from_secs(3600)))
        .http2_keep_alive_interval(Duration::from_secs(300))
        .keep_alive_timeout(Duration::from_secs(20))
        .keep_alive_while_idle(true);

    if args.tls {
        let tls_config = ClientTlsConfig::new();
        endpoint = endpoint
            .tls_config(tls_config)
            .map_err(|err| ArrowError::ExternalError(Box::new(err)))?;
    }

    let channel = endpoint
        .connect()
        .await
        .map_err(|err| ArrowError::ExternalError(Box::new(err)))?;

    let mut client = FlightSqlServiceClient::new(channel);
    info!("connected");

    for kv in args.headers {
        client.set_header(kv.key, kv.value);
    }

    if let Some(token) = args.token {
        client.set_token(token);
        info!("token set");
    }

    match (args.username, args.password) {
        (None, None) => {}
        (Some(username), Some(password)) => {
            client
                .handshake(&username, &password)
                .await
                .expect("handshake");
            info!("performed handshake");
        }
        (Some(_), None) => {
            panic!("when username is set, you also need to set a password")
        }
        (None, Some(_)) => {
            panic!("when password is set, you also need to set a username")
        }
    }

    Ok(client)
}
