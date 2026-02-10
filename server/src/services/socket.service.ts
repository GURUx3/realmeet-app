import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';

/**
 * Socket.io Signaling Service
 * 
 * Handles real-time WebRTC signaling:
 * - Room management (join/leave) with User ID tracking
 * - Ghost connection cleanup
 * - SDP Offer/Answer relay
 * - ICE Candidate relay
 */
export class SocketService {
    private io: Server;
    // Map userId -> socketId
    private userSocketMap = new Map<string, string>();

    constructor(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: env.cors.clientUrl,
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });

        this.initializeEvents();

        console.log('✅ Socket.io initialized');
    }

    private initializeEvents() {
        this.io.on('connection', (socket: Socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);

            this.handleRoomEvents(socket);
            this.handleSignalingEvents(socket);

            socket.on('disconnect', () => {
                console.log(`❌ Client disconnected: ${socket.id}`);
                // Cleanup map if needed
                // We interact with the map carefully in join-room, but good to clean up here too if it matches
                // However, optimization: we might have already replaced it in join-room.
                // Let's iterate to be safe, or store userId on socket.
                const userId = socket.data.userId;
                if (userId && this.userSocketMap.get(userId) === socket.id) {
                    this.userSocketMap.delete(userId);
                    console.log(`🗑️ Cleared socket map for user ${userId}`);
                }
            });
        });
    }

    private handleRoomEvents(socket: Socket) {
        // Join a meeting room
        socket.on('join-room', ({ roomId, userId }: { roomId: string, userId: string }, callback?: (res: any) => void) => {
            console.log(`📥 Join request for room ${roomId} from user ${userId} (socket ${socket.id})`);

            // Attach userId to socket for easier cleanup
            socket.data.userId = userId;

            // 1. Check if this user already has an active socket
            const existingSocketId = this.userSocketMap.get(userId);

            // DISABLED: This was causing reconnection storms
            // if (existingSocketId) {
            //     if (existingSocketId !== socket.id) {
            //         console.log(`⚠️ User ${userId} already has socket ${existingSocketId}. Disconnecting old socket.`);
            //         // Disconnect the old socket
            //         const oldSocket = this.io.sockets.sockets.get(existingSocketId);
            //         if (oldSocket) {
            //             oldSocket.leave(roomId); // Ensure it leaves the room first
            //             oldSocket.disconnect(true);
            //         }
            //         this.userSocketMap.delete(userId);
            //     } else {
            //         console.log(`ℹ️ Re-join from same socket ${socket.id} for user ${userId}`);
            //     }
            // }

            // Update map with new socket
            this.userSocketMap.set(userId, socket.id);

            // 2. Check Room Size
            const room = this.io.sockets.adapter.rooms.get(roomId);
            const currentSize = room ? room.size : 0;
            let slotsFreed = 0;

            // Cleanup: actively look for ghosts in the room
            if (room) {
                for (const clientId of room) {
                    const clientSocket = this.io.sockets.sockets.get(clientId);
                    // Check if this socket belongs to the same user and is NOT the current socket
                    const socketUser = clientSocket?.data?.userId;

                    if (clientSocket && socketUser === userId && clientId !== socket.id) {
                        console.log(`👻 Found ghost socket ${clientId} in room for user ${userId}. Removing.`);
                        clientSocket.leave(roomId);
                        clientSocket.disconnect(true);
                        slotsFreed++;
                    }
                }
            }

            if (currentSize - slotsFreed >= 2) {
                console.warn(`⚠️ Room ${roomId} is full (${currentSize - slotsFreed}/2). Rejecting ${socket.id}`);
                socket.emit('room-full');
                return;
            }

            console.log(`✅ ${socket.id} joining room ${roomId} (${currentSize - slotsFreed + 1}/2)`);
            socket.join(roomId);

            if (callback) callback({ status: 'joined' });

            // Notify existing peer
            socket.to(roomId).emit('user-joined', socket.id); // Send socket ID or User ID? 
            // Existing code sent socket.id. Keeping it for compatibility.
        });

        // Leave a meeting room
        socket.on('leave-room', (roomId: string) => {
            console.log(`👋 ${socket.id} leaving room ${roomId}`);
            socket.leave(roomId);
            socket.to(roomId).emit('user-left', socket.id);
        });
    }

    private handleSignalingEvents(socket: Socket) {
        socket.on('offer', ({ offer, roomId }: { offer: any, roomId: string }) => {
            console.log(`📡 Relaying OFFER from ${socket.id} to room ${roomId}`);
            socket.to(roomId).emit('offer', { offer, senderId: socket.id });
        });

        socket.on('answer', ({ answer, roomId }: { answer: any, roomId: string }) => {
            console.log(`📡 Relaying ANSWER from ${socket.id} to room ${roomId}`);
            socket.to(roomId).emit('answer', { answer, senderId: socket.id });
        });

        socket.on('ice-candidate', ({ candidate, roomId }: { candidate: any, roomId: string }) => {
            socket.to(roomId).emit('ice-candidate', { candidate, senderId: socket.id });
        });

        // Chat message relay
        socket.on('send-message', ({ roomId, message, senderName }: { roomId: string, message: string, senderName: string }) => {
            console.log(`💬 Relaying message from ${socket.id} (${senderName}) to room ${roomId}`);
            socket.to(roomId).emit('receive-message', {
                message,
                senderName,
                senderId: socket.id,
                timestamp: new Date().toISOString()
            });
        });

        // Media toggle relay
        socket.on('toggle-media', ({ roomId, kind, status }: { roomId: string, kind: 'audio' | 'video', status: boolean }) => {
            console.log(`Media toggle from ${socket.id}: ${kind} is now ${status ? 'active' : 'inactive'}`);
            socket.to(roomId).emit('media-toggled', {
                senderId: socket.id,
                kind,
                status
            });
        });
    }
}
