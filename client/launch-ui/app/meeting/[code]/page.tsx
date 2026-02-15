"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { io, Socket } from "socket.io-client";
import { useParams, useRouter } from "next/navigation";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Wifi, MoreHorizontal, Check, Copy, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import MeetingSidebar from "./MeetingSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { ARNameTag } from "@/components/meeting/ARNameTag";

// WebRTC Configuration
const RTC_CONFIG = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
    ],
};

interface PeerData {
    socketId: string;
    userId: string;
    stream?: MediaStream;
    name?: string;
    role?: string;
    activity?: string;
    imageUrl?: string;
}

interface ChatMessage {
    sender: string;
    senderId: string;
    message: string;
    timestamp: Date;
    id: string;
}

export default function MeetingPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const params = useParams();
    const meetingCode = params.code as string;

    // State
    const [isConnected, setIsConnected] = useState(false);

    // Multi-user State
    const [peers, setPeers] = useState<Map<string, PeerData>>(new Map());
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [error, setError] = useState<string | null>(null); // Critical errors

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'chat' | 'files'>('chat');
    const [unreadCount, setUnreadCount] = useState(0);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [hasCopied, setHasCopied] = useState(false);

    // Track remote media states (muted/video off) per socketId
    const [remoteMediaStates, setRemoteMediaStates] = useState<Record<string, { isVideoOff: boolean, isAudioOff: boolean, userImage?: string, name?: string, role?: string, activity?: string }>>({});

    // Refs
    // socketId -> RTCPeerConnection
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const initialized = useRef(false);
    // socketId -> Array of candidates
    const iceCandidatesQueues = useRef<Map<string, RTCIceCandidate[]>>(new Map());

    const isMutedRef = useRef(false);
    const isVideoOffRef = useRef(false);

    // --- [LOGIC SECTION] ---
    useEffect(() => {
        if (!isLoaded || !user || !meetingCode || initialized.current) return;
        initialized.current = true;

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                connectSocket(stream);
            })
            .catch((err) => {
                console.error("Failed to get media:", err);
                setError("Camera/Microphone access denied");
            });

        return () => cleanup();
    }, [isLoaded, user, meetingCode]);

    // Force re-render when peers map changes (React doesn't detect Map mutations)
    const [_, setTick] = useState(0);
    const updatePeers = () => setTick(t => t + 1);

    const connectSocket = (currentStream: MediaStream) => {
        if (socketRef.current?.connected) return;
        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
        }

        const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
            path: "/socket.io/",
            transports: ["websocket"],
            reconnection: false,
            timeout: 10000,
        });

        socketRef.current = socketInstance;

        socketInstance.on("connect", () => {
            setIsConnected(true);
            setError(null);
            socketInstance.emit("join-room", { roomId: meetingCode, userId: user!.id });
        });

        socketInstance.on("connect_error", () => setIsConnected(false));
        socketInstance.on("disconnect", (reason) => {
            setIsConnected(false);
            if (reason === "io server disconnect") socketInstance.connect();
        });

        socketInstance.on("room-full", () => {
            setError("Room is full (Max 4 participants). Redirecting...");
            setTimeout(() => router.push("/dashboard"), 3000);
        });

        // Chat History
        socketInstance.on("chat-history", (history: any[]) => {
            setChatMessages(history.map(msg => ({
                id: msg.id,
                sender: msg.senderName,
                senderId: msg.senderId,
                message: msg.message,
                timestamp: new Date(msg.timestamp)
            })));
        });

        // 1. Existing participants (Mesh initialization)
        socketInstance.on("existing-users", (existingUsers: Array<PeerData>) => {
            existingUsers.forEach(async (peer) => {
                if (!peerConnections.current.has(peer.socketId)) {
                    // Update peers map initially with info (no stream yet)
                    setPeers(prev => {
                        const newMap = new Map(prev);
                        newMap.set(peer.socketId, peer);
                        return newMap;
                    });
                    // Pre-populate media state with static info
                    setRemoteMediaStates(prev => ({
                        ...prev,
                        [peer.socketId]: {
                            isVideoOff: false, // Default, will update
                            isAudioOff: false,
                            userImage: peer.imageUrl,
                            name: peer.name,
                            role: peer.role,
                            activity: peer.activity
                        }
                    }));
                    await initiateConnection(peer.socketId, peer.userId, currentStream);
                }
            });
        });

        // 2. New user joined
        socketInstance.on("user-joined", ({ socketId, userId, name, role, activity, imageUrl }: PeerData) => {
            // Add initial info
            setPeers(prev => {
                const newMap = new Map(prev);
                newMap.set(socketId, { socketId, userId, name, role, activity, imageUrl });
                return newMap;
            });
            setRemoteMediaStates(prev => ({
                ...prev,
                [socketId]: {
                    isVideoOff: false,
                    isAudioOff: false,
                    userImage: imageUrl,
                    name: name,
                    role: role,
                    activity: activity
                }
            }));

            // Send our media state
            if (isMutedRef.current) {
                socketInstance.emit('toggle-media', { roomId: meetingCode, kind: 'audio', status: true });
            }
            if (isVideoOffRef.current) {
                socketInstance.emit('toggle-media', {
                    roomId: meetingCode,
                    kind: 'video',
                    status: true,
                    userImage: user?.imageUrl
                });
            }
        });

        // Signaling
        socketInstance.on("offer", async ({ offer, senderId, senderUserId }: { offer: RTCSessionDescriptionInit, senderId: string, senderUserId: string }) => {
            await handleReceiveOffer(offer, senderId, senderUserId, currentStream);
        });

        socketInstance.on("answer", async ({ answer, senderId }: { answer: RTCSessionDescriptionInit, senderId: string }) => {
            await handleReceiveAnswer(answer, senderId);
        });

        socketInstance.on("ice-candidate", async ({ candidate, senderId }: { candidate: RTCIceCandidate, senderId: string }) => {
            await handleReceiveIceCandidate(candidate, senderId);
        });

        socketInstance.on("user-left", ({ socketId }) => {
            handleUserLeft(socketId);
        });

        socketInstance.on("receive-message", handleReceiveMessage);

        socketInstance.on("media-toggled", ({ kind, status, senderId, userImage }) => {
            setRemoteMediaStates(prev => ({
                ...prev,
                [senderId]: {
                    ...prev[senderId],
                    [kind === 'video' ? 'isVideoOff' : 'isAudioOff']: !status, // status=true means active
                    ...(userImage ? { userImage } : {})
                }
            }));
        });
    };

    // --- WebRTC Core ---

    const createPeerConnection = (targetSocketId: string, targetUserId: string, stream: MediaStream) => {
        if (peerConnections.current.has(targetSocketId)) {
            peerConnections.current.get(targetSocketId)?.close();
        }

        const pc = new RTCPeerConnection(RTC_CONFIG);
        // Add local tracks
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setPeers(prev => {
                    const newMap = new Map(prev);
                    newMap.set(targetSocketId, { socketId: targetSocketId, userId: targetUserId, stream: event.streams[0] });
                    return newMap;
                });
                updatePeers();
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit("ice-candidate", {
                    candidate: event.candidate,
                    roomId: meetingCode,
                    targetSocketId: targetSocketId
                });
            }
        };

        pc.onconnectionstatechange = () => {
            // Optional: handle different states
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                // handleUserLeft(targetSocketId); // Let explicit leave handle this primarily
            }
        };

        peerConnections.current.set(targetSocketId, pc);
        return pc;
    };

    const initiateConnection = async (targetSocketId: string, targetUserId: string, stream: MediaStream) => {
        const pc = createPeerConnection(targetSocketId, targetUserId, stream);
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketRef.current?.emit("offer", {
                offer,
                roomId: meetingCode,
                targetSocketId: targetSocketId
            });
        } catch (err) {
            console.error("Error creating offer:", err);
        }
    };

    const handleReceiveOffer = async (offer: RTCSessionDescriptionInit, senderId: string, senderUserId: string, stream: MediaStream) => {
        const pc = createPeerConnection(senderId, senderUserId, stream);
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            // Process queued candidates
            const queue = iceCandidatesQueues.current.get(senderId) || [];
            while (queue.length > 0) {
                await pc.addIceCandidate(queue.shift()!).catch(console.error);
            }
            iceCandidatesQueues.current.delete(senderId);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketRef.current?.emit("answer", {
                answer,
                roomId: meetingCode,
                targetSocketId: senderId
            });
        } catch (err) {
            console.error("Error handling offer:", err);
        }
    };

    const handleReceiveAnswer = async (answer: RTCSessionDescriptionInit, senderId: string) => {
        const pc = peerConnections.current.get(senderId);
        if (pc && pc.signalingState !== "stable") {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    };

    const handleReceiveIceCandidate = async (candidate: RTCIceCandidate, senderId: string) => {
        const pc = peerConnections.current.get(senderId);
        if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
        } else {
            const queue = iceCandidatesQueues.current.get(senderId) || [];
            queue.push(new RTCIceCandidate(candidate));
            iceCandidatesQueues.current.set(senderId, queue);
        }
    };

    const handleUserLeft = (socketId: string) => {
        if (peerConnections.current.has(socketId)) {
            peerConnections.current.get(socketId)?.close();
            peerConnections.current.delete(socketId);
        }
        setPeers(prev => {
            const newMap = new Map(prev);
            newMap.delete(socketId);
            return newMap;
        });
        updatePeers();

        // Cleanup media state
        setRemoteMediaStates(prev => {
            const newState = { ...prev };
            delete newState[socketId];
            return newState;
        });
    };

    // --- Chat ---

    const handleReceiveMessage = ({ message, senderName, senderId, timestamp }: any) => {
        setChatMessages((prev) => [...prev, {
            sender: senderName,
            senderId,
            message,
            timestamp: new Date(timestamp),
            id: `${Date.now()}-${Math.random()}`
        }]);
        if (!isSidebarOpen || sidebarTab !== 'chat') setUnreadCount(prev => prev + 1);
    };

    const sendMessage = (message: string) => {
        if (!message.trim() || !socketRef.current) return;
        // Optimistic update
        const newMessage = {
            sender: 'You',
            senderId: user!.id,
            message,
            timestamp: new Date(),
            id: `${Date.now()}-${Math.random()}`
        };
        // We rely on server broadcast for consistency in this version to match valid timestamps,
        // but optimistic is better for UX.
        // For now, let's append it.
        setChatMessages((prev) => [...prev, newMessage]);

        socketRef.current.emit('send-message', { roomId: meetingCode, message, senderName: user?.firstName || 'Anonymous' });
    };

    // --- Cleanup & Controls ---

    const cleanup = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();

        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        initialized.current = false;
    };

    // --- Controls Logic ---

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
            const newMuted = !isMuted;
            setIsMuted(newMuted);
            isMutedRef.current = newMuted;
            socketRef.current?.emit('toggle-media', { roomId: meetingCode, kind: 'audio', status: !newMuted });
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
            const newVideoOff = !isVideoOff;
            setIsVideoOff(newVideoOff);
            isVideoOffRef.current = newVideoOff;
            socketRef.current?.emit('toggle-media', {
                roomId: meetingCode,
                kind: 'video',
                status: !newVideoOff,
                userImage: user?.imageUrl
            });
        }
    };

    const leaveMeeting = () => {
        cleanup();
        router.push("/dashboard");
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(meetingCode);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    // --- Layout Logic ---
    const peerCount = peers.size;
    const totalParticipants = peerCount + 1; // +1 for self

    // UI Grid Classes based on count
    const getGridClass = () => {
        if (peerCount === 0) return "flex items-center justify-center"; // Waiting state
        if (peerCount === 1) return "flex items-center justify-center p-0"; // 1 on 1 (Full screenish)
        return "grid grid-cols-2 gap-2 p-2 place-content-center h-full"; // 2+ Participants (Grid)
    };

    const renderRemoteVideo = (peer: PeerData) => {
        const mediaState = remoteMediaStates[peer.socketId];
        const isVideoOff = mediaState?.isVideoOff;

        // Use ref callback to get the video element from the VideoPlayer if possible,
        // or wrap VideoPlayer to forward ref.
        // For simplicity, we can try to pass a ref to VideoPlayer, but since it maps multiple peers,
        // we can't easily use a single ref.
        // Better approach: Make a wrapper component for RemotePeer that handles its own ref and tracking.

        return (
            <RemotePeer
                key={peer.socketId}
                peer={peer}
                mediaState={mediaState}
                peerCount={peerCount}
            />
        );
    };

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#050505] text-white">
                <div className="text-center space-y-6">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                        <Wifi className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Connection Failed</h1>
                    <p className="text-zinc-500">{error}</p>
                    <button onClick={() => router.push("/dashboard")} className="px-8 py-3 bg-white text-black rounded-xl hover:bg-zinc-200 transition font-medium">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full bg-[#030303] overflow-hidden font-sans">
            {/* Textures */}
            <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            {/* Header / Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start pointer-events-none">
                {/* Session Code */}
                <div className="pointer-events-auto group flex items-center gap-0 rounded-xl bg-zinc-900/80 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden">
                    <div className="px-4 py-2.5 flex flex-col justify-center border-r border-white/5 bg-white/5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">Session</span>
                        <span className="text-sm font-mono font-bold text-white tracking-widest leading-none">{meetingCode}</span>
                    </div>
                    <button onClick={copyToClipboard} className="h-full px-4 py-2 flex items-center justify-center hover:bg-orange-500/10 transition-colors text-zinc-400 hover:text-orange-400">
                        {hasCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                </div>

                {/* Status */}
                <div className="pointer-events-auto">
                    {peerCount > 0 ? (
                        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 backdrop-blur-md px-3 py-1.5 border border-emerald-500/20 shadow-lg">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                            <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider inline-block">
                                {peerCount + 1} Active Limit 4
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 rounded-full bg-amber-500/10 backdrop-blur-md px-3 py-1.5 border border-amber-500/20 shadow-lg">
                            <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
                            <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Waiting for others</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area - Dynamic Grid */}
            <div className={cn("absolute inset-0 z-10", getGridClass())}>
                {peerCount === 0 ? (
                    // Waiting State
                    <div className="relative flex flex-col items-center justify-center">
                        <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-[#0A0A0A] border border-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.2)] mb-8">
                            <div className="absolute inset-0 rounded-full border border-orange-500/20 animate-[spin_8s_linear_infinite]" />
                            <Wifi className="relative h-8 w-8 text-orange-500 animate-ping" />
                        </div>
                        <h2 className="text-2xl font-semibold text-white tracking-tight text-center">Waiting for participants...</h2>
                        <p className="text-zinc-500 text-sm mt-2">Share the code to start the meeting.</p>
                    </div>
                ) : (
                    <>
                        {/* Render Remote Peers */}
                        {Array.from(peers.values()).map(peer => renderRemoteVideo(peer))}

                        {/* Render Local User as part of Grid if 4 participants (3 remote + 1 self) */}
                        {peerCount === 3 && (
                            <div className="relative bg-zinc-900 rounded-lg overflow-hidden border border-white/5 shadow-2xl">
                                <VideoPlayer
                                    stream={localStream}
                                    muted={true}
                                    mirror={true}
                                    className={cn(isVideoOff && "hidden")}
                                />
                                {isVideoOff && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                                        <Avatar className="h-24 w-24 border-4 border-zinc-900">
                                            <AvatarImage src={user?.imageUrl} />
                                            <AvatarFallback>You</AvatarFallback>
                                        </Avatar>
                                    </div>
                                )}
                                <div className="absolute bottom-4 left-4 z-10 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-xs font-medium text-white shadow-sm border border-white/5">
                                    You
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Self Video - PiP (Only visible if NOT in grid, i.e., peerCount < 3) */}
            {peerCount < 3 && (
                <div className="absolute bottom-6 right-6 z-30 h-40 w-28 sm:h-56 sm:w-40 rounded-2xl bg-zinc-900 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all hover:scale-105 hover:border-orange-500/30 group">
                    <VideoPlayer
                        stream={localStream}
                        muted={true}
                        mirror={true}
                        className={cn(isVideoOff && "hidden")}
                    />
                    {isVideoOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                            <Avatar className="h-16 w-16 border-2 border-zinc-800">
                                <AvatarImage src={user?.imageUrl} />
                                <AvatarFallback>You</AvatarFallback>
                            </Avatar>
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-[10px] font-medium text-white/90 border border-white/5">You</div>
                </div>
            )}

            {/* REMOVED: Ghost Grid Overlay block was here */}


            {/* Controls Bar */}
            <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 p-2 rounded-2xl bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
                <button onClick={toggleMute} className={cn("flex h-12 w-12 items-center justify-center rounded-xl transition", isMuted ? "bg-red-500/10 text-red-500" : "bg-white/5 text-zinc-200 hover:text-white")}>
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <button onClick={toggleVideo} className={cn("flex h-12 w-12 items-center justify-center rounded-xl transition", isVideoOff ? "bg-red-500/10 text-red-500" : "bg-white/5 text-zinc-200 hover:text-white")}>
                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </button>
                <div className="w-px h-8 bg-white/10 mx-1" />
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={cn("relative flex h-12 w-12 items-center justify-center rounded-xl transition", isSidebarOpen ? "bg-orange-500/20 text-orange-500" : "bg-white/5 text-zinc-200 hover:text-white")}>
                    <MoreHorizontal className="h-5 w-5" />
                    {unreadCount > 0 && <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />}
                </button>
                <button onClick={leaveMeeting} className="ml-2 flex h-12 px-6 items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg">
                    <PhoneOff className="h-5 w-5" />
                    <span className="text-sm font-semibold hidden sm:inline-block">End</span>
                </button>
            </div>

            {/* Sidebar */}
            <MeetingSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                activeTab={sidebarTab}
                setActiveTab={setSidebarTab}
                chatMessages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                onSendMessage={sendMessage}
                unreadCount={unreadCount}
            />

            <style jsx global>{`
                .mirror-mode { transform: scaleX(-1); }
            `}</style>
        </div>
    );
}

// Helper component for playing streams
function VideoPlayer({
    stream,
    muted = false,
    mirror = false,
    className,
    videoRef
}: {
    stream?: MediaStream | null,
    muted?: boolean,
    mirror?: boolean,
    className?: string,
    videoRef?: React.RefObject<HTMLVideoElement | null>
}) {
    const internalRef = useRef<HTMLVideoElement>(null);
    const refToUse = videoRef || internalRef;

    useEffect(() => {
        if (refToUse.current && stream) {
            refToUse.current.srcObject = stream;
            refToUse.current.play().catch(e => console.error("Auto-play failed:", e));
        } else if (refToUse.current) {
            refToUse.current.srcObject = null;
        }
    }, [stream, refToUse]);

    if (!stream) return (
        <div className="flex h-full w-full items-center justify-center bg-zinc-900 border border-white/5 rounded-lg">
            <Loader2 className="h-8 w-8 text-white/20 animate-spin" />
        </div>
    );

    return (
        <video
            ref={refToUse}
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

function RemotePeer({ peer, mediaState, peerCount }: { peer: PeerData, mediaState: any, peerCount: number }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const isVideoOff = mediaState?.isVideoOff;

    return (
        <div className={cn(
            "relative bg-zinc-900 overflow-hidden shadow-2xl transition-all",
            peerCount === 1 ? "w-full h-full" : "w-full h-full",
            "rounded-lg border border-white/5"
        )}>
            {isVideoOff ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-800">
                    <Avatar className="h-24 w-24 border-4 border-zinc-900 mb-4">
                        <AvatarImage src={mediaState?.userImage || ""} className="object-cover" />
                        <AvatarFallback className="bg-zinc-700 text-zinc-400"><User className="h-10 w-10" /></AvatarFallback>
                    </Avatar>
                    <p className="text-zinc-400 font-medium">Camera Off</p>
                </div>
            ) : (
                <VideoPlayer stream={peer.stream} videoRef={videoRef} />
            )}

            {/* AR Name Tag - Only show if video is ON and we have a name */}
            {!isVideoOff && mediaState?.name && (
                <ARNameTag
                    name={mediaState.name}
                    role={mediaState.role || "Developer"}
                    activity={mediaState.activity || "Working"}
                    videoRef={videoRef}
                    className="pointer-events-none"
                />
            )}

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
