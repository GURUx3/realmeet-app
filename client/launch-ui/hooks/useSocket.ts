import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

interface UseSocketProps {
    meetingCode: string;
    userId?: string;
    isLoaded: boolean;
}

export function useSocket({ meetingCode, userId, isLoaded }: UseSocketProps) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded || !userId || !meetingCode) return;

        const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
            path: "/socket.io/",
            transports: ["websocket"],
            reconnection: false, // We handle manual reconnects if needed, or rely on reload for now
            timeout: 10000,
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);
            setError(null);
            console.log("Socket connected:", socketInstance.id);
            socketInstance.emit("join-room", { roomId: meetingCode, userId });
        });

        socketInstance.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            setIsConnected(false);
            setError("Failed to connect to the meeting server.");
        });

        socketInstance.on("disconnect", (reason) => {
            setIsConnected(false);
            console.log("Socket disconnected:", reason);
            if (reason === "io server disconnect") {
                // The server explicitly disconnected the client; manual reconnection required
                socketInstance.connect();
            }
        });

        socketInstance.on("room-full", () => {
            setError("Room is full (Max 4 participants). Redirecting...");
            setTimeout(() => router.push("/dashboard"), 3000);
        });

        setSocket(socketInstance);

        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, [isLoaded, userId, meetingCode, router]);

    return { socket, isConnected, error };
}
