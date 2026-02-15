
import { NextResponse } from 'next/server';

export async function GET() {
    // Use the key provided by the user or from env
    const METERED_API_KEY = process.env.METERED_API_KEY || "36d39cef659a4a8b451fd6413abbb201c4bc";
    const METERED_DOMAIN = "guruuu.metered.live";

    try {
        const response = await fetch(`https://${METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch TURN credentials: ${response.statusText}`);
        }

        const iceServers = await response.json();
        return NextResponse.json({ iceServers });

    } catch (error) {
        console.error("TURN Fetch Error:", error);
        // Fallback to Google STUN if fetch fails
        return NextResponse.json({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ]
        });
    }
}
