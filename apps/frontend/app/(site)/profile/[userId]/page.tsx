"use client";


import { useCallback, useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import EditProfileModal from "@/components/EditProfile";
import { useAuth } from "@/components/Providers";
import { authClient } from "@/src/core/api/auth/auth.client";
import { getMyProfile } from "@/src/core/api/profile/profile.client";
import { Pencil } from "lucide-react";

type TabType = 'Info' | 'Friends' | 'Clan' | 'Invitations';

type PlayerStats = {
    level?: number;
    wins?: number;
    losses?: number;
    kills?: number;
    deaths?: number;
    achievements?: Array<{ id?: string; type?: string } | string>;
};

type SocialProfile = {
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
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
    const [friends, setFriends] = useState<unknown[]>([]);
    const [clans, setClans] = useState<unknown[]>([]);
    const [invites, setInvites] = useState<unknown[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);

    // Compute displayName, avatarUrl, bio early so useEffect can access them
    const displayName = profile?.displayName || user?.displayName || user?.username || user?.email || "Unknown User";
    const avatarUrl = profile?.avatarUrl;
    const bio = profile?.bio;
    const level = stats?.level ?? 1;

    // ✅ Define it at component level
	const loadProfileData = useCallback(async () => {
		setIsLoadingData(true);
		try {
			const socialProfile = await getMyProfile();
			if (socialProfile.ok) setProfile(socialProfile.data);
			const me = await authClient.getMe();
			const resolvedUser = me.data.user;
			const token = sessionStorage.getItem("auth.accessToken");
			const headers: HeadersInit = {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			};

			const [friendsRes, clansRes, invitesRes, statsRes] = await Promise.all([
				fetch(`${API_BASE}/friends`, { headers }),
				fetch(`${API_BASE}/clans/me`, { headers }),
				fetch(`${API_BASE}/clans/me/invites`, { headers }),
                resolvedUser?.id
                    ? fetch(`${API_BASE}/stats/user/${resolvedUser.id}`, { headers })
					: Promise.resolve(null),
			]);

			const safeJson = async (r: Response | null) => {
				if (r && r.ok) {
					const json = await r.json();
					return Array.isArray(json) ? json : [];
				}
				return [];
			};

			setFriends(await safeJson(friendsRes));
			setClans(await safeJson(clansRes));
			setInvites(await safeJson(invitesRes));
			setStats(await safeJson(statsRes));
		} finally {
			setIsLoadingData(false);
		}
	}, []); // add any real deps if needed

	// ✅ Now useEffect just calls it
	useEffect(() => {
		void loadProfileData();
	}, [loadProfileData]);


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

    const achievementBadges = (stats?.achievements ?? []).map((achievement, index) => {
        if (typeof achievement === "string") {
            return { id: `ach-${index}-${achievement}`, label: achievement };
        }
        return {
            id: achievement.id ?? `ach-${index}`,
            label: achievement.type ?? "Achievement",
        };
    });

    const tabs: { name: TabType; icon: string }[] = [
        {name: 'Info', icon: '👤'},
        {name: 'Friends', icon: '👥'},
        {name: 'Clan', icon: '🛡️'},
        {name: 'Invitations', icon: '✉️'},
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
                <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
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
            <div className="flex flex-col md:flex-row gap-8">

                {/* LEFT: Sidebar Navigation */}
                <div className="w-full md:w-64 flex flex-col gap-2">
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
                            className=" w-20 h-20 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl border-4 border-white dark:border-zinc-800 shadow-lg">
							{avatarUrl ? (
                                <img src={avatarUrl} alt="Profile avatar" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                "🪱"
                            )}
                        </div>

                        <h2 className="font-black text-l">{displayName}</h2>
                        <p className="text-xs text-zinc-500 font-mono uppercase">Level {level} <span className="font-bold">{bio || ""}</span></p>
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
                <div
                    className="flex-1 bg-white dark:bg-zinc-900 border border-foreground/5 rounded-3xl p-8 shadow-sm"
                    style={{ minHeight: "400px" }}
                >
                    <h3 className="text-2xl font-black mb-6 border-b pb-4 border-foreground/5">
                        {activeTab}
                    </h3>

                    <div className="space-y-4">

                        {activeTab === 'Info' && (
                            <div className="grid gap-4">
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                    <label className="text-[10px] uppercase font-bold text-zinc-400">Email
                                        Address</label>
                                    <p className="font-medium">{user?.email ?? "N/A"}</p>
                                </div>
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                    <label className="text-[10px] uppercase font-bold text-zinc-400">Total
                                        Victories</label>
                                    <p className="font-medium">{computedStats.wins} Matches Won</p>
                                </div>
                                {/*<div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                    <label className="text-[10px] uppercase font-bold text-zinc-400">Bio</label>
                                    <p className="font-medium whitespace-pre-wrap">{bio || "No bio set yet."}</p>
                                </div>*/}
                                <div className="mt-8">
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Achievements</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {achievementBadges.length === 0 && (
                                            <span className="text-sm text-zinc-500">No achievements yet.</span>
                                        )}
                                        {achievementBadges.map((badge) => (
                                            <span key={badge.id}
                                                  className="px-3 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20 rounded-full text-xs font-bold">
        {badge.label}
      </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Friends' && (
                            <div className="space-y-3">
                                {friends.length === 0 ? (
                                    <div className="text-center py-12 text-zinc-500 italic">
                                        You haven't added any battle buddies yet.
                                    </div>
                                ) : (
                                    friends.slice(0, 10).map((friend, index) => (
                                        <div key={index} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-sm">
                                            {typeof friend === "object" && friend !== null
                                                ? (friend as { displayName?: string; userId?: string }).displayName
                                                    || (friend as { userId?: string }).userId
                                                    || "Friend"
                                                : String(friend)}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'Clan' && (
                            clans.length === 0 ? (
                                <div
                                    className="p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
                                    <p className="text-zinc-500">You are not currently in a Clan.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {clans.slice(0, 5).map((clan, index) => (
                                        <div key={index} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                                            {typeof clan === "object" && clan !== null
                                                ? (clan as { name?: string; id?: string }).name || (clan as { id?: string }).id || "Clan"
                                                : String(clan)}
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {activeTab === 'Invitations' && (
                            <div className="space-y-3">
                                {invites.length === 0 ? (
                                    <div className="text-center py-12 text-zinc-500 italic">
                                        No pending invitations.
                                    </div>
                                ) : (
                                    invites.slice(0, 10).map((invite, index) => (
                                        <div
                                            key={index}
                                            className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 text-sm"
                                        >
                                            {typeof invite === "object" && invite !== null
                                                ? (invite as { id?: string; clanId?: string }).id
                                                    || (invite as { clanId?: string }).clanId
                                                    || "Invitation"
                                                : String(invite)}
                                        </div>
                                    ))
                                )}
                            </div>
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
