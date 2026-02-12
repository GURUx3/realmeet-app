import { Server as HttpServer } from 'http';
/**
 * Socket.io Signaling Service
 *
 * Handles real-time WebRTC signaling:
 * - Room management (join/leave) with User ID tracking
 * - Ghost connection cleanup
 * - SDP Offer/Answer relay
 * - ICE Candidate relay
 */
export declare class SocketService {
    private io;
    private userSocketMap;
    constructor(httpServer: HttpServer);
    private initializeEvents;
    private handleRoomEvents;
    private handleSignalingEvents;
}
//# sourceMappingURL=socket.service.d.ts.map