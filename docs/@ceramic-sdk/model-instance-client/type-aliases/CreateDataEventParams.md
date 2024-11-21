[**@ceramic-sdk/model-instance-client v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/model-instance-client](../README.md) / CreateDataEventParams

# Type Alias: CreateDataEventParams\<T\>

> **CreateDataEventParams**\<`T`\>: `object`

## Type Parameters

• **T** *extends* [`UnknownContent`](UnknownContent.md) = [`UnknownContent`](UnknownContent.md)

## Type declaration

### controller

> **controller**: `DID`

DID controlling the ModelInstanceDocument stream

### currentContent?

> `optional` **currentContent**: `T`

Current JSON object content for the ModelInstanceDocument stream, used with `newContent` to create the JSON patch

### currentID

> **currentID**: [`CommitID`](../../identifiers/classes/CommitID.md)

Commit ID of the current tip of the ModelInstanceDocument stream

### newContent?

> `optional` **newContent**: `T`

New JSON object content for the ModelInstanceDocument stream, used with `currentContent` to create the JSON patch

### shouldIndex?

> `optional` **shouldIndex**: `boolean`

Flag notifying indexers if they should index the ModelInstanceDocument stream or not
