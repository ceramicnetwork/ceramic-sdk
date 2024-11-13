# `@lakehouse-rs/flight-sql-client`

![https://github.com/napi-rs/package-template/actions](https://github.com/roeap/flight-sql-client-node/workflows/CI/badge.svg)
[![npm version](https://img.shields.io/npm/v/@lakehouse-rs/flight-sql-client.svg)](https://www.npmjs.com/package/@lakehouse-rs/flight-sql-client)

A client library for interacting with [Arrow Flight SQL] enabled databases from Node.js.

This library provides a thin wrapper around the flight-sql client implementation in
the [arrow-flight] crate. Node bindings are created with the help of [napi-rs].

## Usage

Install library

```sh
yarn add @lakehouse-rs/flight-sql-client
# or
npm install @lakehouse-rs/flight-sql-client
# or
pnpm add @lakehouse-rs/flight-sql-client
```

Create a new client instance

```ts
import { ClientOptions, createFlightSqlClient } from '@lakehouse-rs/flight-sql-client';
import { tableFromIPC } from 'apache-arrow';

const options: ClientOptions = {
  username: 'flight_username',
  password: 'testing123',
  tls: false,
  host: '127.0.0.1',
  port: 50051,
  headers: [],
};

const client = await createFlightSqlClient(options);
```

Execute a query against the service

```ts
const buffer = await client.query('SELECT * FROM my_tyble');
const table = tableFromIPC(buffer);
```

Or inspect some server metadata

```ts
const buffer = await client.getTables({ includeSchema: true });
const table = tableFromIPC(buffer);
```

## Development

Requirements:

- Rust
- node.js >= 12
- Yarn

Install dependencies via

```sh
yarn install
```

Build native module

```sh
yarn build
```

Run tests

```sh
yarn test
```

## Release

Releases are automated via github actions.

To create a release, first increment the version. (note the use of npm)

```sh
npm version <patch | minor | major | ...>
```

this will bump all version fields, and create a new commit with the version number.

Then trigger the release.

```sh
git push --follow-tags
```

[Arrow Flight SQL]: https://arrow.apache.org/docs/format/FlightSql.html
[arrow-flight]: https://crates.io/crates/arrow-flight
[napi-rs]: https://napi.rs/
