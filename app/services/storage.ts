import { S3Client } from '@aws-sdk/client-s3'

export const uploadToS3 = async (file: File, bucket: string) => {
  const s3 = new S3Client({})
}
