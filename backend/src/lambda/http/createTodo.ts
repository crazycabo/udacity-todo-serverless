import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'
import { createLogger } from '../../utils/logger'

const logger = createLogger('http')

const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  logger.info('Process event: ', event)

  const parsedEventBody: CreateTodoRequest = JSON.parse(event.body)

  const newTodo = {
    todoId: uuid.v4(),
    ...parsedEventBody
  }

  logger.info(`Create todo from event: ${newTodo}`)

  await docClient.put({
    TableName: todoTable,
    Item: newTodo
  }).promise()

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      newTodo
    })
  }
}
