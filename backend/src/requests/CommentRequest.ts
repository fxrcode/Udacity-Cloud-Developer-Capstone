/**
 * Fields in a request to create a single COMMENT item.
 */
 export interface CreateCommentRequest {
    todoOwnerId: string
    todoId: string
    comment: string
  }
