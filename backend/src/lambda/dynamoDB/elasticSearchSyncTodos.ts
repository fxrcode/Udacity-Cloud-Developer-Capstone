import { DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda'
import 'source-map-support/register'
// import * as elasticsearch from 'elasticsearch'
// import * as httpAwsEs from 'http-aws-es'

import { createLogger } from '../../utils/logger'
const LOG = createLogger('dbAccess')

// const esHost = process.env.ES_ENDPOINT

// const es = new elasticsearch.Client({
//   hosts: [ esHost ],
//   connectionClass: httpAwsEs
// })

export const handler: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
  LOG.info('Processing events batch from DynamoDB', JSON.stringify(event))

  for (const record of event.Records) {
    LOG.info('Processing record', JSON.stringify(record))
    if (record.eventName !== 'INSERT') {
      continue
    }

    const newItem = record.dynamodb.NewImage

    const userId = newItem.userId.S
    LOG.info(`this is new todo stream of user ${userId}`)

    const body = {
      userId: newItem.userId.S,
      todoId: newItem.todoId.S,
      createdAt: newItem.createdAt.S,
      done: newItem.done.BOOL,
      dueDate: newItem.dueDate.S,
      name: newItem.name.S,
    }

    LOG.info(`processing: `, body)

    // await es.index({
    //   index: 'images-index',
    //   type: 'images',
    //   id: imageId,
    //   body
    // })

  }
}