
import { useState, useEffect, useRef } from 'react';
import { Bot, User, Check, Calendar, Loader2, Sparkles, Wand2, Download, Trash2, Mic, Clock, UserCheck, TrendingUp, Zap } from 'lucide-react';
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
    transcriptLines?: (TranscriptLine & { isFinal?: boolean })[];
    isAnalyzing?: boolean;
    analysisResult?: AnalysisResult | null;
    aiStream?: MediaStream | null; // Added Shadow Audio Stream
}

const NeuralWaveform = ({ stream }: { stream: MediaStream | null }) => {
    const [magnitudes, setMagnitudes] = useState<number[]>(new Array(12).fill(10));
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        if (!stream) return;

        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyzerRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyzerRef.current);
        analyzerRef.current.fftSize = 64;

        const bufferLength = analyzerRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const animate = () => {
            if (!analyzerRef.current) return;
            analyzerRef.current.getByteFrequencyData(dataArray);

            // Map frequencies to 12 bars
            const newMags = [];
            for (let i = 0; i < 12; i++) {
                const val = dataArray[i * 2] || 0;
                newMags.push(Math.max(10, (val / 255) * 40));
            }
            setMagnitudes(newMags);
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationRef.current);
            audioContextRef.current?.close();
        };
    }, [stream]);

    return (
        <div className="flex items-center gap-1 h-12 px-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md">
            {magnitudes.map((mag, i) => (
                <div
                    key={i}
                    className="w-1.5 bg-indigo-500/80 rounded-full transition-all duration-75"
                    style={{ height: `${mag}%` }}
                />
            ))}
            <span className="text-[10px] font-black text-indigo-400 ml-3 uppercase tracking-widest animate-pulse">Neural Path</span>
        </div>
    );
};

