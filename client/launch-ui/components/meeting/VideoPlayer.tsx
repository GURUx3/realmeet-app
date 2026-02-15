
"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface VideoPlayerProps {
    stream?: MediaStream | null;
    muted?: boolean;
    mirror?: boolean;
    className?: string;
    videoRef?: React.RefObject<HTMLVideoElement | null>;
    onLoadedMetadata?: () => void;
}

export function VideoPlayer({
    stream,
    muted = false,
    mirror = false,
    className,
    videoRef,
    onLoadedMetadata
}: VideoPlayerProps) {
    const internalRef = useRef<HTMLVideoElement>(null);
    // Use the passed ref or the internal one
    // Note: We need to set internalRef if videoRef is not provided, 
    // or manually merge them if we needed both (but usually one is enough).
    // Here we just use the one provided or fallback.
    const refToUse = videoRef || internalRef;

    useEffect(() => {
        const videoElement = refToUse.current;
        if (videoElement && stream) {
            videoElement.srcObject = stream;
            // Attempt to play immediately
            videoElement.play().catch(e => {
                console.error("Auto-play failed:", e);
                // Sometimes interaction is needed, but for WebRTC usually fine if muted
            });
        } else if (videoElement) {
            videoElement.srcObject = null;
        }
    }, [stream, refToUse]);

    // If no stream is provided, show a loading placeholder
    if (!stream) {
        return (
            <div className={cn("flex h-full w-full items-center justify-center bg-zinc-900 border border-white/5 rounded-lg", className)}>
                <Loader2 className="h-8 w-8 text-white/20 animate-spin" />
            </div>
        );
    }

    return (
        <video
            ref={refToUse}
            autoPlay
            playsInline
            muted={muted}
            onLoadedMetadata={onLoadedMetadata}
            className={cn(
                "h-full w-full object-cover animate-in fade-in duration-700",
                mirror && "transform scale-x-[-1]",
                className
            )}
        />
    );
}
