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

import { ConfigMaps, constants, EnvironmentVariablesTypes, ICatalogPlugin, ICatalogTemplate, IProject, PublicVariable } from '@mia-platform/console-types'
import { MockAgent, setGlobalDispatcher } from 'undici'

import { APIClient, applyPublicVariablesChanges, generateImageName, servicePayloadFromMarketplaceItem } from './client'

const { ServiceTypes, DOCKER_IMAGE_NAME_SUGGESTION_TYPES } = constants

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
      itemTypeDefinitionRef: { namespace: 'mia-platform', name: 'plugin' },
    }

    const output = await servicePayloadFromMarketplaceItem(marketplaceItem, 'simple-service', 'some-description')
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
      itemTypeDefinitionRef: { namespace: 'mia-platform', name: 'plugin' },
    }

    const output = await servicePayloadFromMarketplaceItem(marketplaceItem, 'simple-service', 'some-description')

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
      itemTypeDefinitionRef: { namespace: 'mia-platform', name: 'plugin' },
    }

    const output = await servicePayloadFromMarketplaceItem(marketplaceItem, 'simple-service', 'some-description')

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
      itemTypeDefinitionRef: { namespace: 'mia-platform', name: 'template' },
    }

    const output = await servicePayloadFromMarketplaceItem(
      marketplaceItem,
      'my-template',
      'some-description',
      'host.name/my-project-id/my-template',
      'https://git.url/path/for/project/services/my-template',
      'git@git.url:path/for/project/services/my-template',
    )

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
      itemTypeDefinitionRef: { namespace: 'mia-platform', name: 'template' },
    }

    const output = await servicePayloadFromMarketplaceItem(
      marketplaceItem,
      'my-template',
      'some-description',
      'host.name/my-project-id/my-template',
      'https://git.url/path/for/project/my-template',
      'git@git.url:path/for/project/my-template',
    )

    const expected = {
      name: 'my-template',
      type: ServiceTypes.CUSTOM,
      description: 'some-description',
      advanced: false,
      containerPorts: [],
      sourceMarketplaceItem: { itemId: 'simple-template', tenantId: 'public', version: 'v1.0.0' },
      dockerImage: 'host.name/my-project-id/my-template',
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
  const mockedProject: IProject = {
    _id: '000000000000000000',
    name: 'My Project',
    projectId: 'my-project',
    configurationGitPath: 'path/for/project',
    environments: [],
    repository: {},
  }

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

suite('apply public variables changes', () => {
  const currentVariables: PublicVariable[] = [
    { name: 'API_URL', environments: { DEV: { value: 'https://dev.api' }, PROD: { value: 'https://api' } } },
    { name: 'LOG_LEVEL', environments: { DEV: { value: 'debug' } } },
    { name: 'LOCKED', environments: { DEV: { value: 'locked' } }, readOnly: true },
  ]

  test('creates new variables appending them', async (t: TestContext) => {
    const result = applyPublicVariablesChanges(currentVariables, {
      upsert: [ { name: 'NEW_VAR', environments: { DEV: 'a', PROD: 'b' } } ],
    })

    t.assert.deepStrictEqual(result, {
      publicVariables: [
        ...currentVariables,
        { name: 'NEW_VAR', environments: { DEV: { value: 'a' }, PROD: { value: 'b' } } },
      ],
      created: [ 'NEW_VAR' ],
      updated: [],
      deleted: [],
    })
  })

  test('updates existing variables merging values per environment', async (t: TestContext) => {
    const result = applyPublicVariablesChanges(currentVariables, {
      upsert: [ { name: 'API_URL', environments: { DEV: 'https://new-dev.api', TEST: 'https://test.api' } } ],
    })

    t.assert.deepStrictEqual(result.publicVariables[0], {
      name: 'API_URL',
      environments: {
        DEV: { value: 'https://new-dev.api' },
        PROD: { value: 'https://api' },
        TEST: { value: 'https://test.api' },
      },
    })
    t.assert.deepStrictEqual(result.publicVariables.slice(1), currentVariables.slice(1))
    t.assert.deepStrictEqual(result.updated, [ 'API_URL' ])
    t.assert.deepStrictEqual(result.created, [])
    // the input is not mutated
    t.assert.deepStrictEqual(currentVariables[0].environments.DEV, { value: 'https://dev.api' })
  })

  test('deletes variables', async (t: TestContext) => {
    const result = applyPublicVariablesChanges(currentVariables, { delete: [ 'LOG_LEVEL' ] })

    t.assert.deepStrictEqual(result, {
      publicVariables: [ currentVariables[0], currentVariables[2] ],
      created: [],
      updated: [],
      deleted: [ 'LOG_LEVEL' ],
    })
  })

  test('applies upsert and delete together', async (t: TestContext) => {
    const result = applyPublicVariablesChanges(currentVariables, {
      upsert: [
        { name: 'LOG_LEVEL', environments: { PROD: 'info' } },
        { name: 'NEW_VAR', environments: { DEV: 'a' } },
      ],
      delete: [ 'API_URL' ],
    })

    t.assert.deepStrictEqual(result, {
      publicVariables: [
        { name: 'LOG_LEVEL', environments: { DEV: { value: 'debug' }, PROD: { value: 'info' } } },
        currentVariables[2],
        { name: 'NEW_VAR', environments: { DEV: { value: 'a' } } },
      ],
      created: [ 'NEW_VAR' ],
      updated: [ 'LOG_LEVEL' ],
      deleted: [ 'API_URL' ],
    })
  })

  test('throws when a variable to delete does not exist', async (t: TestContext) => {
    t.assert.throws(
      () => applyPublicVariablesChanges(currentVariables, { delete: [ 'MISSING', 'LOG_LEVEL' ] }),
      { message: 'public variables to delete not found: MISSING' },
    )
  })

  test('throws when a read-only variable would be modified or deleted', async (t: TestContext) => {
    t.assert.throws(
      () => applyPublicVariablesChanges(currentVariables, { upsert: [ { name: 'LOCKED', environments: { DEV: 'x' } } ] }),
      { message: 'read-only public variables cannot be modified or deleted: LOCKED' },
    )
    t.assert.throws(
      () => applyPublicVariablesChanges(currentVariables, { delete: [ 'LOCKED' ] }),
      { message: 'read-only public variables cannot be modified or deleted: LOCKED' },
    )
  })

  test('throws on structurally invalid changes', async (t: TestContext) => {
    t.assert.throws(
      () => applyPublicVariablesChanges(currentVariables, {}),
      { message: 'at least one public variable to upsert or delete is required' },
    )
    t.assert.throws(
      () => applyPublicVariablesChanges(currentVariables, { upsert: [], delete: [] }),
      { message: 'at least one public variable to upsert or delete is required' },
    )
    t.assert.throws(
      () => applyPublicVariablesChanges(currentVariables, { delete: [ 'lower_case' ] }),
      { message: 'invalid public variable names: lower_case. Names must match ^([A-Z])([A-Z0-9_]*)$' },
    )
    t.assert.throws(
      () => applyPublicVariablesChanges(currentVariables, {
        upsert: [ { name: 'LOG_LEVEL', environments: { DEV: 'info' } } ],
        delete: [ 'LOG_LEVEL' ],
      }),
      { message: 'public variables cannot be both upserted and deleted: LOG_LEVEL' },
    )
    t.assert.throws(
      () => applyPublicVariablesChanges(currentVariables, {
        upsert: [
          { name: 'NEW_VAR', environments: { DEV: 'a' } },
          { name: 'NEW_VAR', environments: { PROD: 'b' } },
        ],
      }),
      { message: 'public variables listed more than once: NEW_VAR' },
    )
    t.assert.throws(
      () => applyPublicVariablesChanges(currentVariables, { upsert: [ { name: 'NEW_VAR', environments: {} } ] }),
      { message: 'public variables to upsert must set a value for at least one environment: NEW_VAR' },
    )
  })
})

suite('update public variables', () => {
  const mockedEndpoint = 'http://localhost:3000'
  const projectId = 'test-project-id'
  const refId = 'main'
  const configurationPath = `/api/backend/projects/${projectId}/revisions/${refId}/configuration`

  const currentConfiguration = {
    commitId: 'previous-commit-id',
    fastDataConfig: { some: 'fast-data' },
    microfrontendPluginsConfig: { some: 'microfrontend' },
    extensionsConfig: { files: { some: 'file' } },
    services: { 'api-gateway': { name: 'api-gateway', type: 'custom' } },
    endpoints: { '/': { basePath: '/', type: 'custom', service: 'api-gateway' } },
    collections: {},
    unsecretedVariables: [
      { name: 'API_URL', environments: { DEV: { value: 'https://dev.api' }, PROD: { value: 'https://api' } } },
      { name: 'LOCKED', environments: { DEV: { value: 'locked' } }, readOnly: true },
    ],
  }

  let agent: MockAgent
  beforeEach(() => {
    agent = new MockAgent()
    agent.disableNetConnect()
    setGlobalDispatcher(agent)
  })

  function interceptToggles (environmentBased = false) {
    agent.get(mockedEndpoint).intercept({
      path: '/api/feature-toggles',
      method: 'GET',
      query: {
        projectId,
        featureToggleIds: 'ENABLE_ENVIRONMENT_BASED_CONFIGURATION_MANAGEMENT',
      },
    }).reply(200, { ENABLE_ENVIRONMENT_BASED_CONFIGURATION_MANAGEMENT: environmentBased })
  }

  test('saves the merged public variables preserving the rest of the configuration', async (t: TestContext) => {
    interceptToggles()
    agent.get(mockedEndpoint).intercept({ path: configurationPath, method: 'GET' }).
      reply(200, currentConfiguration)

    let savedBody: Record<string, unknown> | undefined
    agent.get(mockedEndpoint).intercept({ path: configurationPath, method: 'POST' }).
      reply(200, (opts) => {
        savedBody = JSON.parse(opts.body as string)
        return { id: 'new-commit-id' }
      })

    const client = new APIClient(mockedEndpoint)
    const result = await client.updatePublicVariables(projectId, refId, {
      upsert: [
        { name: 'API_URL', environments: { DEV: 'https://new-dev.api' } },
        { name: 'NEW_VAR', environments: { PROD: 'value' } },
      ],
    })

    t.assert.deepStrictEqual(result, {
      saveResponse: { id: 'new-commit-id' },
      created: [ 'NEW_VAR' ],
      updated: [ 'API_URL' ],
      deleted: [],
    })
    t.assert.deepStrictEqual(savedBody, {
      title: '[mcp] updated public variables',
      fastDataConfig: currentConfiguration.fastDataConfig,
      microfrontendPluginsConfig: currentConfiguration.microfrontendPluginsConfig,
      extensionsConfig: currentConfiguration.extensionsConfig,
      config: {
        ...currentConfiguration,
        unsecretedVariables: [
          { name: 'API_URL', environments: { DEV: { value: 'https://new-dev.api' }, PROD: { value: 'https://api' } } },
          currentConfiguration.unsecretedVariables[1],
          { name: 'NEW_VAR', environments: { PROD: { value: 'value' } } },
        ],
      },
      previousSave: 'previous-commit-id',
      deletedElements: {},
    })
  })

  test('saves on the environment based configuration when the feature toggle is enabled', async (t: TestContext) => {
    const environmentConfigurationPath = `/api/projects/${projectId}/environments/${refId}/configuration`
    interceptToggles(true)
    agent.get(mockedEndpoint).intercept({ path: environmentConfigurationPath, method: 'GET' }).
      reply(200, currentConfiguration)

    let savedBody: { config: { unsecretedVariables: unknown } } | undefined
    agent.get(mockedEndpoint).intercept({ path: environmentConfigurationPath, method: 'POST' }).
      reply(200, (opts) => {
        savedBody = JSON.parse(opts.body as string)
        return { id: 'new-commit-id' }
      })

    const client = new APIClient(mockedEndpoint)
    const result = await client.updatePublicVariables(projectId, refId, { delete: [ 'API_URL' ] })

    t.assert.deepStrictEqual(result.deleted, [ 'API_URL' ])
    t.assert.deepStrictEqual(savedBody?.config.unsecretedVariables, [ currentConfiguration.unsecretedVariables[1] ])
  })

  test('does not save when the changes cannot be applied', async (t: TestContext) => {
    interceptToggles()
    agent.get(mockedEndpoint).intercept({ path: configurationPath, method: 'GET' }).
      reply(200, currentConfiguration)

    const client = new APIClient(mockedEndpoint)
    await t.assert.rejects(
      async () => await client.updatePublicVariables(projectId, refId, { delete: [ 'LOCKED' ] }),
      { message: 'read-only public variables cannot be modified or deleted: LOCKED' },
    )
    // no POST interceptor is registered and net connect is disabled: reaching the save would fail differently
    t.assert.deepStrictEqual(agent.pendingInterceptors(), [])
  })

  test('saveConfiguration keeps the default title and the existing public variables', async (t: TestContext) => {
    interceptToggles()
    agent.get(mockedEndpoint).intercept({ path: configurationPath, method: 'GET' }).
      reply(200, currentConfiguration)

    let savedBody: { title: string, config: { unsecretedVariables: unknown } } | undefined
    agent.get(mockedEndpoint).intercept({ path: configurationPath, method: 'POST' }).
      reply(200, (opts) => {
        savedBody = JSON.parse(opts.body as string)
        return { id: 'new-commit-id' }
      })

    const client = new APIClient(mockedEndpoint)
    await client.saveConfiguration(projectId, refId, { configMaps: {} })

    t.assert.strictEqual(savedBody?.title, '[mcp] created resources')
    t.assert.deepStrictEqual(savedBody?.config.unsecretedVariables, currentConfiguration.unsecretedVariables)
  })
})
