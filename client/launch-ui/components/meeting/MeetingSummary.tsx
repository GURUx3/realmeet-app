import { useEffect, useRef, useState } from "react";
import { Download, FileText, LayoutDashboard, Loader2, Sparkles, User, Check, Copy, UserCheck, Calendar as CalendarIcon, Clock } from "lucide-react";
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

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl text-white">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/10 border border-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.2)] mb-8">
                    <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold bg-linear-to-r from-white to-white/60 bg-clip-text text-transparent">Analyzing Meeting...</h2>
                <p className="text-zinc-500 mt-2">Generating AI insights and transcripts</p>
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
                        <Card className="bg-zinc-900/50 border-white/10 backdrop-blur-md overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-orange-500 to-purple-500" />
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-white">
                                    <FileText className="h-5 w-5 text-orange-500" />
                                    Executive Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-zinc-300 leading-relaxed">
                                {analysis ? analysis.summary : "No AI summary available."}
                            </CardContent>
                        </Card>

                        {/* Action Items */}
                        <Card className="bg-zinc-900/50 border-white/10 backdrop-blur-md">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg text-white flex items-center gap-2">
                                    <Check className="h-5 w-5 text-emerald-500" />
                                    Actionable Tasks
                                </CardTitle>
                                {analysis?.actionItems && analysis.actionItems.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={copyTasksAsMarkdown}
                                        className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 hover:text-white hover:bg-white/5"
                                    >
                                        {hasCopiedTasks ? <Check className="h-3 w-3 mr-2" /> : <Copy className="h-3 w-3 mr-2" />}
                                        {hasCopiedTasks ? "Copied" : "Copy All Tasks"}
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
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

                            <Card className="bg-zinc-900/50 border-white/10 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="text-lg text-white">Sentiment</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {analysis ? (
                                        <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider ${sentimentColor[analysis.sentiment] || sentimentColor.Neutral}`}>
                                            {analysis.sentiment}
                                        </div>
                                    ) : (
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${sentimentColor.Neutral}`}>
                                            Neutral
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Downloads */}
                        <Card className="bg-zinc-900/80 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">Transcripts</CardTitle>
                                <CardDescription className="text-zinc-500">Download recording data</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    className="w-full bg-white text-black hover:bg-zinc-200 justify-between h-12"
                                    onClick={() => window.open(getDownloadLink(fileUrls.combined), '_blank')}
                                >
                                    <span className="flex items-center gap-2 font-bold">
                                        <FileText className="h-4 w-4" />
                                        Combined Transcript
                                    </span>
                                    <Download className="h-4 w-4 opacity-50" />
                                </Button>

                                <Separator className="bg-white/10" />

                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Individual Streams</p>
                                    <ScrollArea className="h-[120px] w-full pr-4">
                                        <div className="space-y-2">
                                            {fileUrls.individual.map((file, i) => (
                                                <Button
                                                    key={i}
                                                    variant="outline"
                                                    className="w-full justify-between items-center border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white h-10"
                                                    onClick={() => window.open(getDownloadLink(file.url), '_blank')}
                                                >
                                                    <span className="flex items-center gap-2 truncate text-xs">
                                                        <User className="h-3 w-3" />
                                                        <span className="truncate max-w-[120px]">{file.userName}</span>
                                                    </span>
                                                    <Download className="h-3 w-3 opacity-50" />
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
