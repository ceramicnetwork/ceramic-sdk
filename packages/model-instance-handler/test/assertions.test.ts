import { randomCID } from '@ceramic-sdk/identifiers'
import type {
  DocumentDataEventPayload,
  DocumentInitEventHeader,
  DocumentMetadata,
} from '@ceramic-sdk/model-instance-protocol'
import type { ModelDefinitionV2 } from '@ceramic-sdk/model-protocol'

import {
  assertNoImmutableFieldChange,
  assertValidContent,
  assertValidInitHeader,
  assertValidUniqueValue,
} from '../src/assertions.js'
import type { DocumentState } from '../src/types.js'
import { encodeUniqueFieldsValue } from '../src/utils.js'

// describe('assertEventLinksToState()', () => {
//   test('throws if the state log is empty', () => {
//     const cid = randomCID()
//     expect(() => {
//       assertEventLinksToState(
//         { id: cid } as unknown as DocumentDataEventPayload,
//         { log: [] } as unknown as DocumentState,
//       )
//     }).toThrow('Invalid document state: log is empty')
//   })

//   test('throws if the event id does not match the init event cid', () => {
//     const expectedID = randomCID().toString()
//     const invalidID = randomCID()
//     expect(() => {
//       assertEventLinksToState(
//         { id: invalidID } as unknown as DocumentDataEventPayload,
//         { log: [expectedID] } as unknown as DocumentState,
//       )
//     }).toThrow(
//       `Invalid init CID in event payload for document, expected ${expectedID} but got ${invalidID}`,
//     )
//   })

//   test('throws if the event prev does not match the previous event cid', () => {
//     const initID = randomCID()
//     const expectedID = randomCID()
//     const invalidID = randomCID()
//     expect(() => {
//       assertEventLinksToState(
//         { id: initID, prev: invalidID } as unknown as DocumentDataEventPayload,
//         {
//           log: [initID.toString(), expectedID.toString()],
//         } as unknown as DocumentState,
//       )
//     }).toThrow(
//       `Commit doesn't properly point to previous event payload in log for document ${initID}. Expected ${expectedID}, found 'prev' ${invalidID}`,
//     )
//   })
// })

describe('assertNoImmutableFieldChange()', () => {
  test('throws if an immutable field is changed', () => {
    expect(() => {
      assertNoImmutableFieldChange(
        [{ op: 'replace', path: '/title', value: 'new title' }],
        ['title'],
      )
    }).toThrow('Immutable field "title" cannot be updated')

    expect(() => {
      assertNoImmutableFieldChange(
        [{ op: 'replace', path: '/meta/title', value: 'new title' }],
        ['meta'],
      )
    }).toThrow('Immutable field "meta" cannot be updated')
  })

  test('does not throw if a mutable field is changed', () => {
    expect(() => {
      assertNoImmutableFieldChange(
        [{ op: 'replace', path: '/title', value: 'new title' }],
        ['id'],
      )
    }).not.toThrow()

    expect(() => {
      assertNoImmutableFieldChange(
        [{ op: 'replace', path: '/meta/title', value: 'new title' }],
        ['title'],
      )
    }).not.toThrow()
  })
})

describe('assertValidContent()', () => {
  test('throws if content is invalid', () => {
    expect(() => {
      assertValidContent(
        'testID',
        {
          type: 'object',
          properties: { test: { type: 'string' } },
          required: ['test'],
        },
        { hello: 'world' },
      )
    }).toThrow("Validation Error: data must have required property 'test'")
  })

  test('does not throw if content is valid', () => {
    expect(() => {
      assertValidContent(
        'testID',
        {
          type: 'object',
          properties: { test: { type: 'string' } },
          required: ['test'],
        },
        { test: 'test' },
      )
    }).not.toThrow()
  })
})

