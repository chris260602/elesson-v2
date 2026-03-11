import { signOut, SignOutParams } from "next-auth/react";
import { userLogout } from "@/apiRoutes/auth";


export const customLogout = async (options?: SignOutParams | undefined) =>{
    try{
        await userLogout();
    }catch{
    }finally{
        await signOut(options);

    }
}
