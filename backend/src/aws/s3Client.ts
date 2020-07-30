import * as AWS  from 'aws-sdk'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { createLogger } from '../utils/logger'
import { getUserId } from '../lambda/utils'

const docClient = new AWS.DynamoDB.DocumentClient()
const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

const todoTable = process.env.TODO_TABLE
const bucketName = process.env.ATTACHMENTS_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

const logger = createLogger('s3')

export async function generateUploadUrl(event: APIGatewayProxyEvent): Promise<string> {

  const todoId = event.pathParameters.todoId
  const userId = getUserId(event)

  logger.info(`Get signed URL for Todo ID: ${todoId}`)

  const signedUrl = await s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  })

  logger.info(`Set attachment URL: ${signedUrl.split('?')[0]}`)

  await docClient.update({
    TableName: todoTable,
    Key: {
      userId,
      todoId
    },
    UpdateExpression: "set attachmentUrl = :URL",
    ExpressionAttributeValues: {
      ':URL': signedUrl.split('?')[0]
    }
  }).promise()

  return signedUrl
}
