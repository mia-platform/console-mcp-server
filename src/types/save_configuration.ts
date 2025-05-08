import { Config } from '@mia-platform/console-types'

export type RetrievedConfiguration = Config & {
  fastDataConfig: unknown,
  microfrontendPluginsConfig: unknown,
  extensionsConfig: unknown,
  enabledFeatures: unknown,
}

export interface ConfigToSave {
  title: string,
  previousSave?: string,
  config: Config,
  fastDataConfig: unknown,
  microfrontendPluginsConfig: unknown,
  extensionsConfig: unknown,
  deletedElements: Record<string, unknown>,
}

export interface SaveResponse {
  id: string,
  upgraded?: boolean,
}
