import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import * as AWS  from 'aws-sdk'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../../auth/utils'

const logger = createLogger('http')

const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  logger.info('Process event: ', event)

  const todoId = event.pathParameters.todoId
  const userId = await getUserId(event.headers.Authorization)
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  const todo = {
    TableName: todoTable,
    Key: {
      'todoId': todoId,
      'userId': userId
    },
    ExpressionAttributeNames: { "#N": "name" },
    UpdateExpression: 'set #N = :itemName, dueDate = :dueDate, done = :done',
    ExpressionAttributeValues: {
      ':itemName': updatedTodo.name,
      ':dueDate': updatedTodo.dueDate,
      ':done': updatedTodo.done
    }
  }

  await docClient.update(todo).promise()

  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({})
  }
}
