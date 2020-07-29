import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS  from 'aws-sdk'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../../auth/utils'

const logger = createLogger('http')

const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  logger.info('Process event: ', event)

  const todoId = event.pathParameters.todoId
  const userId = getUserId(event.headers.Authorization)

  const todo = {
    TableName: todoTable,
    Key: {
      'todoId': todoId,
      'userId': userId
    }
  }

  await docClient.delete(todo).promise()

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      'message': `Todo ID ${todoId} deleted`
    })
  }
}
