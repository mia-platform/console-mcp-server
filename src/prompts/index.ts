// import { completable } from '@modelcontextprotocol/sdk/server/completable.js'
// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'

// import validator from 'validator'

// import { APIClient } from '../apis/client'
// import z from 'zod'

// export const addPromptCapabilities = (server: McpServer, _client: APIClient) => {
//   const prompts = _client.listMarketplaceItems('', 'prompts')
//   console.log('Available prompts:', prompts)

//   server.registerPrompt(
//     'introduce',
//     {
//       title: 'Introduce yourself',
//       description: 'A prompt to introduce yourself to the AI',
//       argsSchema: {
//         name: z.string(),
//         lastName: completable(z.string(), (value) => {
//           return [ 'Marino', 'Zoli', 'Cinà', 'Filippi', 'Bortot', 'Pessina', 'Murabito' ].filter((x) => x.startsWith(value))
//         }),
//       },
//     },
//     async ({ name, lastName }) => {
//       // Sanitize input using validator.escape
//       const validatedName = validator.escape(name)
//       const validatedLastName = validator.escape(lastName)

//       return {
//         messages: [
//           {
//             role: 'user',
//             content: {
//               type: 'text',
//               text: `We, ciao! Sono: ${validatedName}!`,
//             },
//           },
//           {
//             role: 'assistant',
//             content: {
//               type: 'text',
//               text: `Ciao ${validatedName}, piacere di conoscerti! Qual è il tuo cognome?`,
//             },
//           },
//           {
//             role: 'user',
//             content: {
//               type: 'text',
//               text: `Il mio cognome è: ${validatedLastName}`,
//             },
//           },
//         ],
//       }
//     },
//   )
// }
