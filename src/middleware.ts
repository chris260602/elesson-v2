import { auth } from "@/auth"
 
export default auth((req) => {

  if (!req.auth && req.nextUrl.pathname !== "/login") {
    const newUrl = new URL("/login", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }
  if(req.auth && req.nextUrl.pathname === "/login"){
    const newUrl = new URL("/", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }
  
})
 
// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|icons|.*\\.png$|.*\\.svg$|favicon.ico|sw.js|manifest.json).*)"],

}