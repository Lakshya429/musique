import { prismaClient } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOption } from "@/app/lib/auth";
export const GET = async (req: NextRequest) => {
    const session = await getServerSession(authOption);
    
    const user = await prismaClient.user.findFirst({
        where: {
             id: session?.user?.id ?? ""
        }
    });

    if (!user) {
        return NextResponse.json({
            message: "Unauthenticated"
        }, {
            status: 403
        })
    }
    return NextResponse.json({
        user
    });
}


export const dynamic = 'force-dynamic'
