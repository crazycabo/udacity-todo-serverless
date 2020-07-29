import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const jwksUrl = 'https://dev-5u2jbkem.us.auth0.com/.well-known/jwks.json'

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {

  logger.info('Authorize user', event.authorizationToken)

  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {

  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  const jsonWebKeyResponse = await Axios.get(jwksUrl)
  const jsonWebKeys: any[] = jsonWebKeyResponse.data.keys

  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  const signingKeys = jsonWebKeys.filter(key => key.use === 'sig'
      && key.kty === 'RSA'
      && key.kid === jwt.header.kid
      && key.x5c
      && key.x5c.length
    ).map(key => {
      return { kid: key.kid, nbf: key.nbf, publicKey: buildCertificate(key.x5c[0]) }
    });

  const signingKey = signingKeys.find(key => key.kid === jwt.header.kid)

  if(!signingKey) {
    logger.error("No valid signing keys found'")
    throw new Error('No valid signing keys found')
  }

  return verify(token, signingKey.publicKey, { algorithms: [ 'RS256' ] }) as JwtPayload
}

function getToken(authHeader: string): string {

  if (!authHeader)
    throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

function buildCertificate(keyData) {

  const key = keyData.match(/.{1,64}/g).join('\n')

  return `-----BEGIN CERTIFICATE-----\n${key}\n-----END CERTIFICATE-----\n`
}
