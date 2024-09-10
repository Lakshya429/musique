import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { YT_REGEX } from "@/app/lib/utils";
import { authOption } from "@/app/lib/auth";
import { getServerSession } from "next-auth/next"

const CreateStreamSchema = z.object({
    creatorId: z.string(),
    url: z.string()
});

const MAX_QUEUE_LEN = 20;

export async function POST(req: NextRequest) {
   
    try {
        const dat = await req.json();
        console.log(dat);
        
        const data = CreateStreamSchema.parse(dat);
        console.log(data + "kklmdm");
        
        const isYt = data.url.match(YT_REGEX)
       
        console.log(isYt);
        
        if (!isYt) {
            return NextResponse.json({
                message: "Wrong URL format"
            }, {
                status: 411
            })    
        }
    
        

        const extractedId = data.url.split("?v=")[1];



        const existingActiveStream = await prismaClient.stream.count({
            where: {
                userId: data.creatorId
            }
        })

        if (existingActiveStream > MAX_QUEUE_LEN) {
            return NextResponse.json({
                message: "Already at limit"
            }, {
                status: 411
            })
        }

        const stream = await prismaClient.stream.create({
            data: {
                userId: data.creatorId,
                url: data.url,
                extractedId,
                type: "Youtube",
                title:  "Cant find video",
                smallImg:  "https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg",
                bigImg:  "https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg"
            }
        });
        console.log(stream);
        
        return NextResponse.json({
            ...stream,
            hasUpvoted: false,
            upvotes: 0
        })

    } catch(e) {
        return NextResponse.json({
            message: "Error while adding a stream",
            e : e
        }, {
            status: 411
        })
    }

}

export async function GET(req: NextRequest , res : NextResponse) {

    const creatorId = req.nextUrl.searchParams.get("creatorId");

    
    const session = await getServerSession(authOption);

  
    
     const user = await prismaClient.user.findFirst({
        where: {
            id: session.user.id
        }
    });

    
    if (!user) {
        return NextResponse.json({
            message: "Unauthenticated"
        }, {
            status: 403
        })
    }

    if (!creatorId) {
        return NextResponse.json({
            message: "Error"
        }, {
            status: 411
        })
    }

    const [streams, activeStream] = await Promise.all([await prismaClient.stream.findMany({
        where: {
            userId: creatorId,
            played: false
        },
        include: {
            _count: {
                select: {
                    upvotes: true
                }
            },
            upvotes: {
                where: {
                    userId: user.id
                }
            }
        }
    }), prismaClient.currentStream.findFirst({
        where: {
            userId: creatorId
        },
        include: {
            stream: true
        }
    })])

    return NextResponse.json({
        streams: streams.map(({_count, ...rest}) => ({
            ...rest,
            upvotes: _count.upvotes,
            haveUpvoted: rest.upvotes.length ? true : false
        })),
        activeStream
    })
}
 
