import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export  const getPublicDOUrl = (
    worksheetId: number,
    type: string,
    fileName: string
  ) => {
    const bucket = process.env.NEXT_PUBLIC_SPACE_BUCKET || "math-mavens";
    const region = process.env.NEXT_PUBLIC_SPACE_REGION || "sgp1";
    const envFolder = process.env.NEXT_PUBLIC_AWS_ENV || "Development";

    return `https://${bucket}.${region}.digitaloceanspaces.com/${envFolder}/worksheets/${worksheetId}/${type}/${fileName}`;
  };