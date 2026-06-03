"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import EditProfileModal from "@/components/EditProfile";
import { useAuth } from "@/components/Providers";
import { authClient } from "@/src/core/api/auth/auth.client";
import { getMyProfile } from "@/src/core/api/profile/profile.client";
import { Pencil, UserCheck, UserX, Trash2 } from "lucide-react";
import { Achievements } from "@/components/Achievements";
import MatchHistory from "@/components/MatchHistory";
import { FaCrown, FaMedal, FaTrophy } from "react-icons/fa";

type TabType = 'Info' | 'Friends' | 'Clan' | 'Invitations' | 'Achievements' | 'Match History';

type MatchHistoryParticipant = {
    userId: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    isWinner?: boolean;
    kills: number;
    deaths: number;
};

type MatchHistoryEntry = {
    id: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
    duration?: number | null;
    createdAt: string;
    endedAt?: string | null;
    mode?: string | null;
    mapName?: string | null;
    score?: string | null;
    summary?: string | null;
    player: MatchHistoryParticipant;
    participants?: MatchHistoryParticipant[];
};

type PlayerStats = {
    level?: number;
    wins?: number;
    losses?: number;
    kills?: number;
    deaths?: number;
        matchHistory?: MatchHistoryEntry[];
    achievements?: Array<string | {
		id?: string;
		type?: string;
		name?: string;
		description?: string;
		icon?: string;
		xpReward?: number;
		points?: number;
		progress?: number;
		progressTarget?: number;
		achieved?: boolean;
		achievedAt?: string;
		meta?: Record<string, any>;
		}>;
};

type SocialProfile = {
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
};

type FriendUserItem = {
    userId: string;
    displayName: string | null;
    avatarFileId: string | null;
    presenceStatus?: string;
};

