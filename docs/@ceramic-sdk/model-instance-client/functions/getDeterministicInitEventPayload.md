[**@ceramic-sdk/model-instance-client v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/model-instance-client](../README.md) / getDeterministicInitEventPayload

# Function: getDeterministicInitEventPayload()

> **getDeterministicInitEventPayload**(`model`, `controller`, `uniqueValue`?): [`DeterministicInitEventPayload`](../../model-instance-protocol/type-aliases/DeterministicInitEventPayload.md)

Get a deterministic init event payload for a ModelInstanceDocument stream.

## Parameters

• **model**: [`StreamID`](../../identifiers/classes/StreamID.md)

• **controller**: `string` \| `string` & `WithOpaque`\<`"DIDString"`\>

• **uniqueValue?**: `Uint8Array`

## Returns

[`DeterministicInitEventPayload`](../../model-instance-protocol/type-aliases/DeterministicInitEventPayload.md)

## See

[createInitEvent](createInitEvent.md) for creating non-deterministic events.
