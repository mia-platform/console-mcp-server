// Copyright Mia srl
// SPDX-License-Identifier: Apache-2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { beforeEach, suite, test, TestContext } from 'node:test'
import { MockAgent, setGlobalDispatcher } from 'undici'

import { CatalogItemRelease, CatalogVersionedItem, ConfigMaps, constants, EnvironmentVariablesTypes, ICatalogPlugin, ICatalogTemplate, IProject } from '@mia-platform/console-types'

import { APIClient } from '../../apis/http-client'
import { createServiceFromMarketplaceItem, generateImageName, getMarketplaceItem } from './api'

const { ServiceTypes, DOCKER_IMAGE_NAME_SUGGESTION_TYPES } = constants
const mockedEndpoint = 'http://localhost:3000'
const mockedProject: IProject = {
  _id: '000000000000000000000',
  name: 'my-project',
  configurationGitPath: '/path/for/project/configuration',
  projectId: 'my-project-id',
  environments: [],
  repository: {
    providerId: 'gitlab',
  },
  pipelines: {
    type: 'gitlab-ci',
  },
  containerRegistries: [
    {
      id: 'registry-id',
      name: 'registry',
      hostname: 'host.name',
      isDefault: true,
    },
  ],
  dockerImageNameSuggestion: {
    type: DOCKER_IMAGE_NAME_SUGGESTION_TYPES.PROJECT_ID,
  },
}

