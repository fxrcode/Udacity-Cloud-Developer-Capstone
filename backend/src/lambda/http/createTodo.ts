import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

import { getUserId } from '../utils'
import { createTodo } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

const LOG = createLogger('createTodo')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  // TODO: Implement creating a new TODO item
  const userId = getUserId(event)
  try {
    const newTodoItem = await createTodo(userId, newTodo)

    LOG.info(`caller event`, { event })
    return {
      statusCode: 201,
      body: JSON.stringify({
        item: newTodoItem
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
