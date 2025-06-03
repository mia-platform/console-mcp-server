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

import { APIClient } from '../../../lib/client'


const companiesPath = '/api/backend/tenants/'
const companyTemplates = (tenantId: string) => `/api/backend/templates/?tenantId=${tenantId}`
const listCompanyIAMPathTemplate = (tenantId: string) => `/api/companies/${tenantId}/identities`
const companyAuditLogsPathTemplate = (tenantId: string) => `/api/tenants/${tenantId}/audit-logs`

interface Template {
  name: string
  description?: string
  templateId: string
  tenantId: string
  deploy: Record<string, unknown>
}


export async function listCompanies (client: APIClient) {
  return await client.getPaginated<Record<string, unknown>>(companiesPath)
}

export async function listCompanyTemplates (client: APIClient, tenantId: string) {
  return await client.get<Template[]>(companyTemplates(tenantId))
}

export async function listCompanyIAMIdentities (client: APIClient, tenantId: string, type?: string) {
  const params = new URLSearchParams()
  if (type) {
    params.set('identityType', type)
  }

  return await client.getPaginated<Record<string, unknown>>(listCompanyIAMPathTemplate(tenantId), params, 0)
}

export async function getCompanyAuditLogs (client: APIClient, tenantId: string, from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) {
    params.set('from', from)
  }
  if (to) {
    params.set('to', to)
  }

  return await client.getPaginated<Record<string, unknown>>(companyAuditLogsPathTemplate(tenantId), params, 0)
}
