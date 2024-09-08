"use client";
import { SessionProvider } from "next-auth/react";
import { rule } from "postcss";


export function Providers({children} : {children :React.ReactNode}){
      return <SessionProvider>
        {children}
      </SessionProvider>
}