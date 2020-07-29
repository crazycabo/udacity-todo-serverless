import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS  from 'aws-sdk'
import { createLogger } from '../../utils/logger'
import { parseUserId } from '../../auth/utils'

const logger = createLogger('http')

const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE
const userIndex = process.env.USER_ID_INDEX

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  logger.info('Process event: ', event)

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const userId = await parseUserId(jwtToken)

  const result = await docClient.query({
    TableName: todoTable,
    IndexName: userIndex,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }).promise()

  const items = result.Items

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      items
    })
  }
}
