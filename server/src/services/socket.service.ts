import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { prisma } from '../database/client';
import { transcriptService } from './transcript.service';

/**
 * Socket.io Signaling Service
 * 
 * Handles real-time WebRTC signaling and Speech-to-Text:
 * - Room management (join/leave)
 * - WebRTC Signaling (Offer/Answer/ICE)
 * - Real-time Transcript accumulation & Saving
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
            this.handleTranscriptEvents(socket);

            socket.on('disconnect', async () => {
                console.log(`❌ Client disconnected: ${socket.id}`);
                const userId = socket.data.userId;
                const roomId = socket.data.roomId;

                if (userId && this.userSocketMap.get(userId) === socket.id) {
                    this.userSocketMap.delete(userId);
                    console.log(`🗑️ Cleared socket map for user ${userId}`);
                }

                if (roomId && userId) {
                    // Update participant status in DB
                    try {
                        await prisma.meetingParticipant.updateMany({
                            where: { meetingId: roomId, userId: userId },
                            data: { leftAt: new Date() }
                        });
                    } catch (err) {
                        console.error("Error updating participant leftAt:", err);
                    }
                    socket.to(roomId).emit('user-left', { socketId: socket.id, userId });

                    // Check if room is empty, if so, save transcript
                    const room = this.io.sockets.adapter.rooms.get(roomId);
                    if (!room || room.size === 0) {
                        if (transcriptService.hasData(roomId)) {
                            console.log(`📝 Room ${roomId} is empty. Saving transcript...`);
                            transcriptService.saveTranscript(roomId);
                        }
                    }
                }
            });
        });
    }

    private handleRoomEvents(socket: Socket) {
        // Join a meeting room
        socket.on('join-room', async ({ roomId, userId }: { roomId: string, userId: string }, callback?: (res: any) => void) => {
            console.log(`📥 Join request for room ${roomId} from user ${userId} (socket ${socket.id})`);

            socket.data.userId = userId;
            socket.data.roomId = roomId;
            this.userSocketMap.set(userId, socket.id);

            // 1. Database Operations for Persistence
            try {
                // Ensure meeting exists (or find by code if we use code as ID, but schema says code is unique, ID is uuid)
                // For simplicity in this migration, we assume roomId passed from client IS the meeting.code (judging by client code)
                // We need to resolve Meeting ID from Code.

                let meeting = await prisma.meeting.findUnique({ where: { code: roomId } });

                if (!meeting) {
                    // Auto-create meeting if it doesn't exist (for ad-hoc joins)
                    // In a real app, user might Create first, but here we support ad-hoc for simplicity
                    meeting = await prisma.meeting.create({
                        data: {
                            code: roomId,
                            creatorId: userId,
                        }
                    });
                }

                // Add/Update Participant
                // We upsert to handle re-joins
                await prisma.meetingParticipant.upsert({
                    where: {
                        meetingId_userId: {
                            meetingId: meeting.id,
                            userId: userId
                        }
                    },
                    update: {
                        joinedAt: new Date(),
                        leftAt: null
                    },
                    create: {
                        meetingId: meeting.id,
                        userId: userId
                    }
                });

                // Fetch full user details for name/role
                const userDetails = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { name: true, imageUrl: true, headline: true }
                });

                // --- Mock Data Injection for "Production Grade" Feel ---
                const MOCK_ROLES = ["Senior Developer", "Product Designer", "Tech Lead", "Full Stack Engineer", "DevOps Engineer", "Solutions Architect"];
                const MOCK_ACTIVITIES = ["Refactoring API", "Designing UI", "Fixing WebRTC", "Deploying to Prod", "Code Review", "Optimizing DB", "Writing Tests"];

                const randomRole = MOCK_ROLES[Math.floor(Math.random() * MOCK_ROLES.length)];
                const randomActivity = MOCK_ACTIVITIES[Math.floor(Math.random() * MOCK_ACTIVITIES.length)];

                // Use DB headline if available, otherwise mock role
                const finalRole = userDetails?.headline || (meeting.creatorId === userId ? "Team Lead" : randomRole);
                const finalActivity = randomActivity; // Always mock activity for now as we don't track it

                // Store in socket data
                socket.data.name = userDetails?.name || "Anonymous";
                socket.data.role = finalRole;
                socket.data.activity = finalActivity;
                socket.data.imageUrl = userDetails?.imageUrl;

                // Fetch Chat History
                const messages = await prisma.message.findMany({
                    where: { meetingId: meeting.id },
                    include: { sender: true },
                    orderBy: { createdAt: 'asc' },
                    take: 100 // Limit history
                });

                // Send history to user
                socket.emit('chat-history', messages.map(m => ({
                    id: m.id,
                    senderName: m.sender.name || m.sender.email || "Unknown",
                    senderId: m.senderId,
                    message: m.content,
                    timestamp: m.createdAt.toISOString()
                })));

            } catch (error) {
                console.error("Error in join-room DB ops:", error);
                // Continue connection anyway, critical path is video
            }

            // 2. Room logic
            const room = this.io.sockets.adapter.rooms.get(roomId);
            const currentSize = room ? room.size : 0;

            if (currentSize >= 4) {
                console.warn(`⚠️ Room ${roomId} is full (${currentSize}/4). Rejecting ${socket.id}`);
                socket.emit('room-full');
                return;
            }

            console.log(`✅ ${socket.id} joining room ${roomId} (${currentSize + 1}/4)`);
            socket.join(roomId);

            if (callback) callback({ status: 'joined' });

            // Notify existing peers - Get all other socket IDs in the room
            const otherSockets = await this.io.in(roomId).fetchSockets();
            const existingUsers = otherSockets
                .filter(s => s.id !== socket.id)
                .map(s => ({
                    socketId: s.id,
                    userId: s.data.userId,
                    name: s.data.name,
                    role: s.data.role,
                    activity: s.data.activity,
                    imageUrl: s.data.imageUrl
                }));

            // Tell the new user about existing users (so they can initiate offers)
            socket.emit('existing-users', existingUsers);

            // Tell existing users about the new user
            socket.to(roomId).emit('user-joined', {
                socketId: socket.id,
                userId,
                name: socket.data.name,
                role: socket.data.role,
                activity: socket.data.activity,
                imageUrl: socket.data.imageUrl
            });
        });

        // Leave a meeting room
        socket.on('leave-room', async ({ roomId, userId }: { roomId: string, userId: string }) => {
            console.log(`👋 ${socket.id} leaving room ${roomId}`);
            socket.leave(roomId);

            // DB Update
            try {
                const meeting = await prisma.meeting.findUnique({ where: { code: roomId } });
                if (meeting) {
                    await prisma.meetingParticipant.updateMany({
                        where: { meetingId: meeting.id, userId: userId },
                        data: { leftAt: new Date() }
                    });
                }
            } catch (err) { console.error(err); }

            socket.to(roomId).emit('user-left', { socketId: socket.id, userId });
        });
    }

    private handleSignalingEvents(socket: Socket) {
        // Targeted Signaling for Mesh Topology

        socket.on('offer', ({ offer, targetSocketId }: { offer: any, roomId: string, targetSocketId: string }) => {
            console.log(`📡 Relaying OFFER from ${socket.id} to ${targetSocketId}`);
            socket.to(targetSocketId).emit('offer', {
                offer,
                senderId: socket.id,
                senderUserId: socket.data.userId
            });
        });

        socket.on('answer', ({ answer, targetSocketId }: { answer: any, roomId: string, targetSocketId: string }) => {
            console.log(`📡 Relaying ANSWER from ${socket.id} to ${targetSocketId}`);
            socket.to(targetSocketId).emit('answer', {
                answer,
                senderId: socket.id
            });
        });

        socket.on('ice-candidate', ({ candidate, roomId, targetSocketId }: { candidate: any, roomId: string, targetSocketId: string }) => {
            // ICE candidates might come before we know per-socket, but usually in mesh we know target
            // If targetSocketId is missing, it implies broadcast (legacy) but we should enforce target
            if (targetSocketId) {
                socket.to(targetSocketId).emit('ice-candidate', {
                    candidate,
                    senderId: socket.id
                });
            } else {
                console.warn(`⚠️ Legacy broadcast ICE candidate from ${socket.id}`);
                socket.to(roomId).emit('ice-candidate', { candidate, senderId: socket.id });
            }
        });

        // Chat message relay + Persistence
        socket.on('send-message', async ({ roomId, message, senderName }: { roomId: string, message: string, senderName: string }) => {
            const userId = socket.data.userId;
            console.log(`💬 Relaying message from ${socket.id} (${senderName}) to room ${roomId}`);

            // Persist
            try {
                const meeting = await prisma.meeting.findUnique({ where: { code: roomId } });
                if (meeting && userId) {
                    await prisma.message.create({
                        data: {
                            content: message,
                            senderId: userId,
                            meetingId: meeting.id
                        }
                    });
                }
            } catch (err) {
                console.error("Failed to persist message:", err);
            }

            // Broadcast
            const msgData = {
                message,
                senderName,
                senderId: userId, // Send userId for UI identification
                socketId: socket.id,
                timestamp: new Date().toISOString()
            };

            // Emit to everyone in room including sender (to confirm receipt/consistency if needed, but client usually optimistically adds)
            // Client implementation dedupes? Or we just emit to others.
            socket.to(roomId).emit('receive-message', msgData);
        });

        // Media toggle relay - Broadcast is fine for status updates
        socket.on('toggle-media', ({ roomId, kind, status, userImage }: { roomId: string, kind: 'audio' | 'video', status: boolean, userImage?: string }) => {
            console.log(`Media toggle from ${socket.id}: ${kind} is now ${status ? 'active' : 'inactive'}`);
            socket.to(roomId).emit('media-toggled', {
                senderId: socket.id,
                kind,
                status,
                userImage
            });
        });
    }

    private handleTranscriptEvents(socket: Socket) {
        // Receive a chunk of text
        socket.on('transcript-chunk', (data: { roomId: string, text: string, userId: string, userName: string, timestamp: number }) => {
            const { roomId, text, userId, userName, timestamp } = data;

            // Validate
            if (!roomId || !text || !userId) return;

            // Add to buffer
            transcriptService.addChunk(roomId, userId, userName, text, timestamp);

            // Optionally broadcast to others for real-time captions (Not requested but good for future)
            // socket.to(roomId).emit('live-caption', { userId, userName, text });

            console.log(`📝 Transcript chunk from ${userName} in ${roomId}: "${text.substring(0, 30)}..."`);
        });

        // Explicit end meeting command (force save)
        socket.on('end-meeting', ({ roomId }: { roomId: string }) => {
            console.log(`🛑 End meeting requested for ${roomId}`);
            const filePath = transcriptService.saveTranscript(roomId);

            if (filePath) {
                // Notify everyone the transcript is saved
                this.io.to(roomId).emit('transcript-saved', { filePath });
            }
        });
    }
}
