import { getMe } from "@/apiRoutes/auth";
import axios, { AxiosError } from "axios";
import { getSession, signOut } from "next-auth/react";

// Axios Interceptor Instance
const AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
});

AxiosInstance.interceptors.request.use(
    async (request) =>{
        const session = await getSession();
        const token = session?.user.access_token
        if(token) request.headers['Authorization'] = `Bearer ${token}`;
        request.headers['Content-Type'] = request.headers['Content-Type'] ? request.headers['Content-Type'] : 'application/json'
        request.headers['Accept'] = 'application/json';
        return request;
    }
)

AxiosInstance.interceptors.response.use(
    response => response, // Directly return successful responses.
    async error => {
      const originalRequest = error.config;
      if (error.response.status === 401 && !originalRequest._retry) {
        
        originalRequest._retry = true; // Mark the request as retried to avoid infinite loops.
        const session = await getSession();
        const token = session?.user.access_token
        await getMe(token as string);
        // window.location.reload();
        return;
        // signOut();
        // return;
        if(session) {
          signOut();}
        // signOut();
        // try {
        //   const refreshToken = localStorage.getItem('refreshToken'); // Retrieve the stored refresh token.
        //   // Make a request to your auth server to refresh the token.
        //   const response = await axios.post('https://your.auth.server/refresh', {
        //     refreshToken,
        //   });
        //   const { accessToken, refreshToken: newRefreshToken } = response.data;
        //   // Store the new access and refresh tokens.
        //   localStorage.setItem('accessToken', accessToken);
        //   localStorage.setItem('refreshToken', newRefreshToken);
        //   // Update the authorization header with the new access token.
        //   axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        //   return axiosInstance(originalRequest); // Retry the original request with the new access token.
        // } catch (refreshError) {
        //   // Handle refresh token errors by clearing stored tokens and redirecting to the login page.
        //   console.error('Token refresh failed:', refreshError);
        //   localStorage.removeItem('accessToken');
        //   localStorage.removeItem('refreshToken');
        //   window.location.href = '/login';
        //   return Promise.reject(refreshError);
        // }
      }
      return Promise.reject<AxiosError>(error); // For all other errors, return the error as is.
    }
  );

  export default AxiosInstance;