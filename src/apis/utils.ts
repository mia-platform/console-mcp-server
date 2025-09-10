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

/**
 * Transform a date string into a Unix timestamp in milliseconds.
 * The result is parsed into a string to be used as a query parameter.
 *
 * @param param a date string in ISO 8601 format or YYYY-MM-DD format.
 * @returns the Unix timestamp in milliseconds as a string, or undefined if the input is undefined.
 */
export function formatQueryParamToUnixTimestamp (param: string | undefined): string | undefined {
  if (!param) {
    return undefined
  }

  let date = new Date(Number(param))
  if (isNaN(date.getTime())) {
    date = new Date(param)
  }

  if (isNaN(date.getTime())) {
    console.log({ param, date, time: date.getTime() })
    throw new Error(`Invalid date format: ${param}`)
  }

  return date.getTime().toString()
}
