import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly S3: AWS.S3;
  private readonly bucketName: string;
  private readonly bucketRegion: string;

  constructor(private configService: ConfigService) {
    this.S3 = new AWS.S3({
      // Your config options
      accessKeyId: this.configService.get<string>('AWS_SECRET_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');
    this.bucketRegion = this.configService.get<string>('AWS_BUCKET_REGION');
  }

  getDefaultParams() {
    return {
      Bucket: this.bucketName,
      ACL: 'public-read',
      ContentDisposition: 'inline',
    };
  }

  getFileUrl(key: string): { url: string } {
    return {
      url: `https://${this.bucketName}.s3.${this.bucketRegion}.amazonaws.com/${key}`,
    };
  }

  async putBlob(
    blobName: string,
    blob: Buffer,
  ): Promise<PromiseResult<AWS.S3.PutObjectOutput, AWS.AWSError>> {
    const params = {
      ...this.getDefaultParams(),
      Bucket: this.bucketName,
      Key: blobName,
      Body: blob,
    };
    return this.S3.putObject(params).promise();
  }

  // to get stream you can use file.createReadStream()
  async putStream(key: string, buffer: Buffer): Promise<{ url: string }> {
    return new Promise<{ url: string }>(async (resolve, reject) => {
      const handleError = (error) => {
        reject(error);
      };

      try {
        await this.putBlob(key, buffer);
        resolve(this.getFileUrl(key));
      } catch (error) {
        handleError(new InternalServerErrorException(error));
      }
    });
  }
}
