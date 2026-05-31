type AchievementInput =
    | string
    | {
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
          achievedAt?: string | null;
          meta?: Record<string, unknown>;
      };

type AchievementCard = {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    achieved: boolean;
    progressValue: number | null;
    progressTarget: number | null;
    accent: string;
    ring: string;
    badgeLabel: string;
};

type AchievementsProps = {
    achievements?: AchievementInput[];
    className?: string;
    emptyTitle?: string;
    emptyDescription?: string;
};

export function Achievements({
    achievements = [],
    className = "",
    emptyTitle = "No achievements yet.",
    emptyDescription = "Your legend starts here.",
}: AchievementsProps) {
    const achievementCards: AchievementCard[] = achievements.map((achievement, index) => {
        if (typeof achievement === "string") {
            return {
                id: `ach-${index}-${achievement}`,
                title: achievement.replace(/_/g, " "),
                subtitle: "Unlocked achievement",
                icon: "🏆",
                achieved: true,
                progressValue: null,
                progressTarget: null,
                accent: "from-amber-500/20 via-yellow-500/10 to-amber-400/5",
                ring: "ring-amber-400/30",
                badgeLabel: "Completed",
            };
        }

        const achieved = achievement.achieved ?? false;
        const progressTarget = achievement.progressTarget ?? null;
        const progressValue = achievement.progress ?? null;

        return {
            id: achievement.id ?? `ach-${index}`,
            title: achievement.name ?? achievement.type ?? "Achievement",
            subtitle: achievement.description ?? (achieved ? "Completed" : "In progress"),
            icon: achievement.icon ?? (achieved ? "✨" : "🔒"),
            achieved,
            progressValue,
            progressTarget,
            accent: achieved
                ? "from-emerald-500/20 via-amber-500/10 to-yellow-400/5"
                : "from-zinc-500/15 via-zinc-500/10 to-zinc-400/5",
            ring: achieved ? "ring-emerald-400/30" : "ring-zinc-400/20",
            badgeLabel: achieved ? "Completed" : "Quest",
        };
    });

    const completedCount = achievementCards.filter((achievement) => achievement.achieved).length;
    const totalCount = achievementCards.length;
    const pendingCount = totalCount - completedCount;

    return (
        <div
            className={`mt-2 rounded-3xl border border-yellow-500/10 bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4 shadow-lg shadow-yellow-500/5 sm:p-5 ${className}`}
        >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-200/80">Achievements</h4>
                    <p className="mt-1 text-xs text-zinc-400">Fantasy relics, progression, and completed feats.</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                    <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1">
                        {completedCount} Cleared
                    </span>
                    <span className="rounded-full border border-zinc-600/40 bg-zinc-800/60 px-3 py-1">
                        {pendingCount} Pending
                    </span>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
                        {totalCount} Total
                    </span>
                </div>
            </div>

            {achievementCards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-400">
                    <div className="text-base font-bold text-zinc-200">{emptyTitle}</div>
                    <p className="mt-2 text-sm text-zinc-400">{emptyDescription}</p>
                </div>
            ) : (
                <div className={`grid gap-3 ${achievementCards.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
                    {achievementCards.map((badge) => {
                        const progressPercent =
                            badge.progressTarget && badge.progressTarget > 0 && badge.progressValue !== null
                                ? Math.min(100, Math.max(0, (badge.progressValue / badge.progressTarget) * 100))
                                : null;

                        return (
                            <div
                                key={badge.id}
                                className={`group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br ${badge.accent} p-4 shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/10 ${badge.ring}`}
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_40%)] opacity-80" />
                                <div className="relative flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/70 text-lg shadow-inner shadow-black/30">
                                        {badge.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h5 className="truncate text-sm font-extrabold text-white">{badge.title}</h5>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.25em] ${
                                                    badge.achieved
                                                        ? "bg-emerald-400/15 text-emerald-200"
                                                        : "bg-zinc-400/15 text-zinc-300"
                                                }`}
                                            >
                                                {badge.badgeLabel}
                                            </span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-200/80">{badge.subtitle}</p>
                                        {progressPercent !== null && (
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-300/80">
                                                    <span>Progress</span>
                                                    <span>
                                                        {badge.progressValue}/{badge.progressTarget}
                                                    </span>
                                                </div>
                                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-950/60">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            badge.achieved
                                                                ? "bg-linear-to-r from-emerald-300 to-yellow-300"
                                                                : "bg-linear-to-r from-zinc-400 to-zinc-200"
                                                        }`}
                                                        style={{ width: `${progressPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Achievements;
