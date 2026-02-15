
import { NextResponse } from 'next/server';

export async function GET() {
    const METERED_API_KEY = process.env.METERED_API_KEY;

    if (!METERED_API_KEY) {
        return NextResponse.json({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ]
        }, { status: 200 }); // Fallback to Google STUN if no key, ensuring app doesn't crash
    }

    try {
        const response = await fetch(`https://global.metered.ca/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`);

        if (!response.ok) {
            throw new Error('Failed to fetch TURN credentials');
        }

        const iceServers = await response.json();
        return NextResponse.json({ iceServers });

    } catch (error) {
        console.error("TURN Fetch Error:", error);
        // Fallback again to ensure connectivity at least works locally
        return NextResponse.json({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ]
        });
    }
}
