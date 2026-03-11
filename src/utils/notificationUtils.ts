import { toast } from "sonner"

export const showErrorMessage = (msg:string,description?:string) =>{
    toast.error(msg,{
        description,
        classNames:{
            error:"!bg-red-400 !text-white !font-bold",
            description:"!text-white"
        }
    })
}

export const showSuccessMessage = (msg:string) =>{
    toast.success(msg)
}