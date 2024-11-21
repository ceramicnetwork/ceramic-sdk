[**@ceramic-sdk/events v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/events](../README.md) / createSignedInitEvent

# Function: createSignedInitEvent()

> **createSignedInitEvent**\<`T`\>(`did`, `data`, `header`, `options`?): `Promise`\<[`SignedEvent`](../type-aliases/SignedEvent.md)\>

Create a signed init event using the provided DID, data and header

## Type Parameters

• **T**

## Parameters

• **did**: `DID`

• **data**: `T`

• **header**: [`PartialInitEventHeader`](../type-aliases/PartialInitEventHeader.md)

• **options?**: `CreateJWSOptions`

## Returns

`Promise`\<[`SignedEvent`](../type-aliases/SignedEvent.md)\>
