import {
  type SignedEvent,
  carFromString,
  carToString,
  eventFromString,
  eventToCAR,
} from '@ceramic-sdk/events'
import type { CAR } from 'cartonne'
import type { Codec, Decoder } from 'codeco'
import type { CID } from 'multiformats/cid'
import createAPIClient, { type HeadersOptions } from 'openapi-fetch'
import type { SimplifyDeep } from 'type-fest'

import type { components, paths } from './__generated__/api'

export type CeramicAPI = ReturnType<typeof createAPIClient<paths>>

export type Schemas = SimplifyDeep<components['schemas']>
export type Schema<Name extends keyof Schemas> = SimplifyDeep<Schemas[Name]>

export type ClientParams = {
  /** Ceramic One server URL */
  url: string
  /** Custom fetch function to use for requests */
  fetch?: (request: Request) => ReturnType<typeof fetch>
  /** Additional HTTP headers to send with requests */
  headers?: HeadersOptions
}

export type EventsFeedParams = {
  /** Resume token */
  resumeAt?: string
  /** Maximum number of events to return in response */
  limit?: number
}

export class CeramicClient {
  #api: CeramicAPI

  constructor(params: ClientParams) {
    const { url, ...options } = params
    this.#api = createAPIClient<paths>({
      baseUrl: `${url}/ceramic`,
      ...options,
    })
  }

  /** OpenAPI client used internally, provides low-level access to the HTTP APIs exposed by the Ceramic One server */
  get api(): CeramicAPI {
    return this.#api
  }

  /** Get the raw event response for the given event CID */
  async getEvent(id: string): Promise<Schema<'Event'>> {
    const { data, error } = await this.#api.GET('/events/{event_id}', {
      params: { path: { event_id: id } },
    })
    if (error != null) {
      throw new Error(error.message)
    }
    return data
  }

  /** Get the string-encoded event for the given event CID */
  async getEventData(id: string): Promise<string> {
    const event = await this.getEvent(id)
    if (event.data == null) {
      throw new Error('Missing event data')
    }
    return event.data
  }

  /** Get the CAR-encoded event for the given event CID */
  async getEventCAR(id: string): Promise<CAR> {
    const data = await this.getEventData(id)
    return carFromString(data)
  }

  /** Get the decoded event for the given decoder and event CID */
  async getEventType<Payload>(
    decoder: Decoder<unknown, Payload>,
    id: string,
  ): Promise<SignedEvent | Payload> {
    const data = await this.getEventData(id)
    return eventFromString(decoder, data)
  }

  /** Get the events feed based on the given parameters */
  async getEventsFeed(
    params: EventsFeedParams = {},
  ): Promise<Schema<'EventFeed'>> {
    const { data, error } = await this.#api.GET('/feed/events', {
      query: params,
    })
    if (error != null) {
      throw new Error(error.message)
    }
    return data
  }

  /** Get information about the Ceramic One server version */
  async getVersion(): Promise<Schema<'Version'>> {
    const { data, error } = await this.#api.GET('/version')
    if (error != null) {
      throw new Error(error.message)
    }
    return data
  }

  /** Post a string-encoded event to the server */
  async postEvent(data: string): Promise<void> {
    const { error } = await this.#api.POST('/events', { body: { data } })
    if (error != null) {
      throw new Error(error.message)
    }
  }

  /** Post a CAR-encoded event to the server */
  async postEventCAR(car: CAR): Promise<CID> {
    await this.postEvent(carToString(car))
    return car.roots[0]
  }

  /** Encode and post an event to the server */
  async postEventType(codec: Codec<unknown>, event: unknown): Promise<CID> {
    const car = eventToCAR(codec, event)
    return await this.postEventCAR(car)
  }

  /** Register interest in streams using the given model stream ID */
  async registerInterestModel(model: string): Promise<void> {
    const { error } = await this.#api.POST('/interests', {
      body: { sep: 'model', sepValue: model },
    })
    if (error != null) {
      throw new Error(error.message)
    }
  }
}

/** @internal */
export function getCeramicClient(
  ceramic: CeramicClient | string,
): CeramicClient {
  return typeof ceramic === 'string'
    ? new CeramicClient({ url: ceramic })
    : ceramic
}
