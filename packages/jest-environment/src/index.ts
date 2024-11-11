import { CeramicClient } from '@ceramic-sdk/http-client'
import withContainer from '@databases/with-container'
import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from '@jest/environment'
import NodeEnv from 'jest-environment-node'

type Environment = typeof NodeEnv
const NodeEnvironment = (NodeEnv as unknown as { default: Environment }).default

type StartContainer = typeof withContainer
const startContainer = (withContainer as unknown as { default: StartContainer })
  .default

type RunningContainer = Awaited<ReturnType<StartContainer>>

const DEFAULT_PORT = 5101

const DEFAULT_ENVIRONMENT = {
  CERAMIC_ONE_BIND_ADDRESS: '0.0.0.0:5101',
  CERAMIC_ONE_LOG_FORMAT: 'single-line',
  CERAMIC_ONE_NETWORK: 'in-memory',
  CERAMIC_ONE_STORE_DIR: '/',
}

export type CeramicGlobal = {
  client: CeramicClient
  port: number
}

declare global {
  const ceramic: CeramicGlobal
}

export type EnvironmentOptions = {
  debug?: boolean // default to false
  image?: string // default to "public.ecr.aws/r5b3e0r5/3box/ceramic-one:latest"
  containerName?: string // default to "ceramic-one"
  internalPort?: number // default to 5001
  defaultExternalPort?: number // default to 5001
  externalPort?: number
  connectTimeoutSeconds?: number // default to 10
  environment?: Record<string, string> // Ceramic daemon environment variables
}

export default class CeramicEnvironment extends NodeEnvironment {
  #container?: RunningContainer
  #options: EnvironmentOptions

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context)
    this.#options = config.projectConfig
      .testEnvironmentOptions as EnvironmentOptions
  }

  async setup() {
    await super.setup()

    const { environment: envOverrides, ...options } = this.#options
    const environment = envOverrides
      ? { ...DEFAULT_ENVIRONMENT, ...envOverrides }
      : DEFAULT_ENVIRONMENT

    this.#container = await startContainer({
      debug: options.debug ?? false,
      image: options.image ?? 'public.ecr.aws/r5b3e0r5/3box/ceramic-one:latest',
      containerName:
        options.containerName ??
        `ceramic-${Math.random().toString(36).slice(6)}`,
      internalPort: options.internalPort ?? DEFAULT_PORT,
      defaultExternalPort: options.defaultExternalPort ?? DEFAULT_PORT,
      externalPort: options.externalPort,
      connectTimeoutSeconds: options.connectTimeoutSeconds ?? 10,
      environment,
    })

    const port = this.#container.externalPort
    this.global.ceramic = {
      client: new CeramicClient({ url: `http://localhost:${port}` }),
      port,
    }
  }

  async teardown(): Promise<void> {
    await this.#container?.kill()
    await super.teardown()
  }
}
