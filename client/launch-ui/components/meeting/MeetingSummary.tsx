import { useEffect, useRef } from "react";
import { Download, FileText, LayoutDashboard, Loader2, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface AnalysisResult {
    summary: string;
    actionItems: string[];
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

    const sentimentColor = {
        Positive: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        Neutral: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        Negative: "bg-red-500/10 text-red-500 border-red-500/20",
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
            link.download = 'meeting-transcript.txt'; // Browser might ignore this for cross-origin but good to have
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [isLoading, fileUrls]);

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

    if (!analysis || !fileUrls) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505] overflow-y-auto p-4 md:p-8">
            <div className="w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400 mb-2">
                        <Sparkles className="h-3 w-3 text-purple-400" />
                        <span>AI Analysis Complete</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Meeting Summary</h1>
                    <p className="text-zinc-400 text-lg">Here's what happened in your session</p>
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
                                {analysis.summary}
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Action Items */}
                            <Card className="bg-zinc-900/50 border-white/10 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="text-lg text-white">Action Items</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {analysis.actionItems.map((item, i) => (
                                            <li key={i} className="flex gap-3 items-start text-sm text-zinc-300">
                                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Topics & Sentiment */}
                            <div className="space-y-6">
                                <Card className="bg-zinc-900/50 border-white/10 backdrop-blur-md">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-white">Key Topics</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-wrap gap-2">
                                        {analysis.keyTopics.map((topic, i) => (
                                            <Badge key={i} variant="secondary" className="bg-white/10 text-zinc-200 hover:bg-white/20">
                                                {topic}
                                            </Badge>
                                        ))}
                                    </CardContent>
                                </Card>

                                <Card className="bg-zinc-900/50 border-white/10 backdrop-blur-md">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-white">Sentiment</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${sentimentColor[analysis.sentiment] || sentimentColor.Neutral}`}>
                                            {analysis.sentiment}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Downloads & Actions */}
                    <div className="space-y-6">
                        <Card className="bg-zinc-900/80 border-white/10 h-full">
                            <CardHeader>
                                <CardTitle className="text-white">Transcripts</CardTitle>
                                <CardDescription className="text-zinc-500">Download recording data</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    className="w-full bg-white text-black hover:bg-zinc-200 justify-between h-12"
                                    onClick={() => window.open(getDownloadLink(fileUrls.combined), '_blank')}
                                >
                                    <span className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Combined Transcript
                                    </span>
                                    <Download className="h-4 w-4 opacity-50" />
                                </Button>

                                <Separator className="bg-white/10" />

                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Individual Streams</p>
                                    <ScrollArea className="h-[200px] w-full pr-4">
                                        <div className="space-y-2">
                                            {fileUrls.individual.map((file, i) => (
                                                <Button
                                                    key={i}
                                                    variant="outline"
                                                    className="w-full justify-between items-center border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
                                                    onClick={() => window.open(getDownloadLink(file.url), '_blank')}
                                                >
                                                    <span className="flex items-center gap-2 truncate">
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
                            className="w-full h-14 text-lg font-medium shadow-lg shadow-red-900/20"
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
