import * as AWS  from 'aws-sdk'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { TodoItem } from '../models/TodoItem'
import { createLogger } from '../utils/logger'
import { getUserId } from '../lambda/utils'
import * as uuid from 'uuid'

const logger = createLogger('aws')

const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE
const userIndex = process.env.USER_ID_INDEX

export async function getTodos(event: APIGatewayProxyEvent): Promise<TodoItem[]> {

  const userId = getUserId(event)

  logger.info(`Get todo items for user ID: ${userId}`)

  const result = await docClient.query({
    TableName: todoTable,
    IndexName: userIndex,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }).promise()

  return result.Items as TodoItem[]
}

export async function createTodo(event: APIGatewayProxyEvent): Promise<TodoItem> {

  const parsedEventBody: CreateTodoRequest = JSON.parse(event.body)
  const userId = getUserId(event)

  const item = {
    todoId: uuid.v4(),
    userId: userId,
    createdAt: new Date().toISOString(),
    done: false,
    ...parsedEventBody
  }

  logger.info(`Create todo from event: ${item}`)

  await docClient.put({
    TableName: todoTable,
    Item: item
  }).promise()

  return item
}

export async function updateTodo(event: APIGatewayProxyEvent) {

  const todoId = event.pathParameters.todoId
  const userId = await getUserId(event)
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  const todo = {
    TableName: todoTable,
    Key: {
      todoId,
      userId
    },
    ExpressionAttributeNames: { "#N": "name" },
    UpdateExpression: 'set #N = :itemName, dueDate = :dueDate, done = :done',
    ExpressionAttributeValues: {
      ':itemName': updatedTodo.name,
      ':dueDate': updatedTodo.dueDate,
      ':done': updatedTodo.done
    }
  }

  logger.info(`Update todo ID: ${todoId}`)

  await docClient.update(todo).promise()
}

export async function deleteTodo(event: APIGatewayProxyEvent): Promise<string> {

  const userId = getUserId(event)
  const todoId = event.pathParameters.todoId

  const todo = {
    TableName: todoTable,
    Key: {
      todoId,
      userId
    }
  }

  logger.info(`Delete todo ID: ${todoId}`)

  await docClient.delete(todo).promise()

  return todoId
}
