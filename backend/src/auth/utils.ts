import { decode } from 'jsonwebtoken'

import { JwtPayload } from './JwtPayload'

/**
 * Return user ID from JWT within auth header
 * @param headerAuth Request auth header
 * @returns user ID
 */
export function getUserId(headerAuth: string): string {
  const split = headerAuth.split(' ')
  const jwtToken = split[1]

  return parseUserId(jwtToken)
}

/**
 * Parse a JWT token and return a user id
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */
export function parseUserId(jwtToken: string): string {
  const decodedJwt = decode(jwtToken) as JwtPayload

  return decodedJwt.sub
}
