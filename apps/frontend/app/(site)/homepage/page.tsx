"use client";

import { useState, useRef, useEffect } from "react";
import BattleArena from "@/components/BattleArena";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useChat } from "@/components/ChatContext";
import {useAuth} from "@/components/Providers";

export default function HomePage() {
    const { messages, activeTargetUser, sendChatMessage, setPrivateChatTarget } = useChat();
    const { user } = useAuth();
    const [inputMessage, setInputMessage] = useState("");
    const messageContainerRef = useRef<HTMLDivElement>(null);

    //auto scroll when new chat message arrive
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages, activeTargetUser]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        sendChatMessage(inputMessage);
        setInputMessage("");
    };

    return (
        <ProtectedRoute>
            <div className="max-w-7xl mx-auto p-4 md:p-8 h-[calc(100vh-80px)] flex flex-col gap-6">

                {/* Command Center Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase">Command Center</h1>
                        <p className="text-zinc-500 text-sm">Welcome back, Commander. Your squad is ready.</p>
                    </div>
                </div>

                {/* Main Content , big game button*/}
                <div className="flex flex-col lg:flex-row gap-6 grow overflow-hidden">
                    <BattleArena className="bg-zinc-100 dark:bg-zinc-900" border={true} dashed={true}/>

                    {/* Chat Window Component */}
                    <div className="flex-1 min-w-[320px] flex flex-col bg-white dark:bg-zinc-900 rounded-3xl border border-foreground/10 shadow-sm overflow-hidden">

                        {/* Context-Aware Header */}
                        <div className="p-4 border-b border-foreground/5 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${activeTargetUser ? "bg-purple-500 animate-pulse" : "bg-green-500"}`}></span>
                                {activeTargetUser ? `DM: @${activeTargetUser.username}` : "Global Chat"}
                            </h3>
                            {activeTargetUser ? (
                                <button
                                    onClick={() => setPrivateChatTarget(null)}
                                    className="text-[10px] uppercase tracking-wider bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 px-2.5 py-1 rounded-md font-bold transition-colors"
                                >
                                    Exit PM
                                </button>
                            ) : (
                                <span className="text-[10px] font-mono opacity-50">GLOBAL CHAT</span> // change later
                            )}
                        </div>

                        {/* Message Target Window */}
                        <div
                            ref={messageContainerRef}
                            className="flex-grow p-4 space-y-4 overflow-y-auto font-medium scroll-smooth"
                        >
                            {messages
                                // Differentiate between global and private chat
                                .filter(msg => {
                                    if (activeTargetUser) {
                                        return msg.isPrivate && (msg.recipientId === activeTargetUser.id || msg.sender === activeTargetUser.username);
                                    }
                                    return !msg.isPrivate;
                                })
                                .map((msg) => {
                                    const isSystem = msg.sender === "System";
                                    const isMe =
                                        msg.sender === "You" ||
                                        (user?.username && msg.sender === user.username) ||
                                        (user?.email && msg.sender === user.email) ||
                                        (user?.email && msg.sender === user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)); // Handles "Stefan" vs "stefan@example.com"

                                    const displaySender = isMe ? "You" : msg.sender;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
                                        >
                                            <span className={`text-[10px] font-bold px-1 ${
                                                isSystem ? "text-blue-500" : isMe ? "text-zinc-400 mr-1" : "text-purple-500 ml-1"
                                            }`}>
                                                {displaySender}
                                            </span>
                                            <div className={`p-3 text-sm rounded-2xl max-w-[85%] break-words ${
                                                isSystem
                                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-tl-none italic"
                                                    : isMe
                                                        ? "bg-blue-600 text-white rounded-tr-none"
                                                        : "bg-zinc-100 dark:bg-zinc-800 rounded-tl-none"
                                            }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Chat Input Handling */}
                        <div className="p-4 border-t border-foreground/5">
                            <form className="flex gap-2" onSubmit={handleFormSubmit}>
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder={activeTargetUser ? `Send private message to @${activeTargetUser.username}...` : "Type a message..."}
                                    className="flex-grow p-2 px-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                />
                                <button
                                    type="submit"
                                    className="p-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shrink-0"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925L10.79 10l-7.097 1.836-1.414 4.925a.75.75 0 0 0 .826.95 44.898 44.898 0 0 0 15.891-8.113.75.75 0 0 0 0-1.2l-15.89-8.113Z"/>
                                    </svg>
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}