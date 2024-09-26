[**@ceramic-sdk/model-client v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/model-client](../README.md) / ModelClient

# Class: ModelClient

## Extends

- [`StreamClient`](../../stream-client/classes/StreamClient.md)

## Constructors

### new ModelClient()

> **new ModelClient**(`params`): [`ModelClient`](ModelClient.md)

#### Parameters

• **params**: [`StreamClientParams`](../../stream-client/type-aliases/StreamClientParams.md)

#### Returns

[`ModelClient`](ModelClient.md)

#### Inherited from

[`StreamClient`](../../stream-client/classes/StreamClient.md).[`constructor`](../../stream-client/classes/StreamClient.md#constructors)

## Accessors

### ceramic

> `get` **ceramic**(): [`CeramicClient`](../../http-client/classes/CeramicClient.md)

Ceramic HTTP client instance used to interact with Ceramic One server

#### Returns

[`CeramicClient`](../../http-client/classes/CeramicClient.md)

#### Inherited from

[`StreamClient`](../../stream-client/classes/StreamClient.md).[`ceramic`](../../stream-client/classes/StreamClient.md#ceramic)

#### Defined in

## Methods

### getDID()

> **getDID**(`provided`?): `DID`

Utility method used to access the provided DID or the one attached to the instance, throws if neither is provided

#### Parameters

• **provided?**: `DID`

#### Returns

`DID`

#### Inherited from

[`StreamClient`](../../stream-client/classes/StreamClient.md).[`getDID`](../../stream-client/classes/StreamClient.md#getdid)

***

### getInitEvent()

> **getInitEvent**(`streamID`): `Promise`\<`MapIn`\<`RequiredProps`\<`object`\>, `$TypeOf`\> & `MapIn`\<`OptionalProps`\<`object`\>, `$TypeOf`\>\>

Get the signed init event of a Model based on its stream ID

#### Parameters

• **streamID**: `string` \| [`StreamID`](../../identifiers/classes/StreamID.md)

#### Returns

`Promise`\<`MapIn`\<`RequiredProps`\<`object`\>, `$TypeOf`\> & `MapIn`\<`OptionalProps`\<`object`\>, `$TypeOf`\>\>

***

### getPayload()

> **getPayload**(`streamID`, `verifier`?): `Promise`\<`MapIn`\<`object`, `$TypeOf`\>\>

Get the init event payload of a Model based on its stream ID

#### Parameters

• **streamID**: `string` \| [`StreamID`](../../identifiers/classes/StreamID.md)

• **verifier?**: `DID`

#### Returns

`Promise`\<`MapIn`\<`object`, `$TypeOf`\>\>

***

### postDefinition()

> **postDefinition**(`definition`, `signer`?): `Promise`\<[`StreamID`](../../identifiers/classes/StreamID.md)\>

Post a Model definition and return its stream ID

#### Parameters

• **definition**: `MapIn`\<`RequiredProps`\<`object`\>, `$TypeOf`\> & `MapIn`\<`OptionalProps`\<`object`\>, `$TypeOf`\> \| `MapIn`\<`RequiredProps`\<`object`\>, `$TypeOf`\> & `MapIn`\<`OptionalProps`\<`object`\>, `$TypeOf`\>

• **signer?**: `DID`

#### Returns

`Promise`\<[`StreamID`](../../identifiers/classes/StreamID.md)\>
