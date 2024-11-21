[**@ceramic-sdk/events v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/events](../README.md) / eventToContainer

# Function: eventToContainer()

> **eventToContainer**\<`Payload`\>(`did`, `codec`, `event`): `Promise`\<[`EventContainer`](../type-aliases/EventContainer.md)\<`Payload`\>\>

Decode a Ceramic event into a container using the provided verifier DID and payload decoder

## Type Parameters

• **Payload**

## Parameters

• **did**: `DID`

• **codec**: `Decoder`\<`unknown`, `Payload`\>

• **event**: `unknown`

## Returns

`Promise`\<[`EventContainer`](../type-aliases/EventContainer.md)\<`Payload`\>\>
