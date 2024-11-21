[**@ceramic-sdk/model-instance-client v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/model-instance-client](../README.md) / createInitEvent

# Function: createInitEvent()

> **createInitEvent**\<`T`\>(`params`): `Promise`\<[`SignedEvent`](../../events/type-aliases/SignedEvent.md)\>

Create a non-deterministic init event for a ModelInstanceDocument stream.

## Type Parameters

• **T** *extends* [`UnknownContent`](../type-aliases/UnknownContent.md) = [`UnknownContent`](../type-aliases/UnknownContent.md)

## Parameters

• **params**: [`CreateInitEventParams`](../type-aliases/CreateInitEventParams.md)\<`T`\>

## Returns

`Promise`\<[`SignedEvent`](../../events/type-aliases/SignedEvent.md)\>

## See

[getDeterministicInitEventPayload](getDeterministicInitEventPayload.md) for deterministic events.
