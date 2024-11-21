[**@ceramic-sdk/stream-client v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/stream-client](../README.md) / StreamClient

# Class: StreamClient

## Extended by

## Constructors

### new StreamClient()

> **new StreamClient**(`params`): [`StreamClient`](StreamClient.md)

#### Parameters

• **params**: [`StreamClientParams`](../type-aliases/StreamClientParams.md)

#### Returns

[`StreamClient`](StreamClient.md)

## Accessors

### ceramic

> `get` **ceramic**(): [`CeramicClient`](../../http-client/classes/CeramicClient.md)

Ceramic HTTP client instance used to interact with Ceramic One server

#### Returns

[`CeramicClient`](../../http-client/classes/CeramicClient.md)

#### Defined in

## Methods

### getDID()

> **getDID**(`provided`?): `DID`

Utility method used to access the provided DID or the one attached to the instance, throws if neither is provided

#### Parameters

• **provided?**: `DID`

#### Returns

`DID`
