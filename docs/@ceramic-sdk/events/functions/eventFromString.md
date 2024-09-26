[**@ceramic-sdk/events v0.1.0**](../README.md) • **Docs**

***

[Ceramic SDK](../../../README.md) / [@ceramic-sdk/events](../README.md) / eventFromString

# Function: eventFromString()

> **eventFromString**\<`Payload`\>(`decoder`, `value`, `base`?): [`SignedEvent`](../type-aliases/SignedEvent.md) \| `Payload`

Decode an event from a string using the provided codec for unsigned events and the given base (defaults to base64)

## Type Parameters

• **Payload** = `unknown`

## Parameters

• **decoder**: `Decoder`\<`unknown`, `Payload`\>

• **value**: `string`

• **base?**: `"base64url"` \| `"base256emoji"` \| `"base64"` \| `"base64pad"` \| `"base64urlpad"` \| `"base58btc"` \| `"base58flickr"` \| `"base36"` \| `"base36upper"` \| `"base32"` \| `"base32upper"` \| `"base32pad"` \| `"base32padupper"` \| `"base32hex"` \| `"base32hexupper"` \| `"base32hexpad"` \| `"base32hexpadupper"` \| `"base32z"` \| `"base16"` \| `"base16upper"` \| `"base10"` \| `"base8"` \| `"base2"` \| `"identity"`

## Returns

[`SignedEvent`](../type-aliases/SignedEvent.md) \| `Payload`
