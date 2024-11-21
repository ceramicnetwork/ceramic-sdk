[**@ceramic-sdk/events v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/events](../README.md) / eventFromCAR

# Function: eventFromCAR()

> **eventFromCAR**\<`Payload`\>(`decoder`, `car`, `eventCID`?): [`SignedEvent`](../type-aliases/SignedEvent.md) \| `Payload`

Decode an event from a string using the provided codec for unsigned events

## Type Parameters

• **Payload** = `unknown`

## Parameters

• **decoder**: `Decoder`\<`unknown`, `Payload`\>

• **car**: `CAR`

• **eventCID?**: `CID`\<`unknown`, `number`, `number`, `Version`\>

## Returns

[`SignedEvent`](../type-aliases/SignedEvent.md) \| `Payload`
