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

import fs from 'fs/promises'
import { join } from 'path'
import os from 'os'

import { AccessToken } from './token'
import { sha256 } from '../crypto'

function homeFolderPath (): string {
  const homeDir = os.homedir()
  if (!homeDir) {
    return '/'
  }

  return homeDir
}

interface MiactlCache {
  access_token: string
  refresh_token: string
  expiry: string // ISO-8601 format
}

async function getMiactlCache (endpoint: string): Promise<MiactlCache|undefined> {
  let cacheFolderPath: string|undefined = process.env['XDG_CACHE_HOME']
  if (!cacheFolderPath) {
    const home = homeFolderPath()
    cacheFolderPath = join(home, '.cache')
  }

  const cacheKey = sha256(endpoint)
  cacheFolderPath = join(cacheFolderPath, 'miactl', cacheKey)

  const cacheContent = await fs.readFile(cacheFolderPath, { encoding: 'utf-8' })
  if (!cacheContent) {
    return undefined
  }
  return JSON.parse(cacheContent)
}

export async function loadMiactlToken (endpoint: string): Promise<AccessToken | undefined> {
  try {
    const cache = await getMiactlCache(endpoint)
    if (!cache) {
      return undefined
    }

    const expiresInSeconds = Math.floor((new Date(cache.expiry).getTime() - Date.now()) / 1000)
    return new AccessToken(cache.access_token, 'Bearer', expiresInSeconds)
  } catch {
    return undefined
  }
}
