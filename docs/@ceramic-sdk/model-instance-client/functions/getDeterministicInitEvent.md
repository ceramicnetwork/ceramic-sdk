[**@ceramic-sdk/model-instance-client v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/model-instance-client](../README.md) / getDeterministicInitEvent

# Function: getDeterministicInitEvent()

> **getDeterministicInitEvent**(`model`, `controller`, `uniqueValue`?): [`EncodedDeterministicInitEventPayload`](../../model-instance-protocol/type-aliases/EncodedDeterministicInitEventPayload.md)

Get an encoded deterministic init event for a ModelInstanceDocument stream

## Parameters

• **model**: [`StreamID`](../../identifiers/classes/StreamID.md)

• **controller**: `string` \| `string` & `WithOpaque`\<`"DIDString"`\>

• **uniqueValue?**: `Uint8Array`

## Returns

[`EncodedDeterministicInitEventPayload`](../../model-instance-protocol/type-aliases/EncodedDeterministicInitEventPayload.md)
