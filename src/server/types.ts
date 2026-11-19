import { UndiciHeaders } from 'undici/types/dispatcher'

export interface ConsoleMCPServerOptions {
  additionalHeaders?: UndiciHeaders
  clientId?: string
  clientSecret?: string
  enableCentralizedUserManagement?: boolean
}
