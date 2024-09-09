import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
//@ts-ignore
import youtubesearchapi from "youtube-search-api";
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
        console.log("kklk " + isYt) ;
        

        const extractedId = data.url.split("?v=")[1];


        const res = await youtubesearchapi.GetVideoDetails(extractedId);

        const thumbnails = res.thumbnail.thumbnails || "https://www.google.com/imgres?q=thumbnail&imgurl=https%3A%2F%2Ft3.ftcdn.net%2Fjpg%2F04%2F70%2F37%2F00%2F360_F_470370030_TxVCOsONUxh659YzwP2wCkX0ijAetDh9.jpg&imgrefurl=https%3A%2F%2Fstock.adobe.com%2Fsearch%2Fimages%3Fk%3Dthumbnail%2Bbackground&docid=hfqaQB7r41bjBM&tbnid=MHAWoNFP1kwg0M&vet=12ahUKEwj3tLGgtrOIAxWC4jgGHeCdHG0QM3oFCIIBEAA..i&w=640&h=360&hcb=2&ved=2ahUKEwj3tLGgtrOIAxWC4jgGHeCdHG0QM3oFCIIBEAA";
        thumbnails.sort((a: {width: number}, b: {width: number}) => a.width < b.width ? -1 : 1);

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
                title: res.title ?? "Cant find video",
                smallImg: (thumbnails.length > 1 ? thumbnails[thumbnails.length - 2].url : thumbnails[thumbnails.length - 1].url) ?? "https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg",
                bigImg: thumbnails[thumbnails.length - 1].url ?? "https://cdn.pixabay.com/photo/2024/02/28/07/42/european-shorthair-8601492_640.jpg"
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
            e 
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
 
