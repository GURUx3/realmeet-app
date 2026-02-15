
import { useState, useEffect, useRef } from 'react';
import { Bot, User, Check, Calendar, Loader2, Sparkles, Wand2, Download, Trash2, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AgentMessage {
    id: string;
    type: 'user' | 'agent' | 'action';
    sender: string;
    content: string;
    timestamp: Date;
    avatar?: string;
    actionType?: 'calendar' | 'todo' | 'note';
}

export default function AIAgentPanel() {
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Hardcoded conversation sequence
    const sequence = [
        {
            delay: 1000,
            data: {
                type: 'user',
                sender: 'Guru',
                content: 'Hello everyone! 👋 Ready to discuss the new features?',
                avatar: 'https://github.com/shadcn.png'
            }
        },
        {
            delay: 2500,
            data: {
                type: 'user',
                sender: 'Zem',
                content: "Hey Guru! Yes, I'm all set. Everything is looking good on my end.",
                avatar: ''
            }
        },
        {
            delay: 4500,
            data: {
                type: 'user',
                sender: 'Kuhan',
                content: 'Hi Team! Today, we need to focus on implementing the Payment Gateway integration for our system safely.',
                avatar: ''
            }
        },
        {
            delay: 5500,
            action: 'start_analyzing'
        },
        {
            delay: 6500,
            data: {
                type: 'agent',
                sender: 'Agent',
                content: 'Processing conversation context...',
            }
        },
        {
            delay: 8500,
            data: {
                type: 'agent',
                sender: 'Agent',
                content: 'Identifying key action items regarding Payment Gateway...',
            }
        },
        {
            delay: 10000,
            data: {
                type: 'action',
                sender: 'Agent',
                content: 'Schedule "Payment Gateway Implementation" Kickoff',
                actionType: 'calendar'
            }
        },
        {
            delay: 11000,
            action: 'stop_analyzing'
        }
    ];

    useEffect(() => {
        let timeouts: NodeJS.Timeout[] = [];

        sequence.forEach(item => {
            const timeout = setTimeout(() => {
                if (item.action === 'start_analyzing') {
                    setIsAnalyzing(true);
                } else if (item.action === 'stop_analyzing') {
                    setIsAnalyzing(false);
                } else if (item.data) {
                    setMessages(prev => [...prev, {
                        id: Math.random().toString(36).substring(7),
                        timestamp: new Date(),
                        ...item.data
                    } as AgentMessage]);
                }
                // Scroll to bottom
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, item.delay);
            timeouts.push(timeout);
        });

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isAnalyzing]);


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
                                {isAnalyzing ? 'Active Listening' : 'Online'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-1 relative z-10">
                    <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors" title="Save Summary">
                        <Download className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors" title="Clear Context">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth" ref={scrollRef}>
                {messages.length === 0 && !isAnalyzing && (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-3 opacity-60">
                        <div className="p-4 rounded-full bg-white/5 ring-1 ring-white/5 mb-2">
                            <Mic className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-medium text-center">Waiting for speech...</p>
                        <p className="text-xs text-center max-w-[200px]">Start speaking to see real-time transcription and AI analysis.</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {msg.type === 'user' && (
                            <div className="flex gap-3 group">
                                <Avatar className="h-8 w-8 border border-white/10 mt-1 ring-2 ring-transparent group-hover:ring-white/10 transition-all">
                                    <AvatarImage src={msg.avatar} />
                                    <AvatarFallback className="bg-zinc-800 text-xs text-zinc-400 font-bold">
                                        {msg.sender[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-zinc-300">{msg.sender}</span>
                                        <span className="text-[10px] text-zinc-600 font-mono">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="relative">
                                        <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded-2xl rounded-tl-none border border-white/5 shadow-sm">
                                            {msg.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {msg.type === 'agent' && (
                            <div className="flex gap-3 pl-2 border-l-2 border-indigo-500/20 ml-3 py-1">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Wand2 className="h-3 w-3 text-indigo-400" />
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Thought Process</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-zinc-400/80 italic bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                                        <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        )}

                        {msg.type === 'action' && (
                            <div className="ml-8 mt-2 animate-in zoom-in-95 duration-500">
                                <div className="relative overflow-hidden bg-zinc-900/80 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-4 shadow-lg group hover:border-emerald-500/40 transition-colors">
                                    <div className="absolute top-0 right-0 p-2 opacity-50">
                                        <div className="w-16 h-16 bg-emerald-500/10 blur-xl rounded-full" />
                                    </div>

                                    <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                                        <Calendar className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <div className="space-y-1.5 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-500 uppercase tracking-wider border border-emerald-500/10">
                                                Action Item
                                            </span>
                                            <span className="text-[10px] text-zinc-500 font-mono">
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-white font-semibold leading-tight">{msg.content}</p>
                                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/80">
                                            <Check className="h-3 w-3" />
                                            <span>Automatically scheduled</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isAnalyzing && (
                    <div className="ml-11 flex items-center gap-1 py-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                )}
            </div>

            {/* Input Overlay / Controls - Optional improvement */}
            <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
                <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-medium text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2 group">
                    <Sparkles className="h-3 w-3 text-indigo-400 group-hover:animate-spin" />
                    Ask AI Follow-up...
                </button>
            </div>
        </div>
    );
}
