import { IFeatureTogglesClient } from './FeaturesToggleClient'

export function getMockFeatureTogglesClient (mock: Partial<IFeatureTogglesClient>): IFeatureTogglesClient {
  return {
    ...mock,
  } as IFeatureTogglesClient
}
