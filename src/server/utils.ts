import { FastifyRequest } from 'fastify'

export const getBaseUrlFromRequest = (req: FastifyRequest) => {
  const { hostname = 'localhost', port = process.env.PORT, protocol = 'https' } = req
  const url = port
    ? `${hostname}:${port}`
    : hostname

  return `${protocol}://${url}`
}
