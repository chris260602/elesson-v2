// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";
import { type DefaultJWT } from '@auth/core/jwt'; // Or from '@auth/core/jwt' for v5 core

type UserType = {
  activated: number; // 0 | 1
  active: number; // 0 | 1
  active_label: string;
  active_role: number;
  active_role_label: string | null;
  app_bg_img: string;
  banned: number; // 0 | 1
  created_by: string;
  created_on: string; // ISO datetime
  email: string;
  have_access: string; // comma-separated values
  id: number;
  last_ip: string;
  last_login: string; // datetime string
  last_login_time: string | null;
  modified_by: string;
  modified_on: string; // ISO datetime
  name: string;
  new_password_key: string | null;
  new_password_requested: string | null;
  password_reset: number; // 0 | 1
  permissions: any[]; // unknown structure
  profile_img: string;
  role_id: string;
  role_label: string | null;
  roles: string[];
  token_expire_on: string; // timestamp string
  username: string;
  child_id:string;
}

export interface AuthorizeResult {
  id: string;                 // User ID, already processed as string for NextAuth
  access_token: string;       // Laravel bearer token
  user: UserType; // The nested user profile
}


declare module "next-auth" {
    interface Session {
        user:{
          user:UserType;
          access_token:string;
        }
      }

    interface JWT extends DefaultJWT{
      abc:string;
    }
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      interface User extends UserType{
        access_token:string;
      }

      
}

declare module '@auth/core/jwt' { // Or '@auth/core/jwt'
  interface JWT extends DefaultJWT {
    user:{
      user:UserType;
      access_token:string;
    }
    access_token:string;
  }
}