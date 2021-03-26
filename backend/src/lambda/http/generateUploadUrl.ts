import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { getUploadUrl } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const LOG = createLogger('generatedUrl')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  LOG.info(`caller event`, { event })

  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
  const userId = getUserId(event)

  try {

    const uploadUrl = await getUploadUrl(userId, todoId)

    return {
      statusCode: 201,
      body: JSON.stringify({
        uploadUrl
      })
    }
  } catch (e) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'failed to generateUrl'
      })
    }
  }
})

handler.use(
  cors({
    credentials: true
  })
)