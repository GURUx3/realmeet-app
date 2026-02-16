import { useEffect, useRef, memo } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
    stream?: MediaStream | null;
    muted?: boolean;
    mirror?: boolean;
    className?: string;
}

function VideoPlayerComponent({
    stream,
    muted = false,
    mirror = false,
    className
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Auto-play failed:", e));
        } else if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, [stream]);

    if (!stream) return (
        <div className="flex h-full w-full items-center justify-center bg-zinc-900 border border-white/5 rounded-lg">
            <Loader2 className="h-8 w-8 text-white/20 animate-spin" />
        </div>
    );

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className={cn(
                "h-full w-full object-cover animate-in fade-in",
                mirror && "transform scale-x-[-1]",
                className
            )}
        />
    );
}

export const VideoPlayer = memo(VideoPlayerComponent);