describe('assertValidInitHeader()', () => {
  test('"single" account relation header must not include a unique header value', () => {
    const model = {
      accountRelation: { type: 'single' },
    } as unknown as ModelDefinitionV2

    expect(() => {
      assertValidInitHeader(model, {
        unique: new Uint8Array(),
      } as unknown as DocumentInitEventHeader)
    }).toThrow(
      'ModelInstanceDocuments for models with SINGLE accountRelations must be created deterministically',
    )

    expect(() => {
      assertValidInitHeader(model, {} as unknown as DocumentInitEventHeader)
    }).not.toThrow()
  })

  test('"set" account relation needs a unique header value', () => {
    const model = {
      accountRelation: { type: 'set' },
    } as unknown as ModelDefinitionV2

    expect(() => {
      assertValidInitHeader(model, {} as unknown as DocumentInitEventHeader)
    }).toThrow(
      'ModelInstanceDocuments for models with SET accountRelations must be created with a unique field containing data from the fields providing the set semantics',
    )

    expect(() => {
      assertValidInitHeader(model, {
        unique: new Uint8Array(),
      } as unknown as DocumentInitEventHeader)
    }).not.toThrow()
  })

  test('"list" account relation needs a unique header value', () => {
    const model = {
      accountRelation: { type: 'list' },
    } as unknown as ModelDefinitionV2

    expect(() => {
      assertValidInitHeader(model, {} as unknown as DocumentInitEventHeader)
    }).toThrow(
      'ModelInstanceDocuments for models with LIST accountRelations must be created with a unique field',
    )

    expect(() => {
      assertValidInitHeader(model, {
        unique: new Uint8Array(),
      } as unknown as DocumentInitEventHeader)
    }).not.toThrow()
  })

  test('"none" account relation does not allow document creation', () => {
    const model = {
      accountRelation: { type: 'none' },
      name: 'ModelInterface',
    } as unknown as ModelDefinitionV2

    expect(() => {
      assertValidInitHeader(model, {} as unknown as DocumentInitEventHeader)
    }).toThrow(
      'ModelInstanceDocument Streams cannot be created on interface Models. Use a different model than ModelInterface to create the ModelInstanceDocument.',
    )
  })

  test('unsupported account relation throws', () => {
    const model = {
      accountRelation: { type: 'unknown' },
      name: 'InvalidModel',
    } as unknown as ModelDefinitionV2

    expect(() => {
      assertValidInitHeader(model, {} as unknown as DocumentInitEventHeader)
    }).toThrow(
      'Unsupported account relation unknown found in Model InvalidModel',
    )
  })
})

describe('assertValidUniqueValue()', () => {
  test('throws if the unique metadata value is missing', () => {
    const model = {
      accountRelation: { type: 'set' },
    } as unknown as ModelDefinitionV2

    expect(() => {
      assertValidUniqueValue(model, {} as unknown as DocumentMetadata, {})
    }).toThrow('Missing unique metadata value')
  })

  test('throws if the content is missing', () => {
    const model = {
      accountRelation: { type: 'set' },
    } as unknown as ModelDefinitionV2

    expect(() => {
      assertValidUniqueValue(
        model,
        { unique: new Uint8Array() } as unknown as DocumentMetadata,
        null,
      )
    }).toThrow('Missing content')
  })

  test('throws if the content values do not match the unique metadata value', () => {
    const model = {
      accountRelation: { type: 'set', fields: ['foo', 'bar'] },
    } as unknown as ModelDefinitionV2

    expect(() => {
      assertValidUniqueValue(
        model,
        { unique: new Uint8Array() } as unknown as DocumentMetadata,
        { foo: 'foo', bar: 'bar' },
      )
    }).toThrow(
      'Unique content fields value does not match metadata. If you are trying to change the value of these fields, this is causing this error: these fields values are not mutable.',
    )
  })

  test('does not throw if the content values match the unique metadata value', () => {
    const model = {
      accountRelation: { type: 'set', fields: ['foo', 'bar'] },
    } as unknown as ModelDefinitionV2

    expect(() => {
      assertValidUniqueValue(
        model,
        {
          unique: encodeUniqueFieldsValue(['one', 'two']),
        } as unknown as DocumentMetadata,
        { foo: 'one', bar: 'two' },
      )
    }).not.toThrow()
  })

  test('does not throw if the model does not use the "set" account relation', () => {
    const model = {
      accountRelation: { type: 'list' },
    } as unknown as ModelDefinitionV2

    expect(() => {
      assertValidUniqueValue(
        model,
        { unique: new Uint8Array() } as unknown as DocumentMetadata,
        { foo: 'one', bar: 'two' },
      )
    }).not.toThrow()
  })
})
