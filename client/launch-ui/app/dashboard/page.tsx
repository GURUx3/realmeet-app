"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { ArrowRight, Plus, Loader2, Keyboard, Video, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserSync } from "@/hooks/useUserSync";

export default function DashboardPage() {
    const [meetingCode, setMeetingCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const router = useRouter();
    const { user } = useUser();

    // Sync authenticated user to database
    useUserSync();

    const handleJoinMeeting = async () => {
        if (!meetingCode.trim()) return;
        setIsJoining(true);
        setTimeout(() => router.push(`/meeting/${meetingCode}`), 800);
    };

    const handleCreateMeeting = async () => {
        setIsCreating(true);
        const newMeetingCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        setTimeout(() => router.push(`/meeting/${newMeetingCode}`), 800);
    };

    return (
        <main className="relative flex min-h-screen w-full flex-col bg-[#030303] text-white selection:bg-orange-500/30 overflow-hidden font-sans">

            {/* --- Background Effects (Aligned with Reference Vibe) --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Horizon Glow */}
                <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 h-[500px] w-[80%] rounded-[100%] bg-orange-600/20 blur-[120px] opacity-60" />
                {/* Subtle Texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            {/* --- Navigation --- */}
            <nav className="relative z-10 flex w-full max-w-7xl mx-auto items-center justify-between px-6 py-8 md:px-12">
                {/* Logo: Clean Text Only */}
                <div className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="font-semibold text-xl tracking-tight text-white hover:text-orange-50 transition-colors">
                        RealMeet
                    </span>
                </div>

                {/* User Profile: Fixed Alignment */}
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3 text-right">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-white/90 leading-none mb-1">
                                {user?.fullName || "Guest User"}
                            </span>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">Online</span>
                            </div>
                        </div>
                    </div>

                    <div className="group relative flex items-center">
                        <Avatar className="h-9 w-9 ring-1 ring-white/10 transition-all duration-300 group-hover:ring-orange-500/50">
                            <AvatarImage src={user?.imageUrl} />
                            <AvatarFallback className="bg-zinc-900 text-xs text-zinc-400 font-medium">
                                {user?.firstName?.[0] || "U"}
                            </AvatarFallback>
                        </Avatar>

                        <SignOutButton>
                            <button className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 shadow-xl opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20">
                                <LogOut className="h-3 w-3" />
                            </button>
                        </SignOutButton>
                    </div>
                </div>
            </nav>

            {/* --- Main Content --- */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 -mt-10">

                <div className="w-full max-w-2xl space-y-10 text-center">

                    {/* Dashboard Headline */}
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50">
                            Meetings that actually <br />
                            lead to decisions.
                        </h1>
                        <p className="mx-auto max-w-lg text-base md:text-lg text-zinc-400 font-normal leading-relaxed">
                            Plan discussions with clear agendas and keep outcomes documented in one shared workspace.
                        </p>
                    </div>

                    {/* --- Action Area (Orange Theme Applied) --- */}
                    <div className="flex flex-col items-center justify-center gap-4 w-full max-w-md mx-auto">

                        {/* Input Group */}
                        <div className="relative w-full group perspective-1000">
                            {/* Orange ambient glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl opacity-0 group-focus-within:opacity-20 group-focus-within:blur-md transition-opacity duration-500" />

                            <div className="relative flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl p-1.5 transition-all duration-300 focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/20 shadow-2xl">
                                <div className="pl-4 text-zinc-500 group-focus-within:text-orange-400 transition-colors">
                                    <Keyboard className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="ENTER CODE"
                                    value={meetingCode}
                                    onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === "Enter" && handleJoinMeeting()}
                                    className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-600 focus:outline-none focus:ring-0 px-4 py-3 h-12 tracking-[0.15em] uppercase font-mono text-sm selection:bg-orange-500/30"
                                    disabled={isJoining}
                                />
                                <button
                                    onClick={handleJoinMeeting}
                                    disabled={!meetingCode.trim() || isJoining}
                                    className="h-10 px-5 rounded-lg bg-white text-black font-semibold text-sm hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-white/5"
                                >
                                    {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full my-2 opacity-50">
                            <div className="h-px bg-white/10 flex-1" />
                            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Or</span>
                            <div className="h-px bg-white/10 flex-1" />
                        </div>

                        {/* Create Button - Dark & Clean */}
                        <button
                            onClick={handleCreateMeeting}
                            disabled={isCreating}
                            className="group relative w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 active:scale-[0.99]"
                        >
                            {isCreating ? (
                                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 text-orange-400/80 group-hover:text-orange-400 transition-colors" />
                                    <span className="font-medium text-sm text-zinc-300 group-hover:text-white transition-colors">New Meeting</span>
                                </>
                            )}
                        </button>

                    </div>
                </div>

            </div>

            {/* --- Footer --- */}
            <div className="relative z-10 w-full py-6 border-t border-white/5 mt-auto">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-[11px] text-zinc-600 uppercase tracking-wider font-medium">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500/50"></div>
                        <span>Secure Systems Active</span>
                    </div>
                    <span>RealMeet v2.1</span>
                </div>
            </div>
        </main>
    );
}