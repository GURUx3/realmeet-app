import fs from 'fs';
import path from 'path';

interface TranscriptChunk {
    userId: string;
    userName: string;
    text: string;
    timestamp: number; // Client-side timestamp
    receivedAt: number; // Server-side timestamp
}

export class TranscriptService {
    // In-memory buffer: Map<roomId, TranscriptChunk[]>
    private buffers: Map<string, TranscriptChunk[]> = new Map();
    private readonly OUTPUT_DIR = path.join(process.cwd(), 'transcripts');

    constructor() {
        // Ensure output directory exists
        if (!fs.existsSync(this.OUTPUT_DIR)) {
            fs.mkdirSync(this.OUTPUT_DIR, { recursive: true });
        }
    }

    /**
     * Add a speech chunk to the buffer
     */
    public addChunk(roomId: string, userId: string, userName: string, text: string, timestamp: number) {
        if (!this.buffers.has(roomId)) {
            this.buffers.set(roomId, []);
        }

        const buffer = this.buffers.get(roomId)!;

        // Simple deduplication: checks if the last message from the same user is identical
        // This helps when the client sends "partial" vs "final" and we might get overlap if logic isn't perfect
        const lastChunk = buffer[buffer.length - 1];
        if (lastChunk && lastChunk.userId === userId && lastChunk.text === text) {
            return; // Duplicate ignored
        }

        buffer.push({
            userId,
            userName,
            text,
            timestamp,
            receivedAt: Date.now()
        });
    }

    /**
     * Get current transcript for a room (buffer)
     */
    public getTranscript(roomId: string): TranscriptChunk[] {
        return this.buffers.get(roomId) || [];
    }

    /**
     * Save buffer to file and clear it
     */
    public saveTranscript(roomId: string): { combined: string, individual: { userId: string, userName: string, path: string }[], json: string } | null {
        const buffer = this.buffers.get(roomId);
        if (!buffer || buffer.length === 0) {
            return null;
        }

        // Sort by timestamp
        buffer.sort((a, b) => a.timestamp - b.timestamp);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileBase = `meeting_${timestamp}_${roomId}`;

        // 1. JSON Dump (Raw Data)
        const jsonPath = path.join(this.OUTPUT_DIR, `${fileBase}_full.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(buffer, null, 2), 'utf-8');

        // 2. Combined Chronological Text (for AI & Humans)
        let combinedContent = `MEETING TRANSCRIPT - ID: ${roomId}\n`;
        combinedContent += `Generated: ${new Date().toLocaleString()}\n`;
        combinedContent += `----------------------------------------\n\n`;

        let lastSpeaker = '';
        buffer.forEach(chunk => {
            const timeStr = new Date(chunk.timestamp).toLocaleTimeString();
            if (chunk.userName !== lastSpeaker) {
                combinedContent += `\n[${timeStr}] ${chunk.userName}:\n`;
                lastSpeaker = chunk.userName;
            }
            combinedContent += `  ${chunk.text}\n`;
        });
        combinedContent += `\n----------------------------------------\n`;
        const combinedPath = path.join(this.OUTPUT_DIR, `${fileBase}_combined.txt`);
        fs.writeFileSync(combinedPath, combinedContent, 'utf-8');

        // 3. Per-User Transcripts
        const users = new Set(buffer.map(c => c.userId));
        const individualFiles: { userId: string, userName: string, path: string }[] = [];

        users.forEach(userId => {
            const userChunks = buffer.filter(c => c.userId === userId);
            if (userChunks.length === 0) return;

            const userName = userChunks[0].userName;
            let userContent = `TRANSCRIPT: ${userName} (${roomId})\n`;
            userContent += `Date: ${new Date().toLocaleString()}\n`;
            userContent += `----------------------------------------\n\n`;

            userChunks.forEach(chunk => {
                const timeStr = new Date(chunk.timestamp).toLocaleTimeString();
                userContent += `[${timeStr}] ${chunk.text}\n`;
            });

            const userPath = path.join(this.OUTPUT_DIR, `${fileBase}_${userName.replace(/[^a-z0-9]/gi, '_')}.txt`);
            fs.writeFileSync(userPath, userContent, 'utf-8');
            individualFiles.push({ userId, userName, path: userPath });
        });

        console.log(`✅ Transcripts saved for ${roomId}`);
        // Clear buffer
        this.buffers.delete(roomId);

        return {
            combined: combinedPath,
            individual: individualFiles,
            json: jsonPath
        };
    }

    /**
     * Check if a room has active transcript data
     */
    public hasData(roomId: string): boolean {
        const buffer = this.buffers.get(roomId);
        return !!buffer && buffer.length > 0;
    }
}

// Export singleton
export const transcriptService = new TranscriptService();
