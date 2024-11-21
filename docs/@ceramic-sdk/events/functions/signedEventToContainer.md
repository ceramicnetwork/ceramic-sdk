[**@ceramic-sdk/events v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/events](../README.md) / signedEventToContainer

# Function: signedEventToContainer()

> **signedEventToContainer**\<`Payload`\>(`did`, `codec`, `event`): `Promise`\<[`SignedEventContainer`](../type-aliases/SignedEventContainer.md)\<`Payload`\>\>

Decode a signed Ceramic event into a container using the provided verifier DID and payload decoder

## Type Parameters

• **Payload**

## Parameters

• **did**: `DID`

• **codec**: `Decoder`\<`unknown`, `Payload`\>

• **event**: `MapIn`\<`RequiredProps`\<`object`\>, `$TypeOf`\> & `MapIn`\<`OptionalProps`\<`object`\>, `$TypeOf`\>

## Returns

`Promise`\<[`SignedEventContainer`](../type-aliases/SignedEventContainer.md)\<`Payload`\>\>
