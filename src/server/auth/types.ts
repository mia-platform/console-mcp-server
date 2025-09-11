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

export interface RegisterRequest {
  client_id: string
  client_secret?: string
  client_id_issued_at: number
  client_secret_expires_at?: number
  redirect_uris: string[]
  grant_types?: string[]
  response_types?: string[]
  client_name?: string
  token_endpoint_auth_method?: string
  scope?: string
}

export interface AuthorizeQuery {
  client_id: string
  response_type?: string
  redirect_uri?: string
  scope?: string
  state?: string
  code_challenge?: string
  code_challenge_method?: string
}

export interface TokenRequest {
  grant_type: string
  code: string
  client_id: string
  client_secret: string
  redirect_uri?: string
  code_verifier?: string
}

export interface RefreshTokenRequest {
  grant_type: string
  refresh_token: string
  client_id?: string
  client_secret?: string
}
