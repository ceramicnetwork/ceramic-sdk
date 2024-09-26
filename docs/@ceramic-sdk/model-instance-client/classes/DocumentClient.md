[**@ceramic-sdk/model-instance-client v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/model-instance-client](../README.md) / DocumentClient

# Class: DocumentClient

## Extends

- [`StreamClient`](../../stream-client/classes/StreamClient.md)

## Constructors

### new DocumentClient()

> **new DocumentClient**(`params`): [`DocumentClient`](DocumentClient.md)

#### Parameters

• **params**: [`StreamClientParams`](../../stream-client/type-aliases/StreamClientParams.md)

#### Returns

[`DocumentClient`](DocumentClient.md)

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

### getEvent()

> **getEvent**(`commitID`): `Promise`\<`MapIn`\<`RequiredProps`\<`object`\>, `$OutputOf`\> & `MapIn`\<`OptionalProps`\<`object`\>, `$OutputOf`\> \| `MapIn`\<`RequiredProps`\<`object`\>, `$OutputOf`\> & `MapIn`\<`OptionalProps`\<`object`\>, `$OutputOf`\> \| `MapIn`\<`object`, `$OutputOf`\>\>

Get a DocumentEvent based on its commit ID

#### Parameters

• **commitID**: `string` \| [`CommitID`](../../identifiers/classes/CommitID.md)

#### Returns

`Promise`\<`MapIn`\<`RequiredProps`\<`object`\>, `$OutputOf`\> & `MapIn`\<`OptionalProps`\<`object`\>, `$OutputOf`\> \| `MapIn`\<`RequiredProps`\<`object`\>, `$OutputOf`\> & `MapIn`\<`OptionalProps`\<`object`\>, `$OutputOf`\> \| `MapIn`\<`object`, `$OutputOf`\>\>

***

### postData()

> **postData**\<`T`\>(`params`): `Promise`\<[`CommitID`](../../identifiers/classes/CommitID.md)\>

Post a data event and return its commit ID

#### Type Parameters

• **T** *extends* [`UnknownContent`](../type-aliases/UnknownContent.md) = [`UnknownContent`](../type-aliases/UnknownContent.md)

#### Parameters

• **params**: [`PostDataParams`](../type-aliases/PostDataParams.md)\<`T`\>

#### Returns

`Promise`\<[`CommitID`](../../identifiers/classes/CommitID.md)\>

***

### postDeterministicInit()

> **postDeterministicInit**(`params`): `Promise`\<[`CommitID`](../../identifiers/classes/CommitID.md)\>

Post a deterministic init event and return its commit ID

#### Parameters

• **params**: [`PostDeterministicInitParams`](../type-aliases/PostDeterministicInitParams.md)

#### Returns

`Promise`\<[`CommitID`](../../identifiers/classes/CommitID.md)\>

***

### postSignedInit()

> **postSignedInit**\<`T`\>(`params`): `Promise`\<[`CommitID`](../../identifiers/classes/CommitID.md)\>

Post a signed (non-deterministic) init event and return its commit ID

#### Type Parameters

• **T** *extends* [`UnknownContent`](../type-aliases/UnknownContent.md) = [`UnknownContent`](../type-aliases/UnknownContent.md)

#### Parameters

• **params**: [`PostSignedInitParams`](../type-aliases/PostSignedInitParams.md)\<`T`\>

#### Returns

`Promise`\<[`CommitID`](../../identifiers/classes/CommitID.md)\>
