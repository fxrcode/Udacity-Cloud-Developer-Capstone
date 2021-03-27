import { DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

const connectionsTable = process.env.CONNECTIONS_TABLE
const connectionIndex = process.env.CONNECTION_ID_INDEX
const stage = process.env.STAGE
const apiId = process.env.API_ID
import { createLogger } from '../../utils/logger'
const LOG = createLogger('sendNewFollowerNotification')


const connectionParams = {
  apiVersion: "2018-11-29",
  endpoint: `${apiId}.execute-api.us-east-1.amazonaws.com/${stage}`
}

const apiGateway = new AWS.ApiGatewayManagementApi(connectionParams)


export const handler: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
  LOG.info('Processing events batch from DynamoDB', event)

  await processDbEvent(event)
}

async function processDbEvent(event: DynamoDBStreamEvent) {
  for (const record of event.Records) {
    LOG.info('Processing record', record)
    if (record.eventName !== 'INSERT') {
      continue
    }

    const newItem = record.dynamodb.NewImage

    // this is follow
    const toId = newItem.toId.S

    const body = {
      fromId: newItem.fromId.S,
      toId: newItem.toId.S,
      createdAt: newItem.createdAt.S
    }

    const connections = await docClient.query({
      TableName: connectionsTable,
      IndexName: connectionIndex,
      KeyConditionExpression: 'userId = :id',
      ExpressionAttributeValues: {
        ':id': toId
      },
      ScanIndexForward: false
    }).promise()

    // const connections = await docClient.scan({
    //   TableName: connectionsTable
    // }).promise()

    LOG.info(`time to notify big-V ${toId} with his/her new followers`, body)

    for (const connection of connections.Items) {
      const connectionId = connection.connId
      if (connection.userId === toId) {
        LOG.info(`big-V userId ${connection.userId}'s connection id: ${connectionId}`, connection)
        await sendMessageToClient(connectionId, body)
      }
    }
  }
}

async function sendMessageToClient(connectionId, payload) {
  try {
    LOG.info(`Sending message to a connection: ${connectionId}`, payload)

    await apiGateway.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(payload),
    }).promise()

  } catch (e) {
    LOG.error(`Failed to send message ${e.message}`, e)
    if (e.statusCode === 410) {
      LOG.error('Stale connection')

      await docClient.delete({
        TableName: connectionsTable,
        Key: {
          connId: connectionId
        }
      }).promise()

    }
  }
}