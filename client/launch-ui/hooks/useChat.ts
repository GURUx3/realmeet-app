import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

interface ChatMessage {
    sender: string;
    senderId: string;
    message: string;
    timestamp: Date;
    id: string;
}

interface UseChatProps {
    socket: Socket | null;
    meetingCode: string;
    user: any;
    isSidebarOpen: boolean;
    activeTab: string;
}

export function useChat({ socket, meetingCode, user, isSidebarOpen, activeTab }: UseChatProps) {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!socket) return;

        const handleChatHistory = (history: any[]) => {
            setChatMessages(history.map(msg => ({
                id: msg.id,
                sender: msg.senderName,
                senderId: msg.senderId,
                message: msg.message,
                timestamp: new Date(msg.timestamp)
            })));
        };

        const handleReceiveMessage = ({ message, senderName, senderId, timestamp }: any) => {
            setChatMessages((prev) => [...prev, {
                sender: senderName,
                senderId,
                message: message,
                timestamp: new Date(timestamp),
                id: `${Date.now()}-${Math.random()}`
            }]);

            // Increment unread if chat is not actively viewed
            if (!isSidebarOpen || activeTab !== 'chat') {
                setUnreadCount(prev => prev + 1);
            }
        };

        socket.on("chat-history", handleChatHistory);
        socket.on("receive-message", handleReceiveMessage);

        return () => {
            socket.off("chat-history", handleChatHistory);
            socket.off("receive-message", handleReceiveMessage);
        };
    }, [socket, isSidebarOpen, activeTab]);

    // Reset unread count when chat is opened
    useEffect(() => {
        if (isSidebarOpen && activeTab === 'chat') {
            setUnreadCount(0);
        }
    }, [isSidebarOpen, activeTab]);

    const sendMessage = (message: string) => {
        if (!message.trim() || !socket || !user) return;

        // Optimistic update
        const newMessage = {
            sender: 'You',
            senderId: user.id,
            message,
            timestamp: new Date(),
            id: `${Date.now()}-${Math.random()}`
        };

        setChatMessages((prev) => [...prev, newMessage]);

        socket.emit('send-message', {
            roomId: meetingCode,
            message,
            senderName: user.firstName || 'Anonymous'
        });
    };

    return { chatMessages, unreadCount, sendMessage };
}
