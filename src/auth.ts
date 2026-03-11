import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { AuthorizeResult, UserType } from "../next-auth";
import { getMe } from "./apiRoutes/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      // @ts-expect-error TS2322: Return Type must be UserType.
      authorize: async (credentials): Promise<AuthorizeResult | null> => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/sanctum/csrf-cookie`,
          {
            method: "GET",
          }
        );
        // const headersList = await clientHeader();
        // const userAgent = headersList.get("user-agent") || "web";
        // const forwardedFor = headersList.get("x-forwarded-for") || "";
        // const xRealIp = headersList.get("x-real-ip") || "";

        const setCookieHeader = res.headers.get("set-cookie");
        // you'll find your_site_session key in this console log
        const cookies = setCookieHeader?.split(", ");
        let sessionKey = null;
        let xsrfToken = null;

        for (const cookie of cookies!) {
          if (cookie.startsWith("laravel_session=")) {
            sessionKey = cookie.split("=")[1];
          } else if (cookie.startsWith("XSRF-TOKEN=")) {
            xsrfToken = cookie.split("=")[1];
          }

          if (sessionKey && xsrfToken) {
            break;
          }
        }

        const data = {
          username: credentials?.email,
          password: credentials?.password,
        };
        const headers = new Headers({
          Cookie: `laravel_session=${sessionKey}`,
          "Content-Type": "application/json",
          "User-Agent": credentials?.userAgent,
          // "x-forwarded-for": forwardedFor,
          // "x-real-ip": xRealIp,
        });

        if (xsrfToken) {
          headers.append("X-XSRF-TOKEN", xsrfToken);
        }

        const options = {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        };
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`,
            options
          );

          if (response.ok) {
            const res = await response.json();
            const user = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`,
              {
                headers: {
                  Authorization: "Bearer " + res.token,
                  Accept: 'application/json',
                },
              }
            );
            if (!user.ok) {
            //   const errorText = await user.text(); // Get the HTML to see what's wrong
            //   console.error("Backend Error HTML:", errorText);
              throw new Error(`Backend returned status ${user.status}`);
            }
            const userData = (await user.json())?.data as UserType;
            // const userData={id:1};
            console.log(userData,"ini userdata")
            return {
              id: userData.id,
              access_token: res.token,
              user: userData,
            } as AuthorizeResult;
          } else {
            console.log("HTTP error! Status:", response.status);

            // Handle non-successful response here, return an appropriate JSON response.
            return null;
          }
        } catch (error) {
          console.log("Error", error);
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // When user sign in
      if (user) {
        const authUser = user as unknown as AuthorizeResult;
        token.user = authUser;
        token.accessToken = authUser.access_token;
      }
      // When Session Data is refreshed
      if (trigger === "update") {
        console.log("KENA UPDATE")
        const tta = await getMe(token.accessToken as string);
        console.log(tta,"ini tta")
        if (!tta) {
          // @ts-expect-error TS2790: The operand of a 'delete' operator must be optional.
          delete token.user;
          delete token.accessToken;
          return null;
        } else {
          token.user.user = tta?.data;
        }
      }
      return token;
    },
    // When client ask for session data
    // @ts-expect-error TS2322: Return Type Not Assignable because it expects to return session, but we want return {} if no current user.
    async session({ session, token }) {
      if (!token.user) return {};
      // @ts-expect-error TS2322: Type Not Assignable.
      session.user = token.user;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
