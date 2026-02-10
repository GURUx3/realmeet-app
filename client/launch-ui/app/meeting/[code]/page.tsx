"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { io, Socket } from "socket.io-client";
import { useParams, useRouter } from "next/navigation";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Wifi, MoreHorizontal, Check, Copy, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import MeetingSidebar from "./MeetingSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// WebRTC Configuration
const RTC_CONFIG = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
    ],
};

export default function MeetingPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const params = useParams();
    const meetingCode = params.code as string;

    // State
    const [isConnected, setIsConnected] = useState(false);
    const [isPeerConnected, setIsPeerConnected] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'chat' | 'files'>('chat');
    const [unreadCount, setUnreadCount] = useState(0);
    const [chatMessages, setChatMessages] = useState<Array<{ sender: string, message: string, timestamp: Date, id: string }>>([]);
    const [chatInput, setChatInput] = useState('');
    const [hasCopied, setHasCopied] = useState(false);
    const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);
    const [isRemoteAudioOff, setIsRemoteAudioOff] = useState(false);
    const [remoteUserImage, setRemoteUserImage] = useState<string | null>(null);

    // Refs
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const initialized = useRef(false);
    const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);
    const isMutedRef = useRef(false);
    const isVideoOffRef = useRef(false);

    // --- [LOGIC SECTION - KEPT IDENTICAL] ---
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

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            setTimeout(() => {
                if (remoteVideoRef.current) remoteVideoRef.current.play().catch(console.error);
            }, 100);
        } else if (!remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
    }, [remoteStream]);

    useEffect(() => {
        if (isSidebarOpen && sidebarTab === 'chat') setUnreadCount(0);
    }, [isSidebarOpen, sidebarTab]);

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
            setError("Room full. Redirecting...");
            setTimeout(() => router.push("/dashboard"), 3000);
        });

        socketInstance.on("user-joined", () => {
            if (!peerConnectionRef.current) initiateCall(currentStream);

            // Sync media state with the new user
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

        socketInstance.on("offer", (data) => handleReceiveOffer(data, currentStream));
        socketInstance.on("answer", handleReceiveAnswer);
        socketInstance.on("ice-candidate", handleReceiveIceCandidate);
        socketInstance.on("user-left", handleUserLeft);
        socketInstance.on("receive-message", handleReceiveMessage);

        socketInstance.on("media-toggled", ({ kind, status, senderId, userImage }) => {
            if (kind === 'video') {
                setIsRemoteVideoOff(!status);
                if (userImage) setRemoteUserImage(userImage);
            }
            if (kind === 'audio') setIsRemoteAudioOff(!status);
        });
    };

    const createPeerConnection = (stream: MediaStream) => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        const pc = new RTCPeerConnection(RTC_CONFIG);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) setRemoteStream(event.streams[0]);
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit("ice-candidate", { candidate: event.candidate, roomId: meetingCode });
            }
        };

        pc.onconnectionstatechange = () => {
            setIsPeerConnected(pc.connectionState === "connected");
            if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                setRemoteStream(null);
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    };

    const initiateCall = async (stream: MediaStream) => {
        const pc = createPeerConnection(stream);
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketRef.current?.emit("offer", { offer, roomId: meetingCode });
        } catch (err) {
            console.error(err);
        }
    };

    const processIceQueue = async () => {
        const pc = peerConnectionRef.current;
        if (!pc || !pc.remoteDescription) return;
        while (iceCandidatesQueue.current.length > 0) {
            const candidate = iceCandidatesQueue.current.shift();
            if (candidate) await pc.addIceCandidate(candidate).catch(console.error);
        }
    };

    const handleReceiveOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }, stream: MediaStream) => {
        if (peerConnectionRef.current) peerConnectionRef.current.close();
        const pc = createPeerConnection(stream);
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            await processIceQueue();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socketRef.current?.emit("answer", { answer, roomId: meetingCode });
        } catch (err) {
            console.error(err);
        }
    };

    const handleReceiveAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
        const pc = peerConnectionRef.current;
        if (pc && pc.signalingState !== "stable") {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            await processIceQueue();
        }
    };

    const handleReceiveIceCandidate = async ({ candidate }: { candidate: RTCIceCandidate }) => {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
        } else {
            iceCandidatesQueue.current.push(new RTCIceCandidate(candidate));
        }
    };

    const handleUserLeft = () => {
        setRemoteStream(null);
        setIsPeerConnected(false);
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
    };

    const handleReceiveMessage = ({ message, senderName, timestamp }: { message: string, senderName: string, timestamp: string }) => {
        setChatMessages((prev) => [...prev, { sender: senderName, message, timestamp: new Date(timestamp), id: `${Date.now()}-${Math.random()}` }]);
        if (!isSidebarOpen || sidebarTab !== 'chat') setUnreadCount(prev => prev + 1);
    };

    const sendMessage = (message: string) => {
        if (!message.trim() || !socketRef.current) return;
        const newMessage = { sender: 'You', message, timestamp: new Date(), id: `${Date.now()}-${Math.random()}` };
        setChatMessages((prev) => [...prev, newMessage]);
        socketRef.current.emit('send-message', { roomId: meetingCode, message, senderName: user?.firstName || 'Anonymous' });
    };

    const cleanup = () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        initialized.current = false;
    };

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

    // --- [RENDER] ---

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#050505] text-white">
                <div className="text-center space-y-6">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                        <Wifi className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Connection Failed</h1>
                    <p className="text-zinc-500">{error}</p>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="px-8 py-3 bg-white text-black rounded-xl hover:bg-zinc-200 transition font-medium"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full bg-[#030303] overflow-hidden font-sans selection:bg-orange-500/30">

            {/* --- Background Texture (Consistent with Dashboard) --- */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            {/* --- TOP LEFT: MEETING INFO PILL --- */}
            <div className="absolute top-6 left-6 z-30">
                <div className="group flex items-center gap-0 rounded-xl bg-zinc-900/80 backdrop-blur-md border border-white/10 shadow-xl transition-all hover:border-orange-500/30 overflow-hidden">
                    <div className="px-4 py-2.5 flex flex-col justify-center border-r border-white/5 bg-white/5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">Session</span>
                        <span className="text-sm font-mono font-bold text-white tracking-widest leading-none">{meetingCode}</span>
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className="h-full px-4 py-2 flex items-center justify-center hover:bg-orange-500/10 transition-colors text-zinc-400 hover:text-orange-400"
                        title="Copy Code"
                    >
                        {hasCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* --- TOP RIGHT: STATUS INDICATORS --- */}
            <div className="absolute top-6 right-6 z-30 flex flex-col items-end gap-2">
                {isPeerConnected ? (
                    <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 backdrop-blur-md px-3 py-1.5 border border-emerald-500/20 shadow-lg">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                        <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">Secure Link Active</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 rounded-full bg-amber-500/10 backdrop-blur-md px-3 py-1.5 border border-amber-500/20 shadow-lg">
                        <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
                        <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Establishing Link</span>
                    </div>
                )}
            </div>

            {/* --- MAIN AREA: REMOTE VIDEO OR SEARCHING STATE --- */}
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#050505]">
                {remoteStream ? (
                    isRemoteVideoOff ? (
                        <div className="flex flex-col items-center justify-center animate-in fade-in duration-500">
                            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-zinc-900 border border-white/10 shadow-2xl">
                                <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse" />
                                <Avatar className="h-full w-full border-4 border-zinc-900">
                                    <AvatarImage src={remoteUserImage || ""} className="object-cover" />
                                    <AvatarFallback className="bg-zinc-800 text-zinc-400">
                                        <User className="h-12 w-12" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <p className="mt-6 text-zinc-500 font-medium tracking-wide">Remote Camera Off</p>
                        </div>
                    ) : (
                        <div className="relative h-full w-full">
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="h-full w-full object-cover animate-in fade-in duration-1000"
                            />
                        </div>
                    )
                ) : (
                    // --- ORANGE THEMED WAITING STATE ---
                    <div className="relative flex flex-col items-center justify-center w-full max-w-lg z-10">

                        {/* Ambient Glow behind scanner */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

                        <div className="relative flex items-center justify-center py-16">
                            {/* Center Node */}
                            <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-[#0A0A0A] border border-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
                                <div className="absolute inset-0 rounded-full border border-orange-500/20 animate-[spin_8s_linear_infinite]" />
                                <div className="absolute inset-2 rounded-full border border-amber-500/10 animate-[spin_6s_linear_infinite_reverse]" />
                                {/* Scanning line */}
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                                </div>
                                <Wifi className="relative h-8 w-8 text-orange-500 animate-ping" />
                            </div>

                            {/* Ripples */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="absolute h-48 w-48 rounded-full border border-orange-500/10 animate-ping [animation-duration:3s]" />
                                <div className="absolute h-64 w-64 rounded-full border border-orange-500/5 animate-ping [animation-duration:3s] [animation-delay:0.5s]" />
                            </div>
                        </div>

                        <div className="text-center space-y-2 relative z-10 mt-[-20px]">
                            <h2 className="text-2xl font-semibold text-white tracking-tight">
                                Waiting for peer connection
                                <span className="animate-pulse">...</span>
                            </h2>
                            <p className="text-zinc-500 text-sm">
                                Share the session code to begin encrypted transmission.
                            </p>

                            <div className="pt-8">
                                {/* Copy button removed as requested */}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- BOTTOM RIGHT: DRAGGABLE LOCAL VIDEO --- */}
            <div className="absolute bottom-6 right-6 z-20 h-40 w-28 sm:h-56 sm:w-40 rounded-2xl bg-zinc-900 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all hover:scale-105 hover:border-orange-500/30 group">
                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                        "h-full w-full object-cover mirror-mode",
                        isVideoOff && "hidden"
                    )}
                />
                {isVideoOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 border border-white/10 rounded-2xl">
                        <Avatar className="h-16 w-16 border-2 border-zinc-800">
                            <AvatarImage src={user?.imageUrl} className="object-cover" />
                            <AvatarFallback className="bg-zinc-800 text-zinc-400">You</AvatarFallback>
                        </Avatar>
                    </div>
                )}
                {/* Name Tag & Status */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center z-10">
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-[10px] font-medium text-white/90 border border-white/5">
                            You
                        </div>
                        {isMuted && (
                            <div className="p-1 rounded-full bg-red-500/80 backdrop-blur-sm shadow-sm">
                                <MicOff className="h-3 w-3 text-white" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- BOTTOM CENTER: CONTROLS BAR --- */}
            <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 p-2 rounded-2xl bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">

                {/* Mute Toggle */}
                <button
                    onClick={toggleMute}
                    className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200",
                        isMuted
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 ring-1 ring-red-500/20"
                            : "bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white"
                    )}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                {/* Video Toggle */}
                <button
                    onClick={toggleVideo}
                    className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200",
                        isVideoOff
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 ring-1 ring-red-500/20"
                            : "bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white"
                    )}
                    title={isVideoOff ? "Start Video" : "Stop Video"}
                >
                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </button>

                <div className="w-px h-8 bg-white/10 mx-1" />

                {/* More Options / Chat */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={cn(
                        "relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200",
                        isSidebarOpen
                            ? "bg-orange-500/20 text-orange-500 ring-1 ring-orange-500/30"
                            : "bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white"
                    )}
                >
                    <MoreHorizontal className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-[#0A0A0A] animate-pulse" />
                    )}
                </button>

                {/* End Call (Separate and prominent) */}
                <button
                    onClick={leaveMeeting}
                    className="ml-2 flex h-12 px-6 items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20 hover:scale-[1.02]"
                >
                    <PhoneOff className="h-5 w-5" />
                    <span className="text-sm font-semibold hidden sm:inline-block">End</span>
                </button>
            </div>
            {/*  */}
            {/* --- SIDEBAR --- */}
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
                .mirror-mode {
                    transform: scaleX(-1);
                }
            `}</style>
        </div >
    );
}