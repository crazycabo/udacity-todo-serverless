import * as AWS  from 'aws-sdk'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'

const logger = createLogger('aws')

const docClient = new AWS.DynamoDB.DocumentClient()
const todoTable = process.env.TODO_TABLE

export async function getTodos() {

}

export async function createTodo(userId: string, parsedEventBody: CreateTodoRequest): Promise<object> {

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

export async function updateTodo() {

}

export async function deleteTodo(todoId: string, userId: string) {

  const todo = {
    TableName: todoTable,
    Key: {
      todoId,
      userId
    }
  }

  logger.info(`Delete todo ID: ${todoId}`)

  await docClient.delete(todo).promise()
}
