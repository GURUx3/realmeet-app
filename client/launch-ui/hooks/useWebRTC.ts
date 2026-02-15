import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";

// WebRTC Configuration
const RTC_CONFIG = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
    ],
};

export interface PeerData {
    socketId: string;
    userId: string;
    stream?: MediaStream;
}

interface UseWebRTCProps {
    socket: Socket | null;
    meetingCode: string;
    user: any; // Clerk user object
    isLoaded: boolean;
}

export function useWebRTC({ socket, meetingCode, user, isLoaded }: UseWebRTCProps) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<Map<string, PeerData>>(new Map());
    const [remoteMediaStates, setRemoteMediaStates] = useState<Record<string, { isVideoOff: boolean, isAudioOff: boolean, userImage?: string }>>({});

    // Media States
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // Refs
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const iceCandidatesQueues = useRef<Map<string, RTCIceCandidate[]>>(new Map());

    // We update refs to access latest state in callbacks without adding dependencies
    const isMutedRef = useRef(false);
    const isVideoOffRef = useRef(false);

    // Initial Media Setup
    useEffect(() => {
        if (!isLoaded) return;

        let stream: MediaStream | null = null;

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((s) => {
                stream = s;
                setLocalStream(s);
            })
            .catch((err) => {
                console.error("Failed to get media:", err);
                // Handle error (e.g. expose to parent)
            });

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isLoaded]);

    const updatePeers = useCallback(() => {
        setPeers(prev => new Map(prev)); // Trigger re-render
    }, []);

    // Socket Event Listeners for WebRTC
    useEffect(() => {
        if (!socket || !localStream || !user) return;

        const handleExistingUsers = (existingUsers: Array<{ socketId: string, userId: string }>) => {
            existingUsers.forEach(async (peer) => {
                if (!peerConnections.current.has(peer.socketId)) {
                    await initiateConnection(peer.socketId, peer.userId, localStream);
                }
            });
        };

        const handleUserJoined = ({ socketId, userId }: { socketId: string, userId: string }) => {
            // New user joined, we wait for their offer or just initiate? 
            // In mesh, usually new joiner initiates to existing, but here code says "Wait for existing users".
            // Actually, the original logic said: "We just prepare to receive an offer."
            // And we send our media state.
            if (isMutedRef.current) {
                socket.emit('toggle-media', { roomId: meetingCode, kind: 'audio', status: true });
            }
            if (isVideoOffRef.current) {
                socket.emit('toggle-media', {
                    roomId: meetingCode,
                    kind: 'video',
                    status: true,
                    userImage: user.imageUrl
                });
            }
        };

        const handleReceiveOffer = async ({ offer, senderId, senderUserId }: { offer: RTCSessionDescriptionInit, senderId: string, senderUserId: string }) => {
            const pc = createPeerConnection(senderId, senderUserId, localStream);
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

                socket.emit("answer", {
                    answer,
                    roomId: meetingCode,
                    targetSocketId: senderId
                });
            } catch (err) {
                console.error("Error handling offer:", err);
            }
        };

        const handleReceiveAnswer = async ({ answer, senderId }: { answer: RTCSessionDescriptionInit, senderId: string }) => {
            const pc = peerConnections.current.get(senderId);
            if (pc && pc.signalingState !== "stable") {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        };

        const handleReceiveIceCandidate = async ({ candidate, senderId }: { candidate: RTCIceCandidate, senderId: string }) => {
            const pc = peerConnections.current.get(senderId);
            if (pc && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
            } else {
                const queue = iceCandidatesQueues.current.get(senderId) || [];
                queue.push(new RTCIceCandidate(candidate));
                iceCandidatesQueues.current.set(senderId, queue);
            }
        };

        const handleUserLeft = ({ socketId }: { socketId: string }) => {
            if (peerConnections.current.has(socketId)) {
                peerConnections.current.get(socketId)?.close();
                peerConnections.current.delete(socketId);
            }
            setPeers(prev => {
                const newMap = new Map(prev);
                newMap.delete(socketId);
                return newMap;
            });

            setRemoteMediaStates(prev => {
                const newState = { ...prev };
                delete newState[socketId];
                return newState;
            });
        };

        const handleMediaToggled = ({ kind, status, senderId, userImage }: any) => {
            setRemoteMediaStates(prev => ({
                ...prev,
                [senderId]: {
                    ...prev[senderId],
                    [kind === 'video' ? 'isVideoOff' : 'isAudioOff']: !status,
                    ...(userImage ? { userImage } : {})
                }
            }));
        };

        socket.on("existing-users", handleExistingUsers);
        socket.on("user-joined", handleUserJoined);
        socket.on("offer", handleReceiveOffer);
        socket.on("answer", handleReceiveAnswer);
        socket.on("ice-candidate", handleReceiveIceCandidate);
        socket.on("user-left", handleUserLeft);
        socket.on("media-toggled", handleMediaToggled);

        return () => {
            socket.off("existing-users", handleExistingUsers);
            socket.off("user-joined", handleUserJoined);
            socket.off("offer", handleReceiveOffer);
            socket.off("answer", handleReceiveAnswer);
            socket.off("ice-candidate", handleReceiveIceCandidate);
            socket.off("user-left", handleUserLeft);
            socket.off("media-toggled", handleMediaToggled);
        };
    }, [socket, localStream, user, meetingCode, updatePeers]);


    // Helper Functions
    const createPeerConnection = (targetSocketId: string, targetUserId: string, stream: MediaStream) => {
        if (peerConnections.current.has(targetSocketId)) {
            peerConnections.current.get(targetSocketId)?.close();
        }

        const pc = new RTCPeerConnection(RTC_CONFIG);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setPeers(prev => {
                    const newMap = new Map(prev);
                    newMap.set(targetSocketId, { socketId: targetSocketId, userId: targetUserId, stream: event.streams[0] });
                    return newMap;
                });
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit("ice-candidate", {
                    candidate: event.candidate,
                    roomId: meetingCode,
                    targetSocketId: targetSocketId
                });
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
            socket?.emit("offer", {
                offer,
                roomId: meetingCode,
                targetSocketId: targetSocketId
            });
        } catch (err) {
            console.error("Error creating offer:", err);
        }
    };

    // Controls
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
            const newMuted = !isMuted;
            setIsMuted(newMuted);
            isMutedRef.current = newMuted;
            socket?.emit('toggle-media', { roomId: meetingCode, kind: 'audio', status: !newMuted });
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
            const newVideoOff = !isVideoOff;
            setIsVideoOff(newVideoOff);
            isVideoOffRef.current = newVideoOff;
            socket?.emit('toggle-media', {
                roomId: meetingCode,
                kind: 'video',
                status: !newVideoOff,
                userImage: user?.imageUrl
            });
        }
    };

    const cleanup = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
    };

    return {
        localStream,
        peers,
        remoteMediaStates,
        isMuted,
        isVideoOff,
        toggleMute,
        toggleVideo,
        cleanup
    };
}
