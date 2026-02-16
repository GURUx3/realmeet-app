import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";
const ROOM_ID = "analysis-test-room-" + Date.now();
const USER_ID = "user-analyst";

console.log("🚀 Starting Analysis Flow Test for Room:", ROOM_ID);

const socket = io(SERVER_URL, {
    path: "/socket.io/",
    transports: ["websocket"],
});

socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);

    // 1. Join
    socket.emit("join-room", { roomId: ROOM_ID, userId: USER_ID });
});

socket.on("existing-users", async () => {
    console.log("👤 Joined Room. Sending transcripts...");

    // 2. Send Transcripts
    const phrases = [
        "Hello everyone, welcome to the design review.",
        "I think we should focus on the latency issues today.",
        "Agreed, the video lag is a major bug we found.",
        "Let's create an action item to fix the React rendering.",
        "Okay, meeting adjourned."
    ];

    for (const text of phrases) {
        socket.emit("transcript-chunk", {
            roomId: ROOM_ID,
            text,
            userId: USER_ID,
            userName: "Test Analyst",
            timestamp: Date.now()
        });
        await new Promise(r => setTimeout(r, 200)); // Simulate time
    }

    console.log("📝 Transcripts sent. Ending meeting...");

    // 3. End Meeting
    // Wait a bit to ensure server processed chunks
    setTimeout(() => {
        socket.emit("end-meeting", { roomId: ROOM_ID });
    }, 1000);
});

socket.on("transcript-saved", (data) => {
    console.log("💾 Transcript Saved Event Received:", data);
});

socket.on("analysis-complete", (data) => {
    console.log("🧠 Analysis Complete Event Received!");
    console.log("   Path:", data.path);
    console.log("   Summary:", data.analysis.summary);
    console.log("   Action Items:", data.analysis.actionItems);

    console.log("✅ TEST PASSED");
    socket.disconnect();
    process.exit(0);
});

// Timeout safety
setTimeout(() => {
    console.error("❌ Test Timed Out");
    process.exit(1);
}, 10000);
