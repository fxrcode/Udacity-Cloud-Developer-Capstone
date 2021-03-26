import * as AWS  from 'aws-sdk'
import 'source-map-support/register'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

export class S3Access {
    constructor(
        private readonly s3 =  new XAWS.S3({ signatureVersion: 'v4'}),
        private readonly bucketName = process.env.IMAGES_S3_BUCKET,
        private readonly urlExpiration = +process.env.SIGNED_URL_EXPIRATION
    ) {}

    getAttachmentUrl(todoId: string): string {
        return `https://${this.bucketName}.s3.amazonaws.com/${todoId}`
    }

    async getUploadUrl(todoId: string): Promise<string> {
        return this.s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: todoId,
            Expires: this.urlExpiration
        })
    }
}