type FriendRequestItem = {
    id: string;
    fromUserId: string;
    message?: string | null;
    createdAt: string;
    fromUser?: {
        displayName: string | null;
    };
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function ProfilePage() {
    // Log when component mounts (after first render)

    const { user, setUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('Info');
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [profileReloadKey, setProfileReloadKey] = useState(0);
    const [profile, setProfile] = useState<SocialProfile | null>(null);
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);
    const [friends, setFriends] = useState<FriendUserItem[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);

    const [clans, setClans] = useState<unknown[]>([]);
    const [invites, setInvites] = useState<unknown[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    // search related states
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [requestPendingMap, setRequestPendingMap] = useState<Record<string, boolean>>({});

    // Compute displayName, avatarUrl, bio early so useEffect can access them
    const displayName = profile?.displayName || user?.displayName || user?.username || user?.email || "Unknown User";
    const avatarUrl = profile?.avatarUrl;
    const bio = profile?.bio;
    const level = stats?.level ?? 1;

    // Helper to extract common authorization headers
    const getAuthHeaders = useCallback(() => {
        const token = sessionStorage.getItem("auth.accessToken");
        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    }, []);

    // ✅ Define it at component level
    const loadProfileData = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const socialProfile = await getMyProfile();
            if (socialProfile.ok) setProfile(socialProfile.data);
            const me = await authClient.getMe();
            if (!me.ok) {
                setDataError(typeof me.error === "string" ? me.error : "Unable to load current user.");
                return;
            }
            const resolvedUser = me.data.user;
            const headers = getAuthHeaders();

            const [friendsRes, requestsRes, clansRes, invitesRes, statsRes] = await Promise.all([
                fetch(`${API_BASE}/friends/me`, { headers }),
                fetch(`${API_BASE}/friend-requests/incoming/me`, { headers }),
                fetch(`${API_BASE}/clans/me`, { headers }),
                fetch(`${API_BASE}/clans/me/invites`, { headers }),
                resolvedUser?.id ? fetch(`${API_BASE}/stats/user/${resolvedUser.id}`, { headers }) : Promise.resolve(null),
            ]);

            const safeJson = async (r: Response | null) => {
                if (r && r.ok) {
                    const json = await r.json();
                    return Array.isArray(json) ? json : [];
                }
                return [];
            };

            const safeObject = async <T,>(r: Response | null): Promise<T | null> => {
                if (r && r.ok) {
                    return (await r.json()) as T;
                }
                return null;
            };

            setFriends(await safeJson(friendsRes));
            setIncomingRequests(await safeJson(requestsRes));
            setClans(await safeJson(clansRes));
            setInvites(await safeJson(invitesRes));

            const statsObj = await safeObject<PlayerStats>(statsRes);
            if (statsObj) {
                setStats(statsObj);

                // Normalize match entries into the shape MatchHistory component expects
                const rawMatches = Array.isArray((statsObj as any).matchHistory) ? (statsObj as any).matchHistory : [];
                const normalized = rawMatches.map((entry: any) => {
                    const match = entry.match ?? entry;
                    const rawParticipants = match.matchParticipants ?? [];
                    const participants: MatchHistoryParticipant[] = rawParticipants.map((p: any) => ({
                        userId: p.userId,
                        displayName: p.displayName ?? null,
                        avatarUrl: p.avatarUrl ?? null,
                        isWinner: p.isWinner ?? false,
                        kills: p.kills ?? 0,
                        deaths: p.deaths ?? 0,
                    }));

                    // Try to locate the current user's participant snapshot, or fallback to first participant
                    let playerSnapshot: any = null;
                    if ((entry as any).player) {
                        playerSnapshot = (entry as any).player;
                    } else {
                        playerSnapshot = participants.find((p) => p.userId === (resolvedUser?.id)) ?? participants[0] ?? null;
                    }

                    const player: MatchHistoryParticipant = playerSnapshot
                        ? {
                              userId: playerSnapshot.userId ?? resolvedUser?.id ?? 'unknown',
                              displayName: playerSnapshot.displayName ?? (playerSnapshot.userId === resolvedUser?.id ? 'You' : null),
                              avatarUrl: playerSnapshot.avatarUrl ?? null,
                              isWinner: playerSnapshot.isWinner ?? false,
                              kills: playerSnapshot.kills ?? 0,
                              deaths: playerSnapshot.deaths ?? 0,
                          }
                        : {
                              userId: resolvedUser?.id ?? 'unknown',
                              displayName: 'You',
                              avatarUrl: null,
                              isWinner: false,
                              kills: 0,
                              deaths: 0,
                          };

                    return {
                        id: match.id,
                        status: match.status,
                        duration: match.duration ?? null,
                        createdAt: match.createdAt,
                        endedAt: match.endedAt ?? null,
                        mode: match.mode ?? null,
                        mapName: match.mapName ?? null,
                        score: match.score ?? null,
                        summary: match.summary ?? null,
                        player,
                        participants,
                    } as MatchHistoryEntry;
                });

                setMatchHistory(normalized);
            } else {
                setStats(null);
                setMatchHistory([]);
            }
        } catch (err) {
            console.error("Error loading profile social graphs", err);
        } finally {
            setIsLoadingData(false);
        }
    }, [getAuthHeaders]);

    console.log("stats: ", stats);
    useEffect(() => {
        // ✅ Now useEffect just calls it
        void loadProfileData();
    }, [loadProfileData]);

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (!val.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`${API_BASE}/users/search?query=${encodeURIComponent(val)}`, {
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.filter((u: any) => u.userId !== user?.id));
            }
        } catch (err) {
            console.error("Failed fetching users graph", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSendFriendRequest = async (targetUserId: string) => {
        try {
            const res = await fetch(`${API_BASE}/friend-requests`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ toUserId: targetUserId })
            });
            if (res.ok) {
                setRequestPendingMap(prev => ({ ...prev, [targetUserId]: true }));
                await loadProfileData();
            }
        } catch (err) {
            console.error("Failed to transmit friend request", err);
        }
    };

    const handleRequestAction = async (requestId: string, action: 'accept' | 'decline') => {
        try {
            const res = await fetch(`${API_BASE}/friend-requests/${requestId}/${action}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                // Refresh records seamlessly
                await loadProfileData();
            }
        } catch (err) {
            console.error(`Failed to ${action} friend request`, err);
        }
    };

    const handleUnfriend = async (friendId: string) => {
        if (!confirm("Are you sure you want to unfriend this player?")) return;

        try {
            const res = await fetch(`${API_BASE}/friends/${friendId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                await loadProfileData();
            }
        } catch (err) {
            console.error("Failed to terminate friendship structural link", err);
        }
    };

    const computedStats = useMemo(() => {
        const wins = stats?.wins ?? 0;
        const losses = stats?.losses ?? 0;
        const kills = stats?.kills ?? 0;
        const deaths = stats?.deaths ?? 0;
        const matches = wins + losses;
        const winRate = matches > 0 ? `${Math.round((wins / matches) * 100)}%` : "0%";
        const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? kills.toFixed(2) : "0.00";

        return {
            matches,
            winRate,
            kd,
            kills,
            deaths,
            wins,
        };
    }, [stats]);

    const achievementCount = stats?.achievements?.length ?? 0;

    const tabs: { name: TabType; icon: string }[] = [
        {name: 'Info', icon: '👤'},
        {name: 'Friends', icon: '👥'},
        {name: 'Clan', icon: '🛡️'},
        {name: 'Invitations', icon: '✉️'},
        {name: 'Achievements', icon: '🏆'},
        {name: 'Match History', icon: '📜'},
    ];

    return (
        <ProtectedRoute>
            <EditProfileModal
                open={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSaved={async () => {
                    // reload profile and related data after save
                    await loadProfileData();
                }}
                setProfile={setProfile}
                displayName={displayName}
                bio={bio ?? ""}
                email={user?.email ?? ""}
            />
            <div className="max-w-4xl mx-auto py-12 px-6">
                {dataError && (
                    <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                        {dataError}
                    </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {[
                        {label: "Matches", value: computedStats.matches.toString(), color: "text-blue-500"},
                        {label: "Win Rate", value: computedStats.winRate, color: "text-green-500"},
                        {label: "K/D Ratio", value: computedStats.kd, color: "text-red-500"},
                        {label: "Kills", value: computedStats.kills.toString(), color: "text-green-500"},
                        {label: "Deaths", value: computedStats.deaths.toString(), color: "text-red-500"},
                    ].map((stat) => (
                        <div key={stat.label}
                             className="bg-zinc-100 dark:bg-zinc-900/50 p-4 rounded-2xl border border-foreground/5">
                            <p className="text-[10px] uppercase font-bold text-zinc-500">{stat.label}</p>
                            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-8 md:flex-row md:items-stretch md:h-[calc(100vh-18rem)] md:max-h-[calc(100vh-18rem)]">
                    {/* LEFT: Sidebar Navigation */}
                    <div className="w-full md:w-64 flex flex-col gap-2 md:h-full md:self-stretch">
                        <div className="relative p-6 mb-4 bg-zinc-100 dark:bg-zinc-900 rounded-3xl text-center">
                            <button
                                type="button"
                                onClick={() => setIsEditOpen(true)}
                                className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:text-zinc-900 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                            >
                                <Pencil size={14} />
                                {/*Edit profile*/}
                            </button>
                            <div
                                className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl border-4 border-white dark:border-zinc-800 shadow-lg">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile avatar" className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    "🪱"
                                )}
                            </div>
                            <h2 className="font-black text-l">{displayName}</h2>
                            <p className="text-xs text-zinc-500 font-mono uppercase">Level {level} Recruit</p>
                        </div>

                        {tabs.map((tab) => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                                    activeTab === tab.name
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                                        : "bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.name}
                            </button>
                        ))}
                    </div>

                    {/* RIGHT: Content Display Area */}
                    <div className="flex-1 bg-white dark:bg-zinc-900 border border-foreground/5 rounded-3xl p-8 shadow-sm flex min-h-0 flex-col md:h-full md:self-stretch">
                        <h3 className="text-2xl font-black mb-6 border-b pb-4 border-foreground/5">
                            {activeTab}
                        </h3>

                        <div className="min-h-0 flex-1 space-y-4 pr-1 overflow-y-auto">
                            {activeTab === 'Info' && (
                                <div className="grid gap-4">
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                        <label className="text-[10px] uppercase font-bold text-zinc-400">Email Address</label>
                                        <p className="font-medium">{user?.email ?? "N/A"}</p>
                                    </div>
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                        <label className="text-[10px] uppercase font-bold text-zinc-400">Total Victories</label>
                                        <p className="font-medium">{computedStats.wins} Matches Won</p>
                                    </div>
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                        <label className="text-[10px] uppercase font-bold text-zinc-400">Bio</label>
                                        <p className="font-medium whitespace-pre-wrap">
                                            {bio?.trim() ? bio : "Recruit exploring the arena."}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                        {[
                                            {
                                                label: "Rank",
                                                value: `Lv ${level}`,
                                                icon: <FaCrown className="text-amber-500" />,
                                            },
                                            {
                                                label: "Wins",
                                                value: String(computedStats.wins),
                                                icon: <FaTrophy className="text-yellow-500" />,
                                            },
                                            {
                                                label: "Rewards",
                                                value: String(achievementCount),
                                                icon: <FaMedal className="text-emerald-500" />,
                                            },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center gap-3 rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-950/40">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg dark:bg-zinc-800">
                                                    {item.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{item.label}</p>
                                                    <p className="truncate text-sm font-black text-zinc-900 dark:text-zinc-50">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Friends' && (
                                <div className="space-y-6">
                                    {/* New Player Search Section */}
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-foreground/5">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-2">Find Battle Buddies</h4>
                                        <input
                                            type="text"
                                            placeholder="Search by username or email..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />

                                        {/* Search Results Dropdown/List */}
                                        {searchQuery.trim() !== "" && (
                                            <div className="mt-3 space-y-2 border-t pt-3 border-foreground/5 max-h-48 overflow-y-auto">
                                                {isSearching ? (
                                                    <p className="text-xs text-zinc-500 italic">Scanning arena...</p>
                                                ) : searchResults.length === 0 ? (
                                                    <p className="text-xs text-zinc-500 italic">No recruits found matching "{searchQuery}"</p>
                                                ) : (
                                                    searchResults.map((searchUser) => (
                                                        <div key={searchUser.userId} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-900 shadow-sm border border-foreground/5 text-sm">
                                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                    {searchUser.displayName || "Unknown Recruit"}
                                </span>

                                                            {requestPendingMap[searchUser.userId] ? (
                                                                <span className="text-xs font-semibold text-zinc-400 italic bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                                        Sent!
                                    </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleSendFriendRequest(searchUser.userId)}
                                                                    className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition"
                                                                >
                                                                    Add Friend
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Pending Request */}
                                    {incomingRequests.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-3">Pending Battle Invites ({incomingRequests.length})</h4>
                                            <div className="space-y-2">
                                                {incomingRequests.map((req) => (
                                                    <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
                                                        <div>
                                                            <span className="font-bold">{req.fromUser?.displayName || "Unknown Recruiter"}</span>
                                                            {req.message && <p className="text-xs text-zinc-400 italic mt-0.5">"{req.message}"</p>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => handleRequestAction(req.id, 'accept')} className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500 transition" title="Accept Invite">
                                                                <UserCheck size={16} />
                                                            </button>
                                                            <button onClick={() => handleRequestAction(req.id, 'decline')} className="p-1.5 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition" title="Decline Invite">
                                                                <UserX size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Approved Active Buddies */}
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Active Buddies</h4>
                                        {friends.length === 0 ? (
                                            <div className="text-center py-12 text-zinc-500 italic">
                                                You haven't added any battle buddies yet.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {friends.map((friend) => (
                                                    <div key={friend.userId} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-zinc-400" />
                                                            <span className="font-medium">{friend.displayName || friend.userId}</span>
                                                        </div>
                                                        <button onClick={() => handleUnfriend(friend.userId)} className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg transition" title="Remove Friend">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Clan' && (
                                clans.length === 0 ? (
                                    <div className="p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
                                        <p className="text-zinc-500">You are not currently in a Clan.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {clans.slice(0, 5).map((clan, index) => (
                                            <div key={index} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                                                {typeof clan === "object" && clan !== null ? (clan as any).name || "Clan" : String(clan)}
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {activeTab === 'Invitations' && (
                                <div className="space-y-3">
                                    {invites.length === 0 ? (
                                        <div className="text-center py-12 text-zinc-500 italic">No pending invitations.</div>
                                    ) : (
                                        invites.slice(0, 10).map((invite, index) => (
                                            <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 text-sm">
                                                {typeof invite === "object" && invite !== null ? (invite as any).id || "Invitation" : String(invite)}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'Achievements' && (
                                <Achievements
                                    achievements={stats?.achievements ?? []}
                                    emptyTitle="No relics yet."
                                    emptyDescription="Complete quests, win matches, and forge your legend."
                                />
                            )}

                            {activeTab === 'Match History' && (
                                <MatchHistory
                                    matches={matchHistory}
                                    currentUserId={user?.id ?? undefined}
                                    emptyTitle="No battles recorded yet."
                                    emptyDescription="Your past matches will appear here once the stats pipeline is connected."
                                />
                            )}
                        </div>
                    </div>
                </div>
                {isLoadingData && (
                    <p className="text-sm text-zinc-500 mt-4">Loading profile data...</p>
                )}
            </div>
        </ProtectedRoute>
    );
}