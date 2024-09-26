[**@ceramic-sdk/events v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/events](../README.md) / getSignedEventPayload

# Function: getSignedEventPayload()

> **getSignedEventPayload**\<`Payload`\>(`decoder`, `event`): `Promise`\<`Payload`\>

Decode the payload of a signed event using the provided decoder

## Type Parameters

• **Payload** = `Record`\<`string`, `unknown`\>

## Parameters

• **decoder**: `Decoder`\<`unknown`, `Payload`\>

• **event**: `MapIn`\<`RequiredProps`\<`object`\>, `$TypeOf`\> & `MapIn`\<`OptionalProps`\<`object`\>, `$TypeOf`\>

## Returns

`Promise`\<`Payload`\>
