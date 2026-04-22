"use server";

import { s3Client } from "@/lib/s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // 👈 You need this package
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

// 1. UPLOAD: Generate a temporary secure URL for the client
export async function getPresignedUploadUrl(fileName: string, fileType: string) {
    console.log("--- DEBUG S3 ---");
  console.log("Bucket:", process.env.NEXT_PUBLIC_SPACE_BUCKET);
  console.log("Region:", process.env.NEXT_PUBLIC_SPACE_REGION);
  console.log("Key:", fileName);
  console.log("----------------");

  if (!process.env.NEXT_PUBLIC_SPACE_BUCKET) {
    throw new Error("Bucket is undefined! Check .env");
  }
  const command = new PutObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_SPACE_BUCKET,
    Key: fileName,
    ContentType: fileType,
    ACL: "public-read", // Important: Allows the file to be viewable immediately
  });

  try {
    // Generate a URL valid for 24 hour. 
    // The client must start the upload within this time.
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 60 * 24 });
    
    return { success: true, url: signedUrl };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return { success: false, error: "Failed to generate upload URL" };
  }
}


export async function doesFileExist(fileName: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_SPACE_BUCKET,
      Key: fileName,
    });

    await s3Client.send(command);
    return true; // File exists
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false; // File does not exist
    }
    throw error; // Some other error (e.g., permission, network)
  }
}

// 3. DELETE: This still happens securely on the server
export async function deleteFile(fileName: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.NEXT_PUBLIC_SPACE_BUCKET,
    Key: fileName,
  });

  try {
    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error deleting file:", error);
    return { success: false };
  }
}