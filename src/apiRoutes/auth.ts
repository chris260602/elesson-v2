import axios from "axios";
import AxiosInstance from "@/utils/axiosInstance";
import { signOut } from "next-auth/react";
import { PatchResponseType } from "@/app/const/generalApis";
import { UserType } from "../../next-auth";


export type ChangeUserPasswordRequestType = {
  current_password:string;
  new_password:string;
}


export type GetUserPermissionsResponseType = string[];

export const getMe = async (token:string) => {
  try {
    const data = await axios.get<{data:UserType}>(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`,{headers:{Authorization:`Bearer ${token}`}}
    );
    return data.data;
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      if (e.response?.status === 401) {
        if(typeof window !== "undefined") signOut();
        else return null;
        return;
      }
    }
  }
};

export const userLogout = async () => {
  const res = await AxiosInstance.post(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout`
  );
  return res.data;
};


export const getUserPermissions = async () => {
  const res = await AxiosInstance.get<GetUserPermissionsResponseType>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/permissions`
  );
  return res;
};


export const changeUserPassword = async (data :ChangeUserPasswordRequestType) => {
  const res = await AxiosInstance.patch<PatchResponseType<UserType>>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/change-password`,data
  );
  return res.data;
};