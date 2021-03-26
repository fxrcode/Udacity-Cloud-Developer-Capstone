import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { DBAccess } from '../dataLayer/dbAccess'
import { S3Access } from '../dataLayer/s3Access'

import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

import { createLogger } from '../utils/logger'

const dbAccess = new DBAccess()
const s3Access = new S3Access()
const LOG = createLogger('todoBizLogic')

export async function createTodo(
    userId: string,
    createTodoRequest: CreateTodoRequest
): Promise<TodoItem> {
    const todoId = uuid.v4()

    const todoItem: TodoItem = {
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate,
        done: false
    }

    LOG.info(`creating new TodoItem`, {todoItem: todoItem} )

    await dbAccess.createTodo(todoItem)
    return todoItem
}

export async function deleteTodo(
    userId: string,
    todoId: string
) {
    LOG.info(`deleting TodoItem ${todoId} by user: ${userId}`)
    // validate user
    await validateUser(userId, todoId)

    await dbAccess.deleteTodo(userId, todoId)
}

export async function getUploadUrl(userId: string, todoId: string): Promise<string> {
    LOG.info(`generating URL for todo: ${todoId} by user: ${userId}`)

    // validate user
    await validateUser(userId, todoId)

    // write attachment url to DB
    const attachmentUrl = s3Access.getAttachmentUrl(todoId)
    LOG.info(`got attachmentUrl for upload : ${attachmentUrl}`)
    await dbAccess.updateAttachmentUrl(userId, todoId, attachmentUrl)

    // return SignedURL
    const uploadUrl = await s3Access.getUploadUrl(todoId)
    LOG.info(`signedURL: ${uploadUrl}`)
    return uploadUrl
}

export async function getTodos(userId: string): Promise<TodoItem[]> {
    LOG.info(`scan all todos of user ${userId}`)
    return await dbAccess.getAllTodos(userId)
}

export async function updateTodo(userId: string, todoId: string, todoUpdate: UpdateTodoRequest) {
    LOG.info('bizlogic update todo')
    // valida user
    await validateUser(userId, todoId)

    return await dbAccess.updateTodo(userId, todoId, todoUpdate as TodoUpdate)
}


// this is helper function
async function validateUser(userId: string, todoId: string) {
    const todo = await dbAccess.getTodo(userId, todoId)

    if (!todo)
        throw new Error(`${todo} not found`)

    if (todo.userId !== userId) {
        LOG.warn(`Todo ${todoId} doesn't belong to User ${userId}!`)
        throw new Error('User not authorized to write/delete others Todo')
    }

    LOG.info(`validated ok: user ${userId} 's todo: ${todoId}`)
}
