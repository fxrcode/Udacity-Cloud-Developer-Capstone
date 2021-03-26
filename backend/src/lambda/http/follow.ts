import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { CreateFollowRequest } from '../../requests/CreateFollowRequest'

import { getUserId } from '../utils'
import { follow } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const LOG = createLogger('follow')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newFollow: CreateFollowRequest = JSON.parse(event.body)
  // TODO: Implement creating a new TODO item
  const userId = getUserId(event)
  try {
    const newFollowItem = await follow(userId, newFollow.followee)

    LOG.info(`caller event`, { event })
    return {
      statusCode: 201,
      body: JSON.stringify({
        item: newFollowItem
      })
    }
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `failed to create todo: ${e.message}`
      })
    }
  }
})

handler.use(
  cors({
    credentials: true
  })
)
