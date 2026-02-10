import { MessageSquare, Paperclip, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: 'chat' | 'files';
    setActiveTab: (tab: 'chat' | 'files') => void;
    chatMessages: Array<{ sender: string, message: string, timestamp: Date, id: string }>;
    chatInput: string;
    setChatInput: (input: string) => void;
    onSendMessage: (message: string) => void;
    unreadCount: number;
}

export default function MeetingSidebar({
    isOpen,
    onClose,
    activeTab,
    setActiveTab,
    chatMessages,
    chatInput,
    setChatInput,
    onSendMessage,
    unreadCount
}: SidebarProps) {

    const handleSendMessage = () => {
        if (chatInput.trim()) {
            onSendMessage(chatInput);
            setChatInput('');
        }
    };

    return (
        <div className={cn(
            "absolute top-0 right-0 h-full z-30 transition-transform duration-300 ease-in-out flex flex-col",
            isOpen ? "translate-x-0" : "translate-x-full",
            "w-80 bg-black/60 backdrop-blur-xl border-l border-white/10"
        )}>
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={cn(
                            "relative px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'chat'
                                ? "bg-white/20 text-white"
                                : "text-white/60 hover:text-white hover:bg-white/10"
                        )}
                    >
                        <MessageSquare className="h-4 w-4 inline mr-2" />
                        Chat
                        {unreadCount > 0 && activeTab !== 'chat' && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === 'files'
                                ? "bg-white/20 text-white"
                                : "text-white/60 hover:text-white hover:bg-white/10"
                        )}
                    >
                        <Paperclip className="h-4 w-4 inline mr-2" />
                        Files
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <X className="h-4 w-4 text-white/70" />
                </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 flex flex-col min-h-0">
                {activeTab === 'chat' ? (
                    <>
                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                            {chatMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-white/40 text-sm">
                                    <MessageSquare className="h-8 w-8 mb-2" />
                                    <p>No messages yet</p>
                                    <p className="text-xs mt-1">Start chatting with your peer</p>
                                </div>
                            ) : (
                                chatMessages.map((msg) => {
                                    const isMe = msg.sender === 'You';
                                    return (
                                        <div key={msg.id} className={cn(
                                            "flex flex-col max-w-[85%] animate-in slide-in-from-bottom-2 fade-in duration-300",
                                            isMe ? "ml-auto items-end" : "mr-auto items-start"
                                        )}>
                                            <div className={cn(
                                                "p-3 rounded-2xl text-sm shadow-sm",
                                                isMe
                                                    ? "bg-indigo-600 text-white rounded-br-none"
                                                    : "bg-zinc-800 border border-white/10 text-zinc-100 rounded-bl-none"
                                            )}>
                                                {msg.message}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1 px-1">
                                                <span className="text-[10px] text-zinc-500 font-medium">{isMe ? "You" : msg.sender}</span>
                                                <span className="text-[10px] text-zinc-600">•</span>
                                                <span className="text-[10px] text-zinc-600">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Chat Input */}
                        <div className="p-4 border-t border-white/10 shrink-0">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    <Send className="h-4 w-4 text-white" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* File Sharing Tab */
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                            <div className="h-24 w-24 rounded-full bg-zinc-900/50 flex items-center justify-center border border-white/5 relative group">
                                <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Paperclip className="h-8 w-8 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-white mb-1">Share Resources</p>
                                <p className="text-xs text-zinc-500 max-w-[200px]">Securely share files with meeting participants.</p>
                            </div>

                            <button className="px-6 py-2.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5">
                                Browse Files
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
