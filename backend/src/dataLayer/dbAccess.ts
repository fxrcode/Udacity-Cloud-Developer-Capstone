import * as AWS from 'aws-sdk'
import 'source-map-support/register'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { createLogger } from '../utils/logger'
import { Follow } from '../models/Follow'
import { Comment } from '../models/Comment'

const XAWS = AWSXRay.captureAWS(AWS)
const LOG = createLogger('dbAccess')

export class DBAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosIndex = process.env.TODO_ID_INDEX,
    private readonly followTable = process.env.FOLLOWS_TABLE,
    private readonly followIndex = process.env.FOLLOW_ID_INDEX,
    private readonly commentsTable = process.env.COMMENTS_TABLE,
  ) { }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    LOG.info(`put a new TodoItem`, todoItem)
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise()

    return todoItem
  }

  async getTodo(userId: string, todoId: string): Promise<TodoItem> {
    LOG.info(`query user ${userId}'s todo: ${todoId}`)

    const result = await this.docClient.get({
      TableName: this.todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      }
    }).promise()

    LOG.info(`got result ${result.Item}`)
    const item = result.Item
    return item as TodoItem
  }

  async deleteTodo(userId: string, todoId: string) {
    LOG.info(`deleting user ${userId}'s todo ${todoId}`)

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      }
    }).promise()
  }

  async updateAttachmentUrl(userId: string, todoId: string, url: string) {
    LOG.info(`updating todo ${todoId} attachment url ${url}`)

    const result = await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      },
      ExpressionAttributeNames: {
        '#todo_attachmentUrl': 'attachmentUrl'
      },
      ExpressionAttributeValues: {
        ':attachmentUrl': url
      },
      UpdateExpression: 'SET #todo_attachmentUrl = :attachmentUrl',
      ReturnValues: 'ALL_NEW'
    }).promise()

    LOG.info(`updated todo ${todoId} attachment url ${url}, result: ${result}`)
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    LOG.info(`query all todos of user: ${userId}`)

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todosIndex,
      KeyConditionExpression: 'userId = :id',
      ExpressionAttributeValues: {
        ':id': userId
      },
      ScanIndexForward: false
    }).promise()

    LOG.info(`all todos of user ${userId}:`, result.Items as TodoItem[])

    return result.Items as TodoItem[]
  }

  async updateTodo(userId: string, todoId: string, todoUpdate: TodoUpdate) {
    LOG.info(`updating todo ${todoId} by user ${userId}`)

    const result = await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId: userId,
        todoId: todoId
      },
      UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
      ExpressionAttributeNames: {
        "#name": "name"
      },
      ExpressionAttributeValues: {
        ":name": todoUpdate.name,
        ":dueDate": todoUpdate.dueDate,
        ":done": todoUpdate.done
      }
    }).promise()

    LOG.info(`update result: ${result}`)
  }

  /************************************************
   *  Follow
   */
  async createFollow(follow: Follow) {
    LOG.info(`create follow item ${follow}`)

    // validate if follow exists
    const follows = await this.hasFollow(follow.fromId, follow.toId)
    if (follows.length > 0) {
      throw new Error(`follow from ${follow.fromId} to ${follow.toId} already exists, no need to create`)
    }

    await this.docClient.put({
      TableName: this.followTable,
      Item: follow
    }).promise()

    return follow
  }

  async hasFollow(fromId: string, toId: string): Promise<Follow[]> {
    LOG.info(`query if follow exists ${fromId} -> ${toId}`)

    const result = await this.docClient.query({
      TableName: this.followTable,
      KeyConditionExpression: 'fromId = :fromId and toId = :toId',
      ExpressionAttributeValues: {
        ":fromId": fromId,
        ":toId": toId
      },
      ScanIndexForward: false
    }).promise()

    return result.Items as Follow[]
  }

  async getFollowees(userId: string): Promise<Follow[]> {
    LOG.info(`getting user ${userId}'s followees`)

    const result = await this.docClient.query({
      TableName: this.followTable,
      IndexName: this.followIndex,
      KeyConditionExpression: 'fromId = :fromId',
      ExpressionAttributeValues: {
        ':fromId': userId
      },
      ScanIndexForward: false
    }).promise()

    return result.Items as Follow[]
  }

  async getUsersTodos(followees: string[]): Promise<TodoItem[]> {
    let userToTodos = []
    // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
    // reading in parallel
    // await Promise.all(followees.map(async (userId) => {
    //   const todos = this.getAllTodos(userId)
    //   LOG.info(`Promise.all => todos of user: ${userId}`, todos)
    //   userToTodos.set(userId, todos)
    // }));
    // reading in sequence
    for (const followee of followees) {
      const todos = await this.getAllTodos(followee)
      userToTodos.push(todos)
      LOG.info(`Promise.all => todos of user: ${followee}`, todos)
    }

    return userToTodos as TodoItem[]
  }

  /******************************************************************
   *  COMMENT
   */
  async createComment(commentItem: Comment) {
    LOG.info(`creating comment`, commentItem)

    await this.docClient.put({
      TableName: this.commentsTable,
      Item: commentItem
    }).promise()

    return commentItem
  }
}


function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    LOG.info('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}