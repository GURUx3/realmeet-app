(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/contexts/theme-provider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeProvider",
    ()=>ThemeProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function ThemeProvider({ children }) {
    _s();
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThemeProvider.useEffect": ()=>{
            setMounted(true);
        }
    }["ThemeProvider.useEffect"], []);
    if (!mounted) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: children
        }, void 0, false);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeProvider"], {
        attribute: "class",
        defaultTheme: "dark",
        enableSystem: false,
        children: children
    }, void 0, false, {
        fileName: "[project]/components/contexts/theme-provider.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
_s(ThemeProvider, "LrrVfNW3d1raFE0BNzCTILYmIfo=");
_c = ThemeProvider;
var _c;
__turbopack_context__.k.register(_c, "ThemeProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * API Client Utility
 * 
 * Centralized API client for making authenticated requests to the backend.
 * Automatically attaches Clerk authentication tokens to requests.
 */ __turbopack_context__.s([
    "apiRequest",
    ()=>apiRequest,
    "syncUser",
    ()=>syncUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_URL = ("TURBOPACK compile-time value", "http://localhost:3001") || 'http://localhost:3001';
async function apiRequest(endpoint, options = {}, token) {
    try {
        const url = `${API_URL}/api${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers || {}
        };
        // Attach Bearer token if provided
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        console.log('[API] Request:', {
            method: options.method || 'GET',
            url,
            hasToken: !!token
        });
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('[API] Error response:', {
                status: response.status,
                data
            });
            return {
                success: false,
                error: data.error || 'Request failed',
                message: data.message || `HTTP ${response.status}`
            };
        }
        console.log('[API] Success response:', {
            url,
            success: data.success
        });
        return data;
    } catch (error) {
        console.error('[API] Network error:', error);
        return {
            success: false,
            error: 'Network error',
            message: error instanceof Error ? error.message : 'Failed to connect to server'
        };
    }
}
async function syncUser(token) {
    return apiRequest('/user/sync', {
        method: 'POST'
    }, token);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/hooks/useUserSync.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useUserSync",
    ()=>useUserSync
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$client$2d$boundary$2f$PromisifiedAuthProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__usePromisifiedAuth__as__useAuth$3e$__ = __turbopack_context__.i("[project]/node_modules/@clerk/nextjs/dist/esm/client-boundary/PromisifiedAuthProvider.js [app-client] (ecmascript) <export usePromisifiedAuth as useAuth>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
;
function useUserSync() {
    _s();
    const { userId, getToken, isLoaded, isSignedIn } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$client$2d$boundary$2f$PromisifiedAuthProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__usePromisifiedAuth__as__useAuth$3e$__["useAuth"])();
    const [isSyncing, setIsSyncing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [syncError, setSyncError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isSynced, setIsSynced] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useUserSync.useEffect": ()=>{
            // Only sync if:
            // 1. Auth is loaded
            // 2. User is signed in
            // 3. We have a userId
            // 4. Haven't synced yet
            // 5. Not currently syncing
            if (!isLoaded || !isSignedIn || !userId || isSynced || isSyncing) {
                return;
            }
            async function performSync() {
                setIsSyncing(true);
                setSyncError(null);
                try {
                    console.log('[useUserSync] Starting user sync for userId:', userId);
                    // Get the session token from Clerk
                    const token = await getToken();
                    if (!token) {
                        throw new Error('No session token available');
                    }
                    console.log('[useUserSync] Got session token, calling API...');
                    // Call the backend sync endpoint
                    const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syncUser"])(token);
                    if (response.success) {
                        console.log('[useUserSync] ✅ User synced successfully:', response.data);
                        setIsSynced(true);
                    } else {
                        console.error('[useUserSync] ❌ Sync failed:', response.error, response.message);
                        setSyncError(response.message || 'Failed to sync user');
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error('[useUserSync] ❌ Exception during sync:', errorMessage);
                    setSyncError(errorMessage);
                } finally{
                    setIsSyncing(false);
                }
            }
            performSync();
        }
    }["useUserSync.useEffect"], [
        isLoaded,
        isSignedIn,
        userId,
        isSynced,
        isSyncing,
        getToken
    ]);
    return {
        isSyncing,
        syncError,
        isSynced
    };
}
_s(useUserSync, "AI7U28NMbGUIJCmZ7ZBACkDMlFo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$clerk$2f$nextjs$2f$dist$2f$esm$2f$client$2d$boundary$2f$PromisifiedAuthProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__usePromisifiedAuth__as__useAuth$3e$__["useAuth"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/providers/sync-provider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SyncProvider",
    ()=>SyncProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useUserSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/useUserSync.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function SyncProvider({ children }) {
    _s();
    // This hook handles the sync logic internally
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useUserSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUserSync"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
_s(SyncProvider, "/fDRKlnhuXrRjdO2LETojDTVTEs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useUserSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUserSync"]
    ];
});
_c = SyncProvider;
var _c;
__turbopack_context__.k.register(_c, "SyncProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_65dec3a0._.js.map