import fs from 'fs';

const logFile = 'test-results.txt';
fs.writeFileSync(logFile, ''); // clear file

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";
const ROOM_ID = "test-room-123";

const createClient = (name: string, userId: string) => {
    return new Promise<any>((resolve, reject) => {
        const socket = io(SERVER_URL, {
            path: "/socket.io/",
            transports: ["websocket"],
            reconnection: false, // We want to control connections manually for testing
        });

        socket.on("connect", () => {
            log(`✅ [${name}] Connected ${socket.id}`);
            socket.emit("join-room", { roomId: ROOM_ID, userId }, (res: any) => {
                log(`   [${name}] Join Response: ${JSON.stringify(res)}`);
            });
        });

        socket.on("room-full", () => {
            log(`❌ [${name}] Room Full!`);
            resolve({ name, socket, status: "full" });
        });

        socket.on("user-joined", (uid) => {
            log(`👤 [${name}] Peer joined: ${uid}`);
        });

        socket.on("disconnect", (reason) => {
            log(`⚠️ [${name}] Disconnected: ${reason}`);
        });

        // Resolve after a short delay to allow events to process
        setTimeout(() => {
            resolve({ name, socket, status: "connected" });
        }, 1000);
    });
};

async function runTest() {
    log("🚀 Starting WebRTC Flow Test");

    // 1. User A Joins
    const clientA = await createClient("UserA", "user-a");

    // 2. User B Joins
    const clientB = await createClient("UserB", "user-b");

    // 3. User A Reconnects (Refresh page scenario)
    log("🔄 User A Reconnecting...");
    const clientA_New = await createClient("UserA_New", "user-a");

    // 4. User C Joins (Should fail)
    log("Testing Room Full...");
    const clientC = await createClient("UserC", "user-c"); // Should be full

    if (clientC.status === "full") {
        log("✅ Room Full logic working correctly (User C rejected)");
    } else {
        log("❌ Room Full logic FAILED (User C joined)");
    }

    // Cleanup
    clientA.socket.disconnect();
    clientB.socket.disconnect();
    clientA_New.socket.disconnect();
    clientC.socket.disconnect();
    process.exit(0);
}

runTest();
