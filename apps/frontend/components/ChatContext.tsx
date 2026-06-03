"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/components/Providers";

export interface ChatMessage {
    id: string;
    sender: string;
    content: string;
    isPrivate: boolean;
    recipientId?: string;
    threadId?: string;
    timestamp: Date;
}

interface ChatContextType {
    messages: ChatMessage[];
    activeTargetUser: { id: string; username: string } | null;
    sendChatMessage: (content: string) => void;
    setPrivateChatTarget: (user: { id: string; username: string } | null) => void;
    activeThreadId: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activeTargetUser, setActiveTargetUser] = useState<{ id: string; username: string } | null>(null);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (isLoading || !isAuthenticated) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setActiveThreadId(null);
            return;
        }

        const token = sessionStorage.getItem("auth.accessToken");
        if (!token) return;

        const hostUrl = typeof window !== "undefined"
            ? `${window.location.protocol}//${window.location.hostname}:8080`
            : "http://localhost:8080";

        const initializeThreadAndSocket = async () => {
            try {
                const response = await fetch(`${hostUrl}/api/chats`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const rawPayload = await response.json();
                console.log("=== CHAT API RAW PAYLOAD ===", rawPayload);

                // Safe Array Normalization
                let channelsArray: any[] = [];
                if (Array.isArray(rawPayload)) {
                    channelsArray = rawPayload;
                } else if (rawPayload && typeof rawPayload === 'object') {
                    channelsArray = rawPayload.items || rawPayload.data || rawPayload.threads || [];
                }

                const globalChannel = channelsArray.find((c: any) =>
                    c.type === "GLOBAL" || c.thread?.type === "GLOBAL"
                );

                // Use the static target UUID as a fallback if list is slow to update
                const targetUuid: string = globalChannel?.chatThreadId || globalChannel?.id || globalChannel?.threadId || "99999999-9999-9999-9999-999999999999";

                console.log(`Global Thread UUID activated: ${targetUuid}`);
                setActiveThreadId(targetUuid);

                const socket = io("http://localhost:8080", {
                    path: "/social/socket.io",
                    transports: ["websocket"],
                    auth: {
                        token: `Bearer ${token}`
                    }
                });
                socketRef.current = socket;

                setMessages([
                    {
                        id: "sys-init",
                        sender: "System",
                        content: "Welcome to the channel lounge! Be respectful to other worms.",
                        isPrivate: false,
                        timestamp: new Date()
                    }
                ]);

                socket.on("presence.updated", (data) => {
                    if (data.status === "ONLINE") {
                        console.log(`Successfully authenticated! Synchronizing with thread: ${targetUuid}`);
                        socket.emit("thread.join", { threadId: targetUuid });
                    }
                });

                socket.on("message.created", (backendMessage) => {
                    setMessages((prev) => {
                        const isDuplicate = prev.some(
                            (msg) => msg.id === backendMessage.clientMessageId || msg.id === backendMessage.id
                        );
                        if (isDuplicate) return prev;

                        return [...prev, {
                            id: backendMessage.id || crypto.randomUUID(),
                            sender: backendMessage.username || backendMessage.senderUserId || backendMessage.userId || "Another Worm",
                            content: backendMessage.content,
                            isPrivate: false,
                            timestamp: new Date(backendMessage.createdAt || Date.now())
                        }];
                    });
                });

                socket.on("disconnect", (reason) => {
                    console.warn("Socket disconnected from server. Reason:", reason);
                });

            } catch (err) {
                console.error("Failed to dynamically bootstrap chat channels:", err);
            }
        };

        void initializeThreadAndSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isAuthenticated, isLoading]);

    const sendChatMessage = (content: string) => {
        if (!content.trim() || !socketRef.current || !activeThreadId) return;

        const localUuid = crypto.randomUUID();

        const newMessage: ChatMessage = {
            id: localUuid,
            sender: user?.username || "You",
            content: content.trim(),
            isPrivate: false,
            recipientId: activeTargetUser?.id,
            threadId: activeThreadId,
            timestamp: new Date()
        };

        setMessages((prev) => [...prev, newMessage]);

        socketRef.current.emit("thread.message", {
            threadId: activeThreadId,
            content: content.trim(),
            clientMessageId: localUuid
        });
    };

    const setPrivateChatTarget = (user: { id: string; username: string } | null) => {
        setActiveTargetUser(user);
    };

    return (
        <ChatContext.Provider value={{ messages, activeTargetUser, sendChatMessage, setPrivateChatTarget, activeThreadId }}>
            {children}
        </ChatContext.Provider>
    );
}

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChat must be used within a ChatProvider");
    return context;
};