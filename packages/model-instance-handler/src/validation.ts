import { StreamID } from '@ceramic-sdk/identifiers'
import type { ModelDefinition } from '@ceramic-sdk/model-protocol'

import type { Context, UnknownContent } from './types.js'

export async function validateRelation(
  context: Context,
  docID: string,
  expectedModelID: string,
  fieldName: string,
): Promise<void> {
  const modelID = await context.getDocumentModel(docID)
  if (modelID === expectedModelID) {
    // Exact model used, relation is valid
    return
  }

  // Other model used, check if it implements the expected interface
  const definition = await context.getModelDefinition(modelID)
  if (
    definition.version !== '1.0' &&
    definition.implements.includes(expectedModelID)
  ) {
    return
  }

  throw new Error(
    `Relation on field ${fieldName} points to Stream ${docID}, which belongs to Model ${modelID}, but this Stream's Model (${definition.name}) specifies that this relation must be to a Stream in the Model ${expectedModelID}`,
  )
}

export async function validateRelationsContent(
  context: Context,
  definition: ModelDefinition,
  content: UnknownContent,
): Promise<void> {
  if (!definition.relations) {
    return
  }

  const toValidate: Array<Promise<void>> = []

  for (const [fieldName, relationDefinition] of Object.entries(
    definition.relations,
  )) {
    const relationType = relationDefinition.type
    switch (relationType) {
      case 'account':
        continue
      case 'document': {
        // Ignore validation if the target field is empty
        if (content[fieldName] == null) {
          continue
        }

        // Validate StreamID value
        let docID: StreamID
        try {
          docID = StreamID.fromString(String(content[fieldName]))
        } catch (err) {
          throw new Error(
            `Error while parsing relation from field ${fieldName}: Invalid StreamID: ${
              (err as Error).message
            }`,
          )
        }

        // Check for expected model the MID must use
        if (relationDefinition.model == null) {
          continue
        }

        toValidate.push(
          validateRelation(
            context,
            docID.toString(),
            relationDefinition.model,
            fieldName,
          ),
        )
        break
      }
      default:
        throw new Error('Unknown relation type')
    }
  }

  await Promise.all(toValidate)
}
