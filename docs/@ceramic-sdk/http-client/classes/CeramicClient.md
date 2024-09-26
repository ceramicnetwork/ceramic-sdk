[**@ceramic-sdk/http-client v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/http-client](../README.md) / CeramicClient

# Class: CeramicClient

## Constructors

### new CeramicClient()

> **new CeramicClient**(`params`): [`CeramicClient`](CeramicClient.md)

#### Parameters

• **params**: [`ClientParams`](../type-aliases/ClientParams.md)

#### Returns

[`CeramicClient`](CeramicClient.md)

## Accessors

### api

> `get` **api**(): `Client`\<`paths`, \`$\{string\}/$\{string\}\`\>

OpenAPI client used internally, provides low-level access to the HTTP APIs exposed by the Ceramic One server

#### Returns

`Client`\<`paths`, \`$\{string\}/$\{string\}\`\>

#### Defined in

## Methods

### getEvent()

> **getEvent**(`id`): `Promise`\<`object`\>

Get the raw event response for the given event CID

#### Parameters

• **id**: `string`

#### Returns

`Promise`\<`object`\>

##### data?

> `optional` **data**: `string`

###### Description

Multibase encoding of event data.

##### id

> **id**: `string`

###### Description

Multibase encoding of event root CID bytes.

***

### getEventCAR()

> **getEventCAR**(`id`): `Promise`\<`CAR`\>

Get the CAR-encoded event for the given event CID

#### Parameters

• **id**: `string`

#### Returns

`Promise`\<`CAR`\>

***

### getEventData()

> **getEventData**(`id`): `Promise`\<`string`\>

Get the string-encoded event for the given event CID

#### Parameters

• **id**: `string`

#### Returns

`Promise`\<`string`\>

***

### getEventsFeed()

> **getEventsFeed**(`params`): `Promise`\<`object`\>

Get the events feed based on the given parameters

#### Parameters

• **params**: [`EventsFeedParams`](../type-aliases/EventsFeedParams.md) = `{}`

#### Returns

`Promise`\<`object`\>

##### events

> **events**: `object`[]

###### Description

An array of events. For now, the event data payload is empty.

##### resumeToken

> **resumeToken**: `string`

###### Description

The token/highwater mark to used as resumeAt on a future request

***

### getEventType()

> **getEventType**\<`Payload`\>(`decoder`, `id`): `Promise`\<`Payload` \| `MapIn`\<`RequiredProps`\<`object`\>, `$TypeOf`\> & `MapIn`\<`OptionalProps`\<`object`\>, `$TypeOf`\>\>

Get the decoded event for the given decoder and event CID

#### Type Parameters

• **Payload**

#### Parameters

• **decoder**: `Decoder`\<`unknown`, `Payload`\>

• **id**: `string`

#### Returns

`Promise`\<`Payload` \| `MapIn`\<`RequiredProps`\<`object`\>, `$TypeOf`\> & `MapIn`\<`OptionalProps`\<`object`\>, `$TypeOf`\>\>

***

### getVersion()

> **getVersion**(): `Promise`\<`object`\>

Get information about the Ceramic One server version

#### Returns

`Promise`\<`object`\>

##### version?

> `optional` **version**: `string`

###### Description

Version of the Ceramic node

***

### postEvent()

> **postEvent**(`data`): `Promise`\<`void`\>

Post a string-encoded event to the server

#### Parameters

• **data**: `string`

#### Returns

`Promise`\<`void`\>

***

### postEventCAR()

> **postEventCAR**(`car`): `Promise`\<`CID`\<`unknown`, `number`, `number`, `Version`\>\>

Post a CAR-encoded event to the server

#### Parameters

• **car**: `CAR`

#### Returns

`Promise`\<`CID`\<`unknown`, `number`, `number`, `Version`\>\>

***

### postEventType()

> **postEventType**(`codec`, `event`): `Promise`\<`CID`\<`unknown`, `number`, `number`, `Version`\>\>

Encode and post an event to the server

#### Parameters

• **codec**: `Codec`\<`unknown`, `unknown`, `unknown`\>

• **event**: `unknown`

#### Returns

`Promise`\<`CID`\<`unknown`, `number`, `number`, `Version`\>\>

***

### registerInterestModel()

> **registerInterestModel**(`model`): `Promise`\<`void`\>

Register interest in streams using the given model stream ID

#### Parameters

• **model**: `string`

#### Returns

`Promise`\<`void`\>
