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
    public saveTranscript(roomId: string): string | null {
        const buffer = this.buffers.get(roomId);
        if (!buffer || buffer.length === 0) {
            return null;
        }

        // Sort by timestamp just in case
        buffer.sort((a, b) => a.timestamp - b.timestamp);

        // Format content
        let fileContent = `MEETING TRANSCRIPT - ID: ${roomId}\n`;
        fileContent += `Generated: ${new Date().toLocaleString()}\n`;
        fileContent += `----------------------------------------\n\n`;

        let lastSpeaker = '';

        buffer.forEach(chunk => {
            const timeStr = new Date(chunk.timestamp).toLocaleTimeString();

            // If speaker changed, add a new header line
            if (chunk.userName !== lastSpeaker) {
                fileContent += `\n[${timeStr}] ${chunk.userName}:\n`;
                lastSpeaker = chunk.userName;
            }

            fileContent += `  ${chunk.text}\n`;
        });

        fileContent += `\n----------------------------------------\n`;
        fileContent += `End of Transcript\n`;

        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `meeting_${timestamp}_${roomId}.txt`;
        const filePath = path.join(this.OUTPUT_DIR, filename);

        try {
            fs.writeFileSync(filePath, fileContent, 'utf-8');
            console.log(`✅ Transcript saved to: ${filePath}`);

            // Clear buffer after save
            this.buffers.delete(roomId);

            return filePath;
        } catch (error) {
            console.error(`❌ Failed to save transcript for ${roomId}:`, error);
            return null;
        }
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
