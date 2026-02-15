
"use client";

import { useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoPlayer } from "./VideoPlayer";
import { ARNameTag } from "./ARNameTag";

interface PeerData {
    socketId: string;
    userId: string;
    stream?: MediaStream;
}

interface RemotePeerProps {
    peer: PeerData;
    mediaState: {
        isVideoOff: boolean;
        isAudioOff: boolean;
        userImage?: string;
        name?: string;
        role?: string;
        activity?: string;
    } | undefined;
    peerCount: number;
}

export function RemotePeer({ peer, mediaState, peerCount }: RemotePeerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const isVideoOff = mediaState?.isVideoOff;

    // Debugging: Log if stream is missing or tracks are missing
    useEffect(() => {
        if (!peer.stream) {
            console.warn(`[RemotePeer] No stream for ${peer.socketId}`);
        } else {
            const tracks = peer.stream.getTracks();
            if (tracks.length === 0) {
                console.warn(`[RemotePeer] Stream has 0 tracks for ${peer.socketId}`);
            } else {
                // Ensure tracks are enabled
                tracks.forEach(t => {
                    if (!t.enabled) console.log(`[RemotePeer] Track ${t.kind} is disabled initially for ${peer.socketId}`);
                    else t.enabled = true; // Force enable just in case
                });
            }
        }
    }, [peer.stream, peer.socketId]);

    return (
        <div className={cn(
            "relative bg-zinc-900 overflow-hidden shadow-2xl transition-all",
            "w-full h-full", // Grid handles sizing
            "rounded-lg border border-white/5"
        )}>
            {/* 1. Camera Off State */}
            {isVideoOff ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800">
                    <Avatar className="h-24 w-24 border-4 border-zinc-900 mb-4">
                        <AvatarImage src={mediaState?.userImage || ""} className="object-cover" />
                        <AvatarFallback className="bg-zinc-700 text-zinc-400">
                            <User className="h-10 w-10" />
                        </AvatarFallback>
                    </Avatar>
                    <p className="text-zinc-400 font-medium">Camera Off</p>
                </div>
            ) : (
                /* 2. Video Player */
                <VideoPlayer
                    stream={peer.stream}
                    videoRef={videoRef}
                    // Important: Reset muted to false for remote peers!
                    muted={false}
                />
            )}

            {/* 3. AR Name Tag (Overlay) */}
            {/* Only show if video is visible AND we have a name to show */}
            {!isVideoOff && mediaState?.name && (
                <ARNameTag
                    name={mediaState.name}
                    role={mediaState.role || "Developer"}
                    activity={mediaState.activity || "Working"}
                    videoRef={videoRef}
                    className="pointer-events-none"
                />
            )}

            {/* 4. Bottom Info Bar */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-md text-xs font-medium text-white shadow-sm border border-white/5">
                    {mediaState?.name || "Guest"}
                </span>
                {mediaState?.isAudioOff && (
                    <div className="p-1 rounded-full bg-red-500/80 backdrop-blur-sm text-white">
                        <MicOff className="h-3 w-3" />
                    </div>
                )}
            </div>
        </div>
    );
}
