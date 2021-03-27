import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { getUserId } from '../utils'
import { getFolloweesTodos } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const LOG = createLogger('follow')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // TODO: Implement creating a new TODO item
  const userId = getUserId(event)
  try {
    LOG.info(`caller event`, { event })
    const userToTodos = await getFolloweesTodos(userId)
    LOG.info(`${userId}'s getFolloweesTodos list`, userToTodos)

    return {
      statusCode: 201,
      body: JSON.stringify({
        item: userToTodos
      })
    }
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `failed to getFolloweesTodos: ${e.message}`
      })
    }
  }
})

handler.use(
  cors({
    credentials: true
  })
)
