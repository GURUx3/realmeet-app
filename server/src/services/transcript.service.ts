import fs from 'fs';
import path from 'path';

interface TranscriptChunk {
    userId: string;
    userName: string;
    text: string;
    timestamp: number;
    receivedAt: number;
    isFinal: boolean; // Added isFinal flag
}

export class TranscriptService {
    private buffers: Map<string, TranscriptChunk[]> = new Map();
    private readonly OUTPUT_DIR = path.join(process.cwd(), 'transcripts');

}

    /**
     * Get a random professional scenario for testing/demo purposes
     */
    public getRandomScenario(): string {
    const scenarios = [
        [
            "We need to finalize the Q3 budget alignment by Friday to avoid resource bottlenecks.",
            "Guru will take the lead on the infrastructure migration plan starting tomorrow at 9am.",
            "The board expects a 15% reduction in cloud costs through optimized instance scheduling.",
            "Moving forward, all strategic decisions will be logged in the centralized Notion dashboard.",
            "Let's schedule a follow-up for next Tuesday to review the AI integration roadmap."
        ],
        [
            "Our current churn rate is unacceptable; we need a proactive customer success strategy immediately.",
            "Zem will coordinate with the design team to refresh the executive reporting interface.",
            "We must secure the Series B funding terms before the end of the quarter.",
            "Strategic partnerships with Google and Microsoft are now our top priority for global expansion.",
            "I'll draft the partnership proposal by tomorrow evening for your review."
        ],
        [
            "The security audit revealed critical vulnerabilities in our legacy authentication layer.",
            "The engineering team must prioritize the migration to the new OAuth2.0 standard.",
            "We are officially deprecating the v1 API by the end of next month.",
            "Security is not just a feature; it's our core competitive advantage in this market.",
            "Schedule a technical deep dive for Thursday morning to map out the transition."
        ]
    ];
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    return scenario.join(" ");
}

    /**
     * Add a speech chunk to the buffer
     */
    public addChunk(roomId: string, userId: string, userName: string, text: string, timestamp: number, isFinal: boolean = true) {
    if (!this.buffers.has(roomId)) {
        this.buffers.set(roomId, []);
    }

    const buffer = this.buffers.get(roomId)!;

    // 10000x Enhancement: Handle Interim vs Final deduplication
    // If the last chunk from this user was NOT final, and this one IS or is a newer interim,
    // we should consolidate/replace to avoid duplicates in the final saved transcript.
    const lastIdx = buffer.map(c => c.userId).lastIndexOf(userId);

    if (lastIdx !== -1) {
        const lastChunk = buffer[lastIdx];

        // If the last one was interim, replace it with this newer one
        if (!lastChunk.isFinal) {
            buffer[lastIdx] = {
                userId,
                userName,
                text,
                timestamp,
                receivedAt: Date.now(),
                isFinal
            };
            return;
        }

        // If it's a final duplicate of a final, ignore
        if (lastChunk.isFinal && isFinal && lastChunk.text === text) {
            return;
        }
    }

    buffer.push({
        userId,
        userName,
        text,
        timestamp,
        receivedAt: Date.now(),
        isFinal
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
    public saveTranscript(roomId: string): { combined: string, individual: { userId: string, userName: string, path: string } [], json: string } | null {
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
