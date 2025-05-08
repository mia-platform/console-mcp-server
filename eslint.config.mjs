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

// @ts-check
import eslint from '@eslint/js'
import stylisticJs from '@stylistic/eslint-plugin-js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    files: [
      '**/*.{ts,tsx,cts,mts,js,cjs,mjs}',
    ],
  },
  {
    ignores: [
      'node_modules/**',
      'mcp-server/**',
      'coverage/**',
    ],
  },
  eslint.configs.recommended,
  stylisticJs.configs.all,
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  {
    rules: {
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: false,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: [ 'none', 'all', 'single', 'multiple' ],
          allowSeparatedGroups: true,
        },
      ],
      '@stylistic/js/multiline-comment-style': 'off',
      '@stylistic/js/lines-between-class-members': 'off',
      '@stylistic/js/newline-per-chained-call': 'off',
      '@stylistic/js/indent': [
        'error',
        2,
      ],
      '@stylistic/js/quotes': [
        'error',
        'single',
        {
          allowTemplateLiterals: true,
        },
      ],
      '@stylistic/js/quote-props': [
        'error',
        'as-needed',
      ],
      '@stylistic/js/semi': [
        'error',
        'never',
      ],
      '@stylistic/js/comma-dangle': [
        'error',
        'always-multiline',
      ],
      '@stylistic/js/function-call-argument-newline': [
        'error',
        'consistent',
      ],
      '@stylistic/js/padded-blocks': [
        'error',
        'never',
      ],
      '@stylistic/js/object-curly-spacing': [
        'error',
        'always',
      ],
      '@stylistic/js/array-bracket-spacing': [
        'error',
        'always',
      ],
      '@stylistic/js/array-bracket-newline': [
        'error',
        'consistent',
      ],
      '@stylistic/js/array-element-newline': [
        'error',
        'consistent',
      ],
      '@stylistic/js/object-property-newline': [
        'error',
        {
          allowAllPropertiesOnSameLine: true,
        },
      ],
    },
  },
)