export default function AIAgentPanel({
    transcriptLines = [],
    isAnalyzing = false,
    analysisResult = null,
    aiStream = null
}: AIAgentPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcriptLines, isAnalyzing, analysisResult]);

    const priorityColor = {
        High: "text-rose-400 bg-rose-400/10 border-rose-400/20",
        Medium: "text-orange-400 bg-orange-400/10 border-orange-400/20",
        Low: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    };

    return (
        <div className="flex flex-col h-full bg-[#030303] text-zinc-100 relative overflow-hidden font-sans">
            {/* Background decoration */}
            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[50%] bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[100%] h-[40%] bg-purple-600/5 blur-[120px] pointer-events-none rounded-full" />


            {/* Agent Header - Premium Executive Style */}
            <div className="mx-4 mt-6 p-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl shrink-0 flex items-center justify-between shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)] ring-1 ring-white/20">
                        <Zap className="h-6 w-6 text-white animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-widest uppercase italic">Executive Assistant</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="relative flex h-2 w-2">
                                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isAnalyzing ? "bg-indigo-400" : "bg-emerald-500/30")}></span>
                                <span className={cn("relative inline-flex rounded-full h-2 w-2", isAnalyzing ? "bg-indigo-500" : "bg-emerald-500/50")}></span>
                            </span>
                            <span className={cn("text-[9px] font-bold tracking-[0.2em] uppercase", isAnalyzing ? "text-indigo-400 animate-pulse" : "text-zinc-500")}>
                                {isAnalyzing ? 'Processing Intelligence' : 'Listening Active'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 px-4">
                    <NeuralWaveform stream={aiStream} />
                </div>

                <div className="flex gap-2 relative z-10">
                    <button
                        onClick={() => onInjectMock?.("Team, let's schedule a follow-up meeting at 8am tomorrow to finalize the budget.")}
                        className="h-9 px-3 rounded-xl flex items-center justify-center gap-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40 transition-all duration-300 border border-indigo-500/30 font-bold text-[10px] uppercase tracking-wider"
                        title="Simulate Strategic Injection"
                    >
                        <Zap className="h-3 w-3" />
                        Inject Mock
                    </button>
                    <button className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white/10 text-zinc-400 hover:text-white transition-all duration-300 border border-transparent hover:border-white/10" title="System Stats">
                        <TrendingUp className="h-4 w-4" />
                    </button>
                    <button className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-white/10 text-zinc-400 hover:text-white transition-all duration-300 border border-transparent hover:border-white/10" title="Log Export">
                        <Download className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8 mt-2 scroll-smooth no-scrollbar" ref={scrollRef}>

                {/* Executive Summary (if call ended) */}
                {analysisResult && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-1000 slide-in-from-top-4">
                        <div className="p-5 rounded-2xl bg-linear-to-br from-indigo-500/10 via-black/40 to-black/60 border border-indigo-500/20 shadow-xl relative group">
                            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                <Sparkles className="h-12 w-12 text-indigo-400/50" />
                            </div>
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                                <Wand2 className="h-3 w-3" />
                                Executive Synopsis
                            </h4>
                            <p className="text-sm text-zinc-100 leading-relaxed font-medium italic select-none">
                                &quot;{analysisResult.summary}&quot;
                            </p>

                            {/* Key Decisions Badge List */}
                            {analysisResult.keyDecisions.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {analysisResult.keyDecisions.map((decision, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                                            <Check className="h-2.5 w-2.5 text-emerald-500" />
                                            {decision}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {analysisResult.actionItems.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Project Roadmap</h4>
                                    <span className="text-[9px] text-zinc-600 font-bold">{analysisResult.actionItems.length} OBJECTIVES</span>
                                </div>
                                {analysisResult.actionItems.map((item, idx) => (
                                    <div key={idx} className="relative overflow-hidden bg-black/40 border border-white/5 rounded-2xl p-4 flex items-start gap-5 group hover:border-emerald-500/30 transition-all duration-500 hover:translate-x-1 shadow-lg shadow-black/50">
                                        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/10 shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                                            <Calendar className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <div className="space-y-2 flex-1 pt-0.5">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className={cn("text-[8px] font-black px-2 py-0 h-4 border-0 rounded-sm", priorityColor[item.priority] || priorityColor.Medium)}>
                                                    {item.priority} IMPACT
                                                </Badge>
                                                {item.dueDate && (
                                                    <span className="text-[9px] text-zinc-500 font-bold flex items-center gap-1 uppercase tracking-tighter">
                                                        <Clock className="h-2.5 w-2.5" />
                                                        DEADLINE: {item.dueDate}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-white font-bold tracking-tight">{item.task}</p>
                                            {item.assignee && (
                                                <div className="flex items-center gap-2 pt-1 border-t border-white/5 mt-2">
                                                    <UserCheck className="h-3 w-3 text-indigo-400/70" />
                                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">OWNER / <span className="text-indigo-400">{item.assignee}</span></span>
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
                    <div className="flex flex-col items-center justify-center h-full text-zinc-700 space-y-6 animate-pulse">
                        <div className="p-6 rounded-[2.5rem] bg-white/5 ring-1 ring-white/10 relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                            <Mic className="h-10 w-10 relative z-10 text-indigo-400" />
                        </div>
                        <div className="text-center space-y-1 relative z-10">
                            <p className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500">Awaiting Signal</p>
                            <p className="text-[10px] text-zinc-600 font-bold max-w-[180px]">Artificial Intelligence is connected and ready to analyze your conversation.</p>
                        </div>
                    </div>
                )}

                {/* Transcript Lines */}
                <div className="space-y-8">
                    {transcriptLines.map((msg, idx) => (
                        <div key={idx} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <div className="flex gap-4 group">
                                <div className="shrink-0 pt-1">
                                    <Avatar className="h-10 w-10 border border-white/10 rounded-2xl ring-2 ring-transparent group-hover:ring-indigo-500/20 transition-all duration-500 shadow-xl">
                                        <AvatarImage src={msg.avatar} />
                                        <AvatarFallback className="bg-zinc-900 text-[10px] text-zinc-500 font-black">
                                            {msg.userName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="flex-1 min-w-0 space-y-1.5">
                                    <div className="flex items-end justify-between px-1">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">{msg.userName}</span>
                                        <span className="text-[9px] text-zinc-700 font-bold tabular-nums">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-1.5 top-3 w-1.5 h-1.5 bg-zinc-900 border-l border-t border-white/5 rotate-[-45deg] z-10" />
                                        <p className="text-sm text-zinc-200 leading-relaxed bg-black/40 p-4 rounded-2xl rounded-tl-none border border-white/5 group-hover:border-white/10 transition-colors shadow-2xl backdrop-blur-md">
                                            {msg.text}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isAnalyzing && (
                    <div className="space-y-6 animate-pulse p-4 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                        <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Wand2 className="h-3 w-3 text-indigo-400" />
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Processing Synapses</span>
                                </div>
                                <p className="text-[11px] text-zinc-400 font-bold italic">
                                    Distilling conversation into strategic action items and executive summary...
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pl-2">
                            <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500/50 w-1/3 animate-[shimmer_2s_infinite]" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Overlay / Controls - Professional Status */}
            <div className="p-6 border-t border-white/10 bg-black/60 backdrop-blur-3xl shrink-0">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.8)]" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Neural Link SECURE</span>
                    </div>
                    <button className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black text-zinc-300 hover:text-white transition-all duration-300 uppercase tracking-[0.2em] group flex items-center gap-2">
                        <Bot className="h-3 w-3 text-indigo-400 group-hover:scale-110 transition-transform" />
                        Configure AI Agent
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
