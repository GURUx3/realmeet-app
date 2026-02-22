
import { useState, useEffect, useRef } from 'react';
import { Bot, User, Check, Calendar, Loader2, Sparkles, Wand2, Download, Trash2, Mic, Clock, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ActionItem {
    task: string;
    assignee?: string;
    priority: 'High' | 'Medium' | 'Low';
    dueDate?: string;
}

interface AnalysisResult {
    summary: string;
    actionItems: ActionItem[];
    keyDecisions: string[];
    keyTopics: string[];
    sentiment: 'Positive' | 'Neutral' | 'Negative';
}

interface TranscriptLine {
    userId: string;
    userName: string;
    text: string;
    timestamp: number;
    avatar?: string;
}

interface AIAgentPanelProps {
    transcriptLines?: TranscriptLine[];
    isAnalyzing?: boolean;
    analysisResult?: AnalysisResult | null;
}

export default function AIAgentPanel({
    transcriptLines = [],
    isAnalyzing = false,
    analysisResult = null
}: AIAgentPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcriptLines, isAnalyzing, analysisResult]);

    const priorityColor = {
        High: "text-red-400 bg-red-400/10 border-red-400/20",
        Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
        Low: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    };

    return (
        <div className="flex flex-col h-full bg-linear-to-b from-black/40 to-black/60 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[50%] bg-indigo-500/5 blur-[100px] pointer-events-none rounded-full" />


            {/* Agent Header - Floating Style */}
            <div className="mx-4 mt-4 p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-md shrink-0 flex items-center justify-between shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="flex items-center gap-3 relative z-10">
                    <div className="h-10 w-10 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
                        <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">AI Assistant</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isAnalyzing ? "bg-emerald-400" : "bg-emerald-500/30")}></span>
                                <span className={cn("relative inline-flex rounded-full h-2 w-2", isAnalyzing ? "bg-emerald-500" : "bg-emerald-500/50")}></span>
                            </span>
                            <span className={cn("text-[10px] font-medium tracking-wider uppercase", isAnalyzing ? "text-emerald-400 animate-pulse" : "text-zinc-500")}>
                                {isAnalyzing ? 'Analyzing Call...' : 'Active Listening'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-1 relative z-10">
                    <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Save Summary">
                        <Download className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth" ref={scrollRef}>

                {/* Analysis Results (if call ended) */}
                {analysisResult && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Sparkles className="h-3 w-3" />
                                Executive Summary
                            </h4>
                            <p className="text-sm text-zinc-300 leading-relaxed">{analysisResult.summary}</p>
                        </div>

                        {analysisResult.actionItems.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest px-1">Action Items</h4>
                                {analysisResult.actionItems.map((item, idx) => (
                                    <div key={idx} className="relative overflow-hidden bg-zinc-900/80 border border-white/5 rounded-xl p-4 flex items-start gap-4 group hover:border-white/10 transition-colors">
                                        <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/10 shrink-0">
                                            <Calendar className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={cn("text-[9px] uppercase tracking-tighter h-5", priorityColor[item.priority] || priorityColor.Medium)}>
                                                    {item.priority}
                                                </Badge>
                                                {item.dueDate && (
                                                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {item.dueDate}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-white font-semibold leading-tight">{item.task}</p>
                                            {item.assignee && (
                                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                                    <UserCheck className="h-3 w-3" />
                                                    <span>Assigned to: <span className="text-indigo-400 font-medium">{item.assignee}</span></span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {transcriptLines.length === 0 && !isAnalyzing && !analysisResult && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-3 opacity-60">
                        <div className="p-4 rounded-full bg-white/5 ring-1 ring-white/5 mb-2">
                            <Mic className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-medium text-center">Waiting for speech...</p>
                        <p className="text-xs text-center max-w-[200px]">Start speaking to see real-time transcription and AI analysis.</p>
                    </div>
                )}

                {/* Transcript Lines */}
                <div className="space-y-6">
                    {transcriptLines.map((msg, idx) => (
                        <div key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex gap-3 group">
                                <Avatar className="h-8 w-8 border border-white/10 mt-1 ring-2 ring-transparent group-hover:ring-white/10 transition-all">
                                    <AvatarImage src={msg.avatar} />
                                    <AvatarFallback className="bg-zinc-800 text-xs text-zinc-400 font-bold">
                                        {msg.userName[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-zinc-300">{msg.userName}</span>
                                        <span className="text-[10px] text-zinc-600 font-mono">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded-2xl rounded-tl-none border border-white/5 shadow-sm">
                                            {msg.text}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isAnalyzing && (
                    <div className="space-y-4 animate-pulse">
                        <div className="flex gap-3 pl-2 border-l-2 border-indigo-500/20 ml-3 py-1">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Wand2 className="h-3 w-3 text-indigo-400" />
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Thought Process</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-zinc-400/80 italic bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                                    <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                                    Analyzing meeting transcript and extracting action items...
                                </div>
                            </div>
                        </div>
                        <div className="ml-11 flex items-center gap-1 py-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Overlay / Controls - Optional improvement */}
            <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
                <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-medium text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2 group">
                    <Sparkles className="h-3 w-3 text-indigo-400 group-hover:animate-spin" />
                    AI Agent Active
                </button>
            </div>
        </div>
    );
}
