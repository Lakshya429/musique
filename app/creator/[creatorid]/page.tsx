'use client'
import StreamView from "@/app/components/StreamView";
import { usePathname } from 'next/navigation'
export default function Creator() {
  
    const path = usePathname();
    const arr = path.split("/");
    const createrid = arr[arr.length-1];
    
    return <div>
        <StreamView creatorId={createrid} playVideo={false} />
    </div>
    
}