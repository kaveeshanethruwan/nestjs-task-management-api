import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import s3Config from 'src/config/s3.config';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor(
    @Inject(s3Config.KEY)
    private s3Configuration: ConfigType<typeof s3Config>,
  ) {
    this.s3Client = new S3Client({
      endpoint: this.s3Configuration.endpoint,
      region: this.s3Configuration.region,
      forcePathStyle: this.s3Configuration.forcePathStyle,
      credentials: {
        accessKeyId: this.s3Configuration.accessKeyId,
        secretAccessKey: this.s3Configuration.secretAccessKey,
      },
    });
    this.bucket = this.s3Configuration.bucket;
  }

  async uploadFile(
    key: string,
    file: Buffer,
    contentType: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return `${this.s3Configuration.endpoint}/${this.bucket}/${key}`;
  }

  async getFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const stream = response.Body as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk as Uint8Array));
    }

    return Buffer.concat(chunks);
  }
}
