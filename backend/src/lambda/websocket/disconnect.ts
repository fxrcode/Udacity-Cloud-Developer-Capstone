import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'

const LOG = createLogger('connect')

const XAWS = AWSXRay.captureAWS(AWS)

const docClient = new XAWS.DynamoDB.DocumentClient()

const connectionsTable = process.env.CONNECTIONS_TABLE

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  LOG.info('Websocket connect', event)

  const connectionId = event.requestContext.connectionId
  const key = {
    connId: connectionId
  }

  console.log('Removing item with key: ', key)

  await docClient.delete({
    TableName: connectionsTable,
    Key: key
  }).promise()

  return {
    statusCode: 200,
    body: ''
  }
})