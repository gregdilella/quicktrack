import { env as privateEnv } from '$env/dynamic/private';
import {
    S3Client,
    PutObjectCommand,
    ListObjectsV2Command,
    DeleteObjectCommand,
    GetObjectCommand,
    type _Object
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface JobFileItem {
    key: string;
    name: string;
    size: number;
    lastModified?: string;
    url?: string;
}

function createR2Client(): S3Client {
    const accountId = privateEnv.R2_ACCOUNT_ID as string;
    const accessKeyId = privateEnv.R2_ACCESS_KEY_ID as string;
    const secretAccessKey = privateEnv.R2_SECRET_ACCESS_KEY as string;

    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error('Missing R2 credentials. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY');
    }

    return new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey
        },
        forcePathStyle: true
    });
}

export class FileUploadService {
    private client: S3Client;
    private bucket: string;

    constructor() {
        this.client = createR2Client();
        this.bucket = (privateEnv.R2_BUCKET_NAME as string) || 'certus';
    }

    private buildObjectKey(jobno: string, filename: string): string {
        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        return `jobs/${jobno}/${ts}-${safeName}`;
    }

    async uploadFile(params: { jobno: string; file: File }): Promise<JobFileItem> {
        const { jobno, file } = params;
        const body = await file.arrayBuffer();
        const key = this.buildObjectKey(jobno, file.name);

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body as any,
                ContentType: file.type || 'application/octet-stream'
            })
        );

        return {
            key,
            name: file.name,
            size: file.size
        };
    }

    async listFiles(jobno: string, withSignedUrls = true): Promise<JobFileItem[]> {
        const prefix = `jobs/${jobno}/`;
        const result = await this.client.send(
            new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix })
        );

        const items: JobFileItem[] = (result.Contents || []).map((obj: _Object) => {
            const key = obj.Key as string;
            return {
                key,
                name: key.substring(prefix.length),
                size: Number(obj.Size || 0),
                lastModified: obj.LastModified?.toISOString()
            };
        });

        if (!withSignedUrls) return items;

        const signed = await Promise.all(
            items.map(async (item) => ({
                ...item,
                url: await this.getDownloadUrl(item.key)
            }))
        );

        return signed;
    }

    async deleteFile(key: string): Promise<void> {
        await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    }

    async getDownloadUrl(key: string, expiresInSeconds = 900): Promise<string> {
        const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
        return getSignedUrl(this.client, cmd, { expiresIn: expiresInSeconds });
    }
}