suite('create service from marketplace plugin', () => {
  const client = new APIClient(mockedEndpoint)
  test('simple service without configmap or secrets', async (t: TestContext) => {
    const inputResources: ICatalogPlugin.Service = {
      name: 'simple-service',
      type: 'plugin',
      dockerImage: 'my-docker-image',
      defaultEnvironmentVariables: [
        { name: 'env1', value: 'val1', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'env2', value: 'val2', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'CONFIG_PATH', value: '/foo/bar', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
      ],
      defaultResources: {
        memoryLimits: { min: '85Mi', max: '136Mi' },
        cpuLimits: { min: '23m', max: '77m' },
      },
      defaultProbes: {
        liveness: { path: '/-/custom/', port: 'http' },
        readiness: { path: '/-/custom/', port: 'http' },
        startup: { cmd: [ 'command' ] },
      },
      mapEnvVarToMountPath: {
        collections: {
          type: 'folder',
          envName: 'COLLECTION_DEFINITION_FOLDER',
        },
      },
      args: [ '--kafka.server={{KAFKA_BROKERS}}', '--sasl.username={{KAFKA_SASL_USERNAME}}' ],
      defaultMonitoring: {
        endpoints: [ {
          path: '/-/metrics',
          port: '3000',
          interval: '30s',
        } ],
      },
      defaultTerminationGracePeriodSeconds: 100,
      defaultDocumentationPath: '/documentation/custom',
      componentId: 'some-plugin',
      links: [
        { targetSection: 'some-section', enableIf: 'SOME_FT', label: 'Resource' },
      ],
    }

    const expected = {
      name: 'simple-service',
      type: ServiceTypes.CUSTOM,
      description: 'some-description',
      advanced: false,
      containerPorts: [],
      sourceMarketplaceItem: { itemId: 'simple-service', tenantId: 'public', version: 'v1.0.0' },
      dockerImage: 'my-docker-image',
      tags: [ ServiceTypes.CUSTOM ],
      environment: [
        { name: 'env1', value: 'val1', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'env2', value: 'val2', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'CONFIG_PATH', value: '/foo/bar', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
      ],
      resources: {
        memoryLimits: { min: '85Mi', max: '136Mi' },
        cpuLimits: { min: '23m', max: '77m' },
      },
      mapEnvVarToMountPath: {
        collections: { type: 'folder', envName: 'COLLECTION_DEFINITION_FOLDER' },
      },
      probes: {
        liveness: { path: '/-/custom/', port: 'http' },
        readiness: { path: '/-/custom/', port: 'http' },
        startup: { cmd: [ 'command' ] },
      },
      serviceAccountName: 'simple-service',
      args: [ '--kafka.server={{KAFKA_BROKERS}}', '--sasl.username={{KAFKA_SASL_USERNAME}}' ],
      monitoring: {
        endpoints: [ { path: '/-/metrics', port: '3000', interval: '30s' } ],
      },
      terminationGracePeriodSeconds: 100,
      logParser: constants.MIA_LOG_PARSER_JSON,
      swaggerPath: '/documentation/custom',
      sourceComponentId: 'some-plugin',
      links: [
        { targetSection: 'some-section', enableIf: 'SOME_FT', label: 'Resource' },
      ],
      replicas: 1,
    }

    const marketplaceItem: CatalogVersionedItem = {
      _id: 'simple-service-id',
      itemId: 'simple-service',
      name: 'simple-service',
      releaseDate: '2023-10-01T00:00:00.000Z',
      lifecycleStatus: 'published',
      type: 'plugin',
      tenantId: 'public',
      version: {
        name: 'v1.0.0',
        releaseDate: '2023-10-01T00:00:00.000Z',
        lifecycleStatus: 'published',
        releaseNote: 'some release notes',
      },
      resources: {
        services: {
          'simple-service': inputResources,
        },
      },
    }

    const output = await createServiceFromMarketplaceItem(client, mockedProject, marketplaceItem, 'simple-service', 'some-description')
    t.assert.deepStrictEqual(output.services?.['simple-service'], expected)
    t.assert.deepStrictEqual(output.serviceAccounts, { 'simple-service': { name: 'simple-service' } })
  })

  test('service with configmap and secret', async (t: TestContext) => {
    const inputResources: ICatalogPlugin.Service = {
      name: 'simple-service',
      type: 'plugin',
      dockerImage: 'my-docker-image',
      defaultEnvironmentVariables: [
        { name: 'env1', value: 'val1', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'env2', value: 'val2', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'CONFIG_PATH', value: '/foo/bar', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
      ],
      defaultResources: {
        memoryLimits: { min: '85Mi', max: '136Mi' },
        cpuLimits: { min: '23m', max: '77m' },
      },
      defaultProbes: {
        liveness: { path: '/-/custom/', port: 'http' },
        readiness: { path: '/-/custom/', port: 'http' },
        startup: { cmd: [ 'command' ] },
      },
      defaultTerminationGracePeriodSeconds: 100,
      defaultDocumentationPath: '/documentation/custom',
      defaultConfigMaps: [ {
        name: 'my-config',
        mountPath: '/',
        files: [ {
          name: 'my-file',
          content: 'my-content',
        } ],
        viewAsReadOnly: true,
        link: {
          targetSection: 'collections',
        },
      } ],
      defaultSecrets: [ {
        name: 'my-secret',
        mountPath: '/foo/bar',
      } ],
      componentId: 'some-plugin',
      links: [
        { targetSection: 'some-section', enableIf: 'SOME_FT', label: 'Resource' },
      ],
    }

    const marketplaceItem: CatalogVersionedItem = {
      _id: 'simple-service-id',
      itemId: 'simple-service',
      name: 'simple-service',
      releaseDate: '2023-10-01T00:00:00.000Z',
      lifecycleStatus: 'published',
      type: 'plugin',
      tenantId: 'public',
      version: {
        name: 'v1.0.0',
        releaseDate: '2023-10-01T00:00:00.000Z',
        lifecycleStatus: 'published',
        releaseNote: 'some release notes',
      },
      resources: {
        services: {
          'simple-service': inputResources,
        },
      },
    }

    const output = await createServiceFromMarketplaceItem(client, mockedProject, marketplaceItem, 'simple-service', 'some-description')

    const expectedService = {
      name: 'simple-service',
      description: 'some-description',
      type: ServiceTypes.CUSTOM,
      advanced: false,
      containerPorts: [],
      sourceMarketplaceItem: {
        itemId: 'simple-service',
        tenantId: 'public',
        version: 'v1.0.0',
      },
      configMaps: [ {
        name: 'my-config',
        mountPath: '/',
        link: { targetSection: 'collections' },
        viewAsReadOnly: true,
      } ],
      secrets: [ {
        name: 'my-secret',
        mountPath: '/foo/bar',
      } ],
      dockerImage: 'my-docker-image',
      tags: [ ServiceTypes.CUSTOM ],
      environment: [
        { name: 'env1', value: 'val1', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'env2', value: 'val2', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'CONFIG_PATH', value: '/foo/bar', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
      ],
      resources: {
        memoryLimits: { min: '85Mi', max: '136Mi' },
        cpuLimits: { min: '23m', max: '77m' },
      },
      probes: {
        liveness: { path: '/-/custom/', port: 'http' },
        readiness: { path: '/-/custom/', port: 'http' },
        startup: { cmd: [ 'command' ] },
      },
      serviceAccountName: 'simple-service',
      terminationGracePeriodSeconds: 100,
      logParser: constants.MIA_LOG_PARSER_JSON,
      swaggerPath: '/documentation/custom',
      sourceComponentId: 'some-plugin',
      links: [
        { targetSection: 'some-section', enableIf: 'SOME_FT', label: 'Resource' },
      ],
      replicas: 1,
    }
    const expectedConfigMaps: ConfigMaps = {
      'my-config': {
        name: 'my-config',
        files: [ {
          name: 'my-file',
          content: 'my-content',
        } ],
      },
    }
    t.assert.deepStrictEqual(output.services?.['simple-service'], expectedService)
    t.assert.deepStrictEqual(output.serviceAccounts, { 'simple-service': { name: 'simple-service' } })
    t.assert.deepStrictEqual(output.configMaps, expectedConfigMaps)
    t.assert.deepStrictEqual(output.serviceSecrets, { 'my-secret': { name: 'my-secret' } })
  })

  test('service with additional containers', async (t: TestContext) => {
    const inputResources: ICatalogPlugin.Service = {
      name: 'simple-service',
      type: 'plugin',
      dockerImage: 'my-docker-image',
      defaultEnvironmentVariables: [
        { name: 'env1', value: 'val1', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'env2', value: 'val2', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'CONFIG_PATH', value: '/foo/bar', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
      ],
      defaultResources: {
        memoryLimits: { min: '85Mi', max: '136Mi' },
        cpuLimits: { min: '23m', max: '77m' },
      },
      defaultProbes: {
        liveness: { path: '/-/custom/', port: 'http' },
        readiness: { path: '/-/custom/', port: 'http' },
        startup: { cmd: [ 'command' ] },
      },
      defaultTerminationGracePeriodSeconds: 100,
      defaultDocumentationPath: '/documentation/custom',
      defaultConfigMaps: [ {
        name: 'my-config',
        mountPath: '/',
        files: [ {
          name: 'my-file',
          content: 'my-content',
        } ],
        viewAsReadOnly: true,
        link: {
          targetSection: 'collections',
        },
      } ],
      defaultSecrets: [ {
        name: 'my-secret',
        mountPath: '/foo/bar',
      } ],
      componentId: 'some-plugin',
      links: [
        { targetSection: 'some-section', enableIf: 'SOME_FT', label: 'Resource' },
      ],
      additionalContainers: [
        {
          name: 'additional-container',
          dockerImage: 'my-docker-image',
          args: [ '--kafka.server={{KAFKA_BROKERS}}', '--sasl.username={{KAFKA_SASL_USERNAME}}' ],
          defaultEnvironmentVariables: [
            { name: 'env1', value: 'val1', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
          ],
        },
      ],
    }
    const marketplaceItem: CatalogVersionedItem = {
      _id: 'simple-service-id',
      itemId: 'simple-service',
      name: 'simple-service',
      releaseDate: '2023-10-01T00:00:00.000Z',
      lifecycleStatus: 'published',
      type: 'plugin',
      tenantId: 'public',
      version: {
        name: 'v1.0.0',
        releaseDate: '2023-10-01T00:00:00.000Z',
        lifecycleStatus: 'published',
        releaseNote: 'some release notes',
      },
      resources: {
        services: {
          'simple-service': inputResources,
        },
      },
    }

    const output = await createServiceFromMarketplaceItem(client, mockedProject, marketplaceItem, 'simple-service', 'some-description')

    const expectedService = {
      name: 'simple-service',
      description: 'some-description',
      type: ServiceTypes.CUSTOM,
      advanced: false,
      containerPorts: [],
      sourceMarketplaceItem: {
        itemId: 'simple-service',
        tenantId: 'public',
        version: 'v1.0.0',
      },
      configMaps: [ {
        name: 'my-config',
        mountPath: '/',
        link: { targetSection: 'collections' },
        viewAsReadOnly: true,
      } ],
      secrets: [ {
        name: 'my-secret',
        mountPath: '/foo/bar',
      } ],
      dockerImage: 'my-docker-image',
      tags: [ ServiceTypes.CUSTOM ],
      environment: [
        { name: 'env1', value: 'val1', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'env2', value: 'val2', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'CONFIG_PATH', value: '/foo/bar', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
      ],
      resources: {
        memoryLimits: { min: '85Mi', max: '136Mi' },
        cpuLimits: { min: '23m', max: '77m' },
      },
      probes: {
        liveness: { path: '/-/custom/', port: 'http' },
        readiness: { path: '/-/custom/', port: 'http' },
        startup: { cmd: [ 'command' ] },
      },
      serviceAccountName: 'simple-service',
      terminationGracePeriodSeconds: 100,
      logParser: constants.MIA_LOG_PARSER_JSON,
      swaggerPath: '/documentation/custom',
      sourceComponentId: 'some-plugin',
      links: [
        { targetSection: 'some-section', enableIf: 'SOME_FT', label: 'Resource' },
      ],
      replicas: 1,
      additionalContainers: [
        {
          name: 'additional-container',
          dockerImage: 'my-docker-image',
          args: [ '--kafka.server={{KAFKA_BROKERS}}', '--sasl.username={{KAFKA_SASL_USERNAME}}' ],
          environment: [
            { name: 'env1', value: 'val1', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
          ],
        },
      ],
    }
    t.assert.deepStrictEqual(output.services?.['simple-service'], expectedService)
    t.assert.deepStrictEqual(output.serviceAccounts, { 'simple-service': { name: 'simple-service' } })
  })
})

suite('create service from marketplace template', () => {
  const client = new APIClient(mockedEndpoint)
  let agent: MockAgent
  beforeEach(() => {
    agent = new MockAgent()
    setGlobalDispatcher(agent)
  })

  test('simple service without configmap or secrets', async (t: TestContext) => {
    const inputResources: ICatalogTemplate.Service = {
      name: 'simple-template',
      type: 'template',
      archiveUrl: 'http://archive.url',
      pipelines: {
        'gitlab-ci': {
        },
        'github-actions': {},
      },
      componentId: 'some-template',
    }

    const marketplaceItem: CatalogVersionedItem = {
      _id: 'simple-template-id',
      itemId: 'simple-template',
      name: 'simple-template',
      releaseDate: '1970-01-01T00:00:00.000Z',
      lifecycleStatus: 'published',
      type: 'template',
      tenantId: 'public',
      version: {
        name: 'v1.0.0',
        releaseDate: '1970-01-01T00:00:00.000Z',
        lifecycleStatus: 'published',
        releaseNote: '-',
      },
      resources: {
        services: {
          'simple-template': inputResources,
        },
      },
    }

    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/${mockedProject._id}/groups/${encodeURIComponent('/path/for/project')}/subgroups`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      query: {
        includeSelf: 'true',
        page: '1',
        per_page: '200',
      },
    }).reply(200, [
      {
        full_path: '/path/for/project',
      },
      {
        full_path: '/path/for/project/services',
      },
    ])
    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/${mockedProject._id}/service`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        serviceName: 'my-template',
        resourceName: 'simple-template',
        groupName: '/path/for/project/services',
        serviceDescription: 'some-description',
        templateId: marketplaceItem._id,
        repoName: 'my-template',
        pipeline: 'gitlab-ci',
        imageName: `${mockedProject.projectId}/my-template`,
        containerRegistryId: mockedProject.containerRegistries?.[0].id,
      }),
    }).reply(200, {
      dockerImage: `host.name/${mockedProject.projectId}/my-template`,
      webUrl: 'https://git.url/path/for/project/services/my-template',
      sshUrl: 'git@git.url:path/for/project/services/my-template',
    })

    const output = await createServiceFromMarketplaceItem(client, mockedProject, marketplaceItem, 'my-template', 'some-description')

    const expected = {
      name: 'my-template',
      type: ServiceTypes.CUSTOM,
      description: 'some-description',
      advanced: false,
      containerPorts: [],
      sourceMarketplaceItem: { itemId: 'simple-template', tenantId: 'public', version: 'v1.0.0' },
      dockerImage: 'host.name/my-project-id/my-template',
      tags: [ ServiceTypes.CUSTOM ],
      environment: [],
      serviceAccountName: 'my-template',
      logParser: constants.MIA_LOG_PARSER_JSON,
      swaggerPath: '/documentation/json',
      repoUrl: 'https://git.url/path/for/project/services/my-template',
      sshUrl: 'git@git.url:path/for/project/services/my-template',
      replicas: 1,
      sourceComponentId: 'some-template',
    }
    t.assert.deepStrictEqual(output.services?.['my-template'], expected)
    t.assert.deepStrictEqual(output.serviceAccounts, { 'my-template': { name: 'my-template' } })
  })

  test('service with configmap and secret', async (t: TestContext) => {
    const inputResources: ICatalogTemplate.Service = {
      name: 'simple-template',
      type: 'template',
      archiveUrl: 'http://archive.url',
      pipelines: {
        'github-actions': {},
      },
      componentId: 'some-template',
      defaultEnvironmentVariables: [
        { name: 'env1', value: 'val1', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'env2', value: 'val2', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'CONFIG_PATH', value: '/foo/bar', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
      ],
      defaultResources: {
        memoryLimits: { min: '85Mi', max: '136Mi' },
        cpuLimits: { min: '23m', max: '77m' },
      },
      defaultProbes: {
        liveness: { path: '/-/custom/', port: 'http' },
        readiness: { path: '/-/custom/', port: 'http' },
        startup: { cmd: [ 'command' ] },
      },
      defaultTerminationGracePeriodSeconds: 100,
      defaultDocumentationPath: '/documentation/custom',
      defaultConfigMaps: [ {
        name: 'my-config',
        mountPath: '/',
        files: [ {
          name: 'my-file',
          content: 'my-content',
        } ],
        viewAsReadOnly: true,
      } ],
      defaultSecrets: [ {
        name: 'my-secret',
        mountPath: '/foo/bar',
      } ],
    }

    const marketplaceItem: CatalogVersionedItem = {
      _id: 'simple-template-id',
      itemId: 'simple-template',
      name: 'simple-template',
      releaseDate: '1970-01-01T00:00:00.000Z',
      lifecycleStatus: 'published',
      type: 'template',
      tenantId: 'public',
      version: {
        name: 'v1.0.0',
        releaseDate: '1970-01-01T00:00:00.000Z',
        lifecycleStatus: 'published',
        releaseNote: '-',
      },
      resources: {
        services: {
          'simple-template': inputResources,
        },
      },
    }

    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/${mockedProject._id}/groups/${encodeURIComponent('/path/for/project')}/subgroups`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      query: {
        includeSelf: 'true',
        page: '1',
        per_page: '200',
      },
    }).reply(200, [
      {
        full_path: '/path/for/project',
      },
    ])
    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/${mockedProject._id}/service`,
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serviceName: 'my-template',
        resourceName: 'simple-template',
        groupName: '/path/for/project',
        serviceDescription: 'some-description',
        templateId: marketplaceItem._id,
        defaultConfigMaps: [
          {
            name: 'my-config',
            mountPath: '/',
            files: [ {
              name: 'my-file',
              content: 'my-content',
            } ],
            viewAsReadOnly: true,
          },
        ],
        defaultSecrets: [ { name: 'my-secret', mountPath: '/foo/bar' } ],
        repoName: 'my-template',
        imageName: `${mockedProject.projectId}/my-template`,
        containerRegistryId: mockedProject.containerRegistries?.[0].id,
      }),
    }).reply(200, {
      dockerImage: `host.name/${mockedProject.projectId}/my-template`,
      webUrl: 'https://git.url/path/for/project/my-template',
      sshUrl: 'git@git.url:path/for/project/my-template',
    })

    const output = await createServiceFromMarketplaceItem(client, mockedProject, marketplaceItem, 'my-template', 'some-description')

    const expected = {
      name: 'my-template',
      type: ServiceTypes.CUSTOM,
      description: 'some-description',
      advanced: false,
      containerPorts: [],
      sourceMarketplaceItem: { itemId: 'simple-template', tenantId: 'public', version: 'v1.0.0' },
      dockerImage: `host.name/${mockedProject.projectId}/my-template`,
      tags: [ ServiceTypes.CUSTOM ],
      environment: [
        { name: 'env1', value: 'val1', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'env2', value: 'val2', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
        { name: 'CONFIG_PATH', value: '/foo/bar', valueType: EnvironmentVariablesTypes.PLAIN_TEXT },
      ],
      resources: {
        memoryLimits: { min: '85Mi', max: '136Mi' },
        cpuLimits: { min: '23m', max: '77m' },
      },
      configMaps: [ {
        name: 'my-config',
        mountPath: '/',
        viewAsReadOnly: true,
      } ],
      secrets: [ {
        name: 'my-secret',
        mountPath: '/foo/bar',
      } ],
      probes: {
        liveness: { path: '/-/custom/', port: 'http' },
        readiness: { path: '/-/custom/', port: 'http' },
        startup: { cmd: [ 'command' ] },
      },
      serviceAccountName: 'my-template',
      logParser: constants.MIA_LOG_PARSER_JSON,
      swaggerPath: '/documentation/custom',
      repoUrl: 'https://git.url/path/for/project/my-template',
      sshUrl: 'git@git.url:path/for/project/my-template',
      replicas: 1,
      sourceComponentId: 'some-template',
      terminationGracePeriodSeconds: 100,
    }
    const expectedConfigMaps: ConfigMaps = {
      'my-config': {
        name: 'my-config',
        files: [ {
          name: 'my-file',
          content: 'my-content',
        } ],
      },
    }
    t.assert.deepStrictEqual(output.services?.['my-template'], expected)
    t.assert.deepStrictEqual(output.serviceAccounts, { 'my-template': { name: 'my-template' } })
    t.assert.deepStrictEqual(output.configMaps, expectedConfigMaps)
    t.assert.deepStrictEqual(output.serviceSecrets, { 'my-secret': { name: 'my-secret' } })
  })
})

suite('generate image names', () => {
  test('generate image name with project id', async (t: TestContext) => {
    const project = {
      ...mockedProject,
      dockerImageNameSuggestion: {
        type: DOCKER_IMAGE_NAME_SUGGESTION_TYPES.PROJECT_ID,
      },
    }
    const imageName = await generateImageName('name', project, 'group')
    t.assert.strictEqual(imageName, `${mockedProject.projectId}/name`)
  })

  test('generate image name with repository group', async (t: TestContext) => {
    const project = {
      ...mockedProject,
      dockerImageNameSuggestion: {
        type: DOCKER_IMAGE_NAME_SUGGESTION_TYPES.REPOSITORY,
      },
    }
    const imageName = await generateImageName('name', project, 'group')
    t.assert.strictEqual(imageName, `group/name`)
  })

  test('generate image name with custom registry and custom image name', async (t: TestContext) => {
    const project = {
      ...mockedProject,
      dockerImageNameSuggestion: {
        type: DOCKER_IMAGE_NAME_SUGGESTION_TYPES.CONSTANT_PREFIX,
        prefix: 'prefix',
      },
    }
    const imageName = await generateImageName('name', project, 'group')
    t.assert.strictEqual(imageName, `prefix/name`)
  })
})

suite('get marketplace item', () => {
  const client = new APIClient(mockedEndpoint)
  const marketplaceItem = {
    _id: '000000000000000000000000',
    category: {
      id: 'category-id',
      label: 'Category Label',
    },
    componentsIds: [],
    description: 'description',
    documentation: {
      type: 'markdown',
      url: 'https://git.host/path/to/refs/heads/2.0.0/README.md',
    },
    imageUrl: '/path/to/image.png',
    isLatest: true,
    itemId: 'item-id',
    lifecycleStatus: 'published',
    name: 'get latest version',
    releaseDate: '1970-01-01T00:00:00.000Z',
    repositoryUrl: 'https://git.host/path/to/tree/2.0.0',
    resources: {
      services: {
        service: {
          type: 'template',
          name: 'item-id',
          description: 'description',
          archiveUrl: 'https://git.hos/path/to/archive/refs/heads/2.0.0.tar.gz',
          pipelines: {
            'gitlab-ci': {
              path: '/path/to/ci.yml',
            },
          },
          defaultDocumentationPath: '',
          containerPorts: [
            {
              name: 'http',
              from: 80,
              to: 3000,
              protocol: 'TCP',
            },
          ],
        },
      },
    },
    supportedBy: 'Public',
    supportedByImageUrl: '/path/to/image.png',
    tenantId: 'public',
    type: 'template',
    version: {
      name: '2.0.0',
      releaseNote: '-',
    },
    visibility: {
      public: true,
    },
  }

  let agent: MockAgent
  beforeEach(() => {
    agent = new MockAgent()
    setGlobalDispatcher(agent)

    agent.get(mockedEndpoint).intercept({
      path: '/api/tenants/public/marketplace/items/item-id/versions/2.0.0',
      method: 'GET',
      query: {},
    }).reply(200, marketplaceItem)
  })

  test('get marketplace item from latest version', async (t: TestContext) => {
    agent.get(mockedEndpoint).intercept({
      path: '/api/tenants/public/marketplace/items/item-id/versions',
      method: 'GET',
      query: {
        page: '1',
        per_page: '200',
      },
    }).reply(200, [
      {
        name: 'get latest version',
        description: 'description',
        lifecycleStatus: 'published',
        reference: '000000000000000000000000',
        releaseDate: '1970-01-01T00:00:00.000Z',
        releaseNote: '-',
        version: '1.0.0',
        isLatest: false,
        security: false,
        visibility: {
          allTenants: false,
          public: true,
        },
      },
      {
        name: 'get latest version',
        description: 'description',
        lifecycleStatus: 'published',
        reference: '000000000000000000000000',
        releaseDate: '1970-01-01T00:00:00.000Z',
        releaseNote: '-',
        version: '2.0.0',
        isLatest: true,
        security: false,
        visibility: {
          allTenants: false,
          public: true,
        },
      },
    ] as CatalogItemRelease[])
    const item = await getMarketplaceItem(client, 'item-id', 'public')
    t.assert.deepStrictEqual(item, marketplaceItem)
  })

  test('get marketplace item from specific version', async (t: TestContext) => {
    const item = await getMarketplaceItem(client, 'item-id', 'public', '2.0.0')
    t.assert.deepStrictEqual(item, marketplaceItem)
  })
})
