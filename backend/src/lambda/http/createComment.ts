import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { CreateCommentRequest } from '../../requests/CommentRequest'

import { getUserId } from '../utils'
import { comment } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const LOG = createLogger('createComment')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newComment: CreateCommentRequest = JSON.parse(event.body)
  // TODO: Implement creating a new TODO item
  const userId = getUserId(event)
  try {
    LOG.info(`caller event`, { event })
    const newCommentItem = await comment(userId, newComment)

    return {
      statusCode: 201,
      body: JSON.stringify({
        item: newCommentItem
      })
    }
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `failed to create comment: ${e.message}`
      })
    }
  }
})

handler.use(
  cors({
    credentials: true
  })
)
