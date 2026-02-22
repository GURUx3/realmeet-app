import { useEffect, useRef, useState } from "react";
import { Download, FileText, LayoutDashboard, Loader2, Sparkles, User, Check, Copy, UserCheck, Calendar as CalendarIcon, Clock, Bot, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

interface FileUrls {
    combined: string;
    json: string;
    individual: {
        userId: string;
        userName: string;
        url: string;
    }[];
}

interface MeetingSummaryProps {
    analysis: AnalysisResult | null;
    fileUrls: FileUrls | null;
    isLoading: boolean;
}

export function MeetingSummary({ analysis, fileUrls, isLoading }: MeetingSummaryProps) {
    const router = useRouter();
    const hasDownloaded = useRef(false);
    const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
    const [hasCopiedTasks, setHasCopiedTasks] = useState(false);

    const sentimentColor = {
        Positive: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        Neutral: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        Negative: "bg-red-500/10 text-red-500 border-red-500/20",
    };

    const priorityColor = {
        High: "text-red-400 bg-red-400/10 border-red-400/20",
        Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
        Low: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    };

    // Construct full URL including API base if needed, or relative
    const getDownloadLink = (path: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        return `${baseUrl}${path}`;
    };

    // Auto-download effect
    useEffect(() => {
        if (!isLoading && fileUrls?.combined && !hasDownloaded.current) {
            hasDownloaded.current = true;
            const link = document.createElement('a');
            link.href = getDownloadLink(fileUrls.combined);
            link.download = 'meeting-transcript.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [isLoading, fileUrls]);

    const toggleTask = (idx: number) => {
        const newSet = new Set(completedTasks);
        if (newSet.has(idx)) newSet.delete(idx);
        else newSet.add(idx);
        setCompletedTasks(newSet);
    };

    const copyTasksAsMarkdown = () => {
        if (!analysis?.actionItems) return;

        const markdown = analysis.actionItems.map(item => {
            const priority = `[Priority: ${item.priority}]`;
            const assignee = item.assignee ? ` @${item.assignee}` : '';
            const dueDate = item.dueDate ? ` (Due: ${item.dueDate})` : '';
            return `- [ ] **${item.task}** ${priority}${assignee}${dueDate}`;
        }).join('\n');

        const header = `# Meeting Action Items\n**Meeting Date:** ${new Date().toLocaleDateString()}\n\n`;
        navigator.clipboard.writeText(header + markdown);

        setHasCopiedTasks(true);
        setTimeout(() => setHasCopiedTasks(false), 2000);
    };

    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        if (isLoading) {
            const timer = setInterval(() => {
                setCountdown(prev => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        } else {
            setCountdown(10);
        }
    }, [isLoading]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/95 backdrop-blur-2xl">
                <div className="max-w-md w-full p-8 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="relative mx-auto w-32 h-32">
                        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <div className="absolute inset-4 rounded-full border border-indigo-500/10 animate-[pulse_2s_infinite]" />
                        <div className="absolute inset-0 flex items-center justify-center font-mono text-3xl font-black text-indigo-400">
                            {countdown}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest italic flex items-center justify-center gap-3">
                            <Bot className="h-6 w-6 text-indigo-400" />
                            Neural Intelligence
                        </h2>
                        <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                            Finalizing strategic insights, extracting actionable roadmap elements, and securing meeting artifacts...
                        </p>
                    </div>

                    <div className="flex justify-center gap-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-1.5 w-12 rounded-full bg-zinc-800 overflow-hidden">
                                <div className="h-full bg-indigo-500 animate-[loading_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.3}s` }} />
                            </div>
                        ))}
                    </div>
                </div>
                <style jsx>{`
                    @keyframes loading {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                `}</style>
            </div>
        );
    }
    if (!fileUrls) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505] overflow-y-auto p-4 md:p-8">
            <div className="w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400 mb-2">
                        <Sparkles className="h-3 w-3 text-purple-400" />
                        <span>AI Analysis Complete</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Meeting Summary</h1>
                    <p className="text-zinc-400 text-lg">Here&apos;s what happened in your session</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Col: Analysis */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Executive Summary */}
                        <Card className="bg-black/60 border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-orange-500 via-purple-500 to-indigo-500" />
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-3 text-white text-xl font-black italic uppercase tracking-tighter">
                                    <TrendingUp className="h-6 w-6 text-orange-500" />
                                    Executive synopsis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-zinc-200 text-lg leading-relaxed font-medium italic py-6 select-none bg-linear-to-b from-white/5 to-transparent rounded-lg mx-6 mb-6">
                                &quot;{analysis ? analysis.summary : "Strategic data acquisition pending finalization."}&quot;
                            </CardContent>
                        </Card>

                        <Card className="bg-black/80 border-white/10 backdrop-blur-xl shadow-2xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/5">
                                <div>
                                    <CardTitle className="text-xl text-white font-black uppercase tracking-widest flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-emerald-400" />
                                        Meeting Roadmap
                                    </CardTitle>
                                    <CardDescription className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">High-Impact Actionable Objectives</CardDescription>
                                </div>
                                {analysis?.actionItems && analysis.actionItems.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={copyTasksAsMarkdown}
                                        className="h-8 rounded-full border-white/10 hover:bg-white/5 text-[9px] uppercase font-black tracking-widest text-zinc-400 hover:text-white"
                                    >
                                        {hasCopiedTasks ? <Check className="h-3 w-3 mr-2" /> : <Copy className="h-3 w-3 mr-2" />}
                                        {hasCopiedTasks ? "SECURED" : "EXPORT ROADMAP"}
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="pt-8 px-6">
                                <div className="space-y-4">
                                    {analysis?.actionItems?.length ? analysis.actionItems.map((item, i) => (
                                        <div
                                            key={i}
                                            onClick={() => toggleTask(i)}
                                            className={cn(
                                                "flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-black/40 cursor-pointer transition-all hover:border-white/10 group",
                                                completedTasks.has(i) && "opacity-50 grayscale"
                                            )}
                                        >
                                            <div className={cn(
                                                "mt-1 h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                                                completedTasks.has(i) ? "bg-emerald-500 border-emerald-500" : "border-zinc-700 bg-zinc-900 group-hover:border-zinc-500"
                                            )}>
                                                {completedTasks.has(i) && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            <div className="flex-1 space-y-2">
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
                                                <p className={cn("text-sm transition-all", completedTasks.has(i) ? "text-zinc-500 line-through" : "text-white font-medium")}>
                                                    {item.task}
                                                </p>
                                                {item.assignee && (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                                        <UserCheck className="h-3 w-3" />
                                                        <span>Assigned to: <span className="text-indigo-400 font-medium">{item.assignee}</span></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )) : <div className="text-zinc-500 italic text-center py-8">No action items detected.</div>}
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* Right Col: Metadata & Downloads */}
                    <div className="space-y-6">
                        {/* Topics & Sentiment */}
                        <div className="grid grid-cols-1 gap-6">
                            <Card className="bg-zinc-900/50 border-white/10 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="text-lg text-white">Key Topics</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-2">
                                    {analysis?.keyTopics?.length ? analysis.keyTopics.map((topic, i) => (
                                        <Badge key={i} variant="secondary" className="bg-white/10 text-zinc-200 hover:bg-white/20">
                                            {topic}
                                        </Badge>
                                    )) : <span className="text-zinc-500 italic">No topics found.</span>}
                                </CardContent>
                            </Card>

                            <Card className="bg-black/60 border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Neural Sentiment</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {analysis ? (
                                        <div className={cn(
                                            "inline-flex items-center px-5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] shadow-lg",
                                            sentimentColor[analysis.sentiment] || sentimentColor.Neutral
                                        )}>
                                            <Sparkles className="h-3 w-3 mr-2" />
                                            {analysis.sentiment} Alignment
                                        </div>
                                    ) : (
                                        <div className={`inline-flex items-center px-5 py-2 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500`}>
                                            Acquiring Logic...
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Downloads */}
                        <Card className="bg-linear-to-br from-zinc-900/80 to-black border-white/10 shadow-2xl relative">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-white text-lg font-black uppercase tracking-tight">Artifact retrieval</CardTitle>
                                <CardDescription className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Secure cloud downloads</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    className="w-full bg-white text-black hover:bg-zinc-100 justify-between h-14 rounded-2xl group transition-all active:scale-95"
                                    onClick={() => window.open(getDownloadLink(fileUrls.combined), '_blank')}
                                >
                                    <span className="flex items-center gap-3 font-black text-xs uppercase tracking-tighter">
                                        <FileText className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                        Complete Transcript
                                    </span>
                                    <Download className="h-4 w-4 opacity-50 text-indigo-900" />
                                </Button>

                                <Separator className="bg-white/5" />

                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4 px-1">Source Stream access</p>
                                    <ScrollArea className="h-[140px] w-full pr-4">
                                        <div className="space-y-2">
                                            {fileUrls.individual.map((file, i) => (
                                                <Button
                                                    key={i}
                                                    variant="ghost"
                                                    className="w-full justify-between items-center border border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white h-11 rounded-xl group transition-all"
                                                    onClick={() => window.open(getDownloadLink(file.url), '_blank')}
                                                >
                                                    <span className="flex items-center gap-3 truncate text-[10px] font-bold uppercase tracking-widest">
                                                        <User className="h-4 w-4 opacity-50 group-hover:text-indigo-400" />
                                                        <span className="truncate max-w-[120px]">{file.userName}</span>
                                                    </span>
                                                    <Download className="h-3 w-3 opacity-20 group-hover:opacity-100 transition-opacity" />
                                                </Button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </CardContent>
                        </Card>

                        <Button
                            variant="destructive"
                            className="w-full h-14 text-lg font-bold shadow-lg shadow-red-900/20 rounded-xl"
                            onClick={() => router.push('/dashboard')}
                        >
                            <LayoutDashboard className="mr-2 h-5 w-5" />
                            Return to Dashboard
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
