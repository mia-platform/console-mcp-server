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

import { suite, test, TestContext } from 'node:test'

import { ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { ConfigMaps, constants, EnvironmentVariablesTypes, ICatalogPlugin, IProject } from '@mia-platform/console-types'

import { APIClient } from '../lib/client'
import { AppContext } from '../server/server'
import { TestMCPServer } from '../server/test-utils.test'
import { addServicesCapabilities, servicePayloadFromMarketplaceItem } from './services'

const { ServiceTypes } = constants

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

suite('create service from marketplace adapter', () => {
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

    const output = servicePayloadFromMarketplaceItem(marketplaceItem, {} as IProject, 'simple-service', 'some-description')

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

    const output = servicePayloadFromMarketplaceItem(marketplaceItem, {} as IProject, 'simple-service', 'some-description')

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

    const output = servicePayloadFromMarketplaceItem(marketplaceItem, {} as IProject, 'simple-service', 'some-description')

    t.assert.deepStrictEqual(output.services?.['simple-service'], expectedService)
    t.assert.deepStrictEqual(output.serviceAccounts, { 'simple-service': { name: 'simple-service' } })
  })
})
