// filepath: /Users/giulioroggero/sourcecode/mia-platform/console-mcp-server/src/lib/designLib.ts
import type { APIClient } from './client'
import type { ProjectDesign } from '../types/project-design'

/**
 * Reads project configurations from the backend API
 * @param client - The API client to use for the request
 * @param projectId - The ID of the project
 * @param revision - The revision to fetch (default: 'DEV')
 * @returns The project configuration object
 */
export async function readProjectConfigurations(
  client: APIClient,
  projectId: string,
  revision: string = 'DEV'
): Promise<ProjectDesign> {
  try {
    //const apiPath = `/api/backend/projects/${projectId}/revisions/${revision}/configuration`
    const apiPath = `/api/projects/${projectId}/environments/${revision}/configuration`
    const data = await client.get<ProjectDesign>(apiPath)
    return data
  } catch (error) {
    const err = error as Error
    throw new Error(`Failed to get project configuration: ${err.message}`)
  }
}

/**
 * Saves project configurations to the backend API
 * @param client - The API client to use for the request
 * @param projectId - The ID of the project
 * @param revision - The revision to update (default: 'DEV')
 * @param design - The modified project design to save
 * @param options - Additional options for the save operation
 * @returns The response from the API
 */
export async function saveProjectConfigurations(
  client: APIClient,
  projectId: string,
  revision: string = 'DEV',
  design: ProjectDesign,
  options: {
    title: string;
    previousSave?: string;
    deletedElements?: Record<string, unknown>;
  },
  //projectMode: string
): Promise<any> {
  try {
    
   // const apiPath = projectMode == 'classic' ? 
   //   `/api/backend/projects/${projectId}/revisions/${revision}/configuration` : 
   //   `/api/projects/${projectId}/environments/${revision}/configuration`
        // TODO which is the correct API path?

    const apiPath = `/api/projects/${projectId}/environments/${revision}/configuration`
    //const apiPath = `/api/backend/projects/${projectId}/revisions/${revision}/configuration`

    const payload = {
      title: options.title,
      previousSave: options.previousSave || design.lastConfigFileCommitId,
      deletedElements: options.deletedElements || {},
      config: design  // Wrap the design in a config property
    }
  
    return await client.post<any>(
      apiPath,
      payload
    )
  } catch (error) {
    const err = error as Error
    throw new Error(`Failed to save project configuration: ${err.message}`)
  }
}
