export type ApiErrorType = {
  error:string;
  message:string;
}

export type PostResponseType<T> = {
    message: string;
    data:T;
  }

  export type PatchResponseType<T> = {
    message: string;
    data:T;
  }
  
  export type DeleteResponseType = {
    message:string;
  }