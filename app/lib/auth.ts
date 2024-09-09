
import GoogleProvider from "next-auth/providers/google";
import NextAuth, {type DefaultSession } from "next-auth"
import { prismaClient } from "@/app/lib/db";
import Github from "next-auth/providers/github";


declare module "next-auth" {
    interface Session {
        user: {
            id: string
        } & DefaultSession["user"]
    }
}
export const authOption = {
    providers: [

        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
        }),

        Github({
            clientId : process.env.GITHUB_CLIENT_ID ?? " ",
            clientSecret : process.env.GITHUB_CLIENT_SECRET ?? ""
        })
    ],
    secret: process.env.NEXTAUTH_SECRET ?? "secret",

    callbacks: {
        async signIn(params : any) {
            console.log(params);
            
            if (!params.user.email) {
                return false;
            }
            try {
                const existingUser = await prismaClient.user.findUnique({
                    where: {
                        email: params.user.email
                    }
                })
                if (existingUser) {
                    return true
                }
                await prismaClient.user.create({
                    data: {
                        email: params.user.email,
                        provider: params.account?.provider || " "
                    } 
                })
                return true;
             } catch(e) {
                console.log(e);
                return false;
             } 
        },
        
        async session({session, token, user} : any) {
            const dbUser = await prismaClient.user.findUnique({
                where: {
                    email: session.user.email as string
                }
            })
            if (!dbUser) {
                return session;
            }
            return {
                ...session, 
                user: {
                    id: dbUser.id
                }
            }
        }
    }
}