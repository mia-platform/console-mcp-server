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

import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { ConfigMaps, constants, EnvironmentVariablesTypes, ICatalogPlugin, ICatalogTemplate, IProject } from '@mia-platform/console-types'

import { APIClient } from '../lib/client'
import { AppContext } from '../server/server'
import { TestMCPServer } from '../server/test-utils.test'
import { addServicesCapabilities, servicePayloadFromMarketplaceItem, servicePayloadFromTemplate } from './services'

const { ServiceTypes, DOCKER_IMAGE_NAME_SUGGESTION_TYPES } = constants

const mockedEndpoint = 'http://localhost:3000'

suite('setup services tools', () => {
  test('should setup services tools to a server', async (t) => {
    const client = await TestMCPServer((server) => {
      const apiClient = new APIClient(mockedEndpoint)
      addServicesCapabilities(server, { client: apiClient } as AppContext)
    })

    const result = await client.request(
      {
        method: 'tools/list',
      },
      ListToolsResultSchema,
    )

    t.assert.equal(result.tools.length, 1)
  })
})

suite('create service from marketplace plugin', () => {
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

    const marketplaceItem: ICatalogPlugin.Item = {
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

    const output = servicePayloadFromMarketplaceItem(marketplaceItem, 'simple-service', 'some-description')
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
    const marketplaceItem: ICatalogPlugin.Item = {
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

    const output = servicePayloadFromMarketplaceItem(marketplaceItem, 'simple-service', 'some-description')
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

    const marketplaceItem: ICatalogPlugin.Item = {
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

    const output = servicePayloadFromMarketplaceItem(marketplaceItem, 'simple-service', 'some-description')
    t.assert.deepStrictEqual(output.services?.['simple-service'], expectedService)
    t.assert.deepStrictEqual(output.serviceAccounts, { 'simple-service': { name: 'simple-service' } })
  })
})

suite('create service from marketplace template', () => {
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

    const project: IProject = {
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

    const marketplaceItem: ICatalogTemplate.Item = {
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

    const apiClient = new APIClient(mockedEndpoint)
    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/${project._id}/groups/${encodeURIComponent('/path/for/project')}/subgroups`,
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
      path: `/api/backend/projects/${project._id}/service`,
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
        imageName: `${project.projectId}/my-template`,
        containerRegistryId: project.containerRegistries?.[0].id,
      }),
    }).reply(200, {
      dockerImage: `host.name/${project.projectId}/my-template`,
      webUrl: 'https://git.url/path/for/project/services/my-template',
      sshUrl: 'git@git.url:path/for/project/services/my-template',
    })
    const output = await servicePayloadFromTemplate(apiClient, marketplaceItem, project, 'my-template', 'some-description')
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

    const project: IProject = {
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
        type: DOCKER_IMAGE_NAME_SUGGESTION_TYPES.CONSTANT_PREFIX,
        prefix: 'prefix',
      },
    }

    const expected = {
      name: 'my-template',
      type: ServiceTypes.CUSTOM,
      description: 'some-description',
      advanced: false,
      containerPorts: [],
      sourceMarketplaceItem: { itemId: 'simple-template', tenantId: 'public', version: 'v1.0.0' },
      dockerImage: 'host.name/prefix/my-template',
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

    const marketplaceItem: ICatalogTemplate.Item = {
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

    const expectedConfigMaps: ConfigMaps = {
      'my-config': {
        name: 'my-config',
        files: [ {
          name: 'my-file',
          content: 'my-content',
        } ],
      },
    }

    const apiClient = new APIClient(mockedEndpoint)
    agent.get(mockedEndpoint).intercept({
      path: `/api/backend/projects/${project._id}/groups/${encodeURIComponent('/path/for/project')}/subgroups`,
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
      path: `/api/backend/projects/${project._id}/service`,
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
        imageName: 'prefix/my-template',
        containerRegistryId: project.containerRegistries?.[0].id,
      }),
    }).reply(200, {
      dockerImage: `host.name/prefix/my-template`,
      webUrl: 'https://git.url/path/for/project/my-template',
      sshUrl: 'git@git.url:path/for/project/my-template',
    })
    const output = await servicePayloadFromTemplate(apiClient, marketplaceItem, project, 'my-template', 'some-description')
    t.assert.deepStrictEqual(output.services?.['my-template'], expected)
    t.assert.deepStrictEqual(output.serviceAccounts, { 'my-template': { name: 'my-template' } })
    t.assert.deepStrictEqual(output.configMaps, expectedConfigMaps)
    t.assert.deepStrictEqual(output.serviceSecrets, { 'my-secret': { name: 'my-secret' } })
  })
})
