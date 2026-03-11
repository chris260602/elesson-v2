import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
    region:"sgp1",
  endpoint:"https://sgp1.digitaloceanspaces.com",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_KEY!,
    secretAccessKey: process.env.AWS_SECRET!,
  },
});

