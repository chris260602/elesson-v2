import axios from "axios";
import AxiosInstance from "@/utils/axiosInstance";
import { signOut } from "next-auth/react";
import { MEUserType, UserType } from "../../next-auth";
import { PatchResponseType } from "@/const/generalApis";


export type UserSessionType ={
  id:number;
  ip_address:string;
  is_current_device:boolean;
  last_used_at:string;
  name:string;
  user_agent:string;
}

export type UserSingleLogoutRequestType ={
  tokenId:number;
}

export type GetUserSessionsResponseType = UserSessionType[];


export type ValidateUserPinRequestType = {
  pin:string;
}

export type ChangeUserPasswordRequestType = {
  current_password:string;
  new_password:string;
}

export type ChangeUserPinRequestType = {
  current_pin:string;
  new_pin:string;
}
export type GetUserPermissionsResponseType = string[];

export const getMe = async (token:string) => {
  try {
    const data = await axios.get<MEUserType>(
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
export const userAllLogout = async () => {
  const res = await AxiosInstance.post(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout-all`
  );
  return res.data;
};
export const userSingleLogout = async (data : UserSingleLogoutRequestType) => {
  const res = await AxiosInstance.post(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout-single`,data
  );
  return res.data;
};

export const getUserSessions = async () => {
  const res = await AxiosInstance.get<GetUserSessionsResponseType>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/sessions`
  );
  return res;
};

export const getUserPermissions = async () => {
  const res = await AxiosInstance.get<GetUserPermissionsResponseType>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/permissions`
  );
  return res;
};

export const validateUserPIN = async (data :ValidateUserPinRequestType) => {
  const res = await AxiosInstance.post(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/validate-pin`,data
  );
  return res;
};

export const changeUserPassword = async (data :ChangeUserPasswordRequestType) => {
  const res = await AxiosInstance.patch<PatchResponseType<UserType>>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/change-password`,data
  );
  return res.data;
};

export const changeUserPin = async (data :ChangeUserPinRequestType) => {
  const res = await AxiosInstance.patch<PatchResponseType<UserType>>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/change-pin`,data
  );
  return res.data;
};