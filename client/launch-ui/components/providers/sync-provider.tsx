"use client";

import { useUserSync } from "@/hooks/useUserSync";

export function SyncProvider({ children }: { children: React.ReactNode }) {
    // This hook handles the sync logic internally
    useUserSync();

    return <>{children}</>;
}
