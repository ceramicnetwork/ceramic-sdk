[**@ceramic-sdk/model-instance-client v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/model-instance-client](../README.md) / CreateInitEventParams

# Type Alias: CreateInitEventParams\<T\>

> **CreateInitEventParams**\<`T`\>: `object`

## Type Parameters

• **T** *extends* [`UnknownContent`](UnknownContent.md) = [`UnknownContent`](UnknownContent.md)

## Type declaration

### content

> **content**: `T`

Initial JSON object content for the ModelInstanceDocument stream

### context?

> `optional` **context**: [`StreamID`](../../identifiers/classes/StreamID.md)

Optional context

### controller

> **controller**: `DID`

DID controlling the ModelInstanceDocument stream

### model

> **model**: [`StreamID`](../../identifiers/classes/StreamID.md)

Stream ID of the Model used by the ModelInstanceDocument stream

### shouldIndex?

> `optional` **shouldIndex**: `boolean`

Flag notifying indexers if they should index the ModelInstanceDocument stream or not, defaults to `true`
