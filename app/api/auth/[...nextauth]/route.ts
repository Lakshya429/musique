import GoogleProvider from "next-auth/providers/google";
import NextAuth, {type DefaultSession } from "next-auth"
import { prismaClient } from "@/app/lib/db";
import Github from "next-auth/providers/github";

import { authOption} from "@/app/lib/auth";
declare module "next-auth" {
    interface Session {
        user: {
            id: string
        } & DefaultSession["user"]
    }
}
const handler  = NextAuth(authOption)

export  { handler as GET, handler as POST }