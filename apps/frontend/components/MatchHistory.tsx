type MatchOutcome = "win" | "loss" | "draw" | "pending";

type MatchParticipant = {
	name: string;
	kills: number;
	deaths: number;
	isCurrentUser?: boolean;
	isWinner?: boolean;
};

type MatchHistoryItem = {
	id: string;
	mode: string;
	mapName: string;
	playedAt: string;
	durationMinutes: number;
	outcome: MatchOutcome;
	score: string;
	kills: number;
	deaths: number;
	xpEarned: number;
	pointsEarned: number;
	participants: MatchParticipant[];
	summary: string;
};

type MatchHistoryProps = {
	matches?: MatchHistoryItem[];
	className?: string;
	emptyTitle?: string;
	emptyDescription?: string;
	useMockData?: boolean;
};

const MOCK_MATCHES: MatchHistoryItem[] = [
	{
		id: "match-4912",
		mode: "Ranked Skirmish",
		mapName: "Rust Canyon",
		playedAt: "2026-05-31T19:42:00.000Z",
		durationMinutes: 14,
		outcome: "win",
		score: "3 - 1",
		kills: 5,
		deaths: 1,
		xpEarned: 240,
		pointsEarned: 120,
		participants: [
			{ name: "You", kills: 5, deaths: 1, isCurrentUser: true, isWinner: true },
			{ name: "Norminette_Hater", kills: 3, deaths: 2 },
			{ name: "PixelFang", kills: 2, deaths: 3 },
		],
		summary: "Clean rotations, strong aim, and a decisive final blast.",
	},
	{
		id: "match-4911",
		mode: "Casual Clash",
		mapName: "Copper Dunes",
		playedAt: "2026-05-31T18:08:00.000Z",
		durationMinutes: 11,
		outcome: "loss",
		score: "1 - 3",
		kills: 2,
		deaths: 4,
		xpEarned: 90,
		pointsEarned: 35,
		participants: [
			{ name: "You", kills: 2, deaths: 4, isCurrentUser: true },
			{ name: "BoomRanger", kills: 4, deaths: 1, isWinner: true },
			{ name: "TinyTorpedo", kills: 1, deaths: 2 },
			{ name: "LootPilot", kills: 1, deaths: 2 },
		],
		summary: "Held the center early, but got caught out by splash damage.",
	},
	{
		id: "match-4910",
		mode: "Ranked Skirmish",
		mapName: "Echo Basin",
		playedAt: "2026-05-30T21:19:00.000Z",
		durationMinutes: 16,
		outcome: "win",
		score: "4 - 2",
		kills: 6,
		deaths: 2,
		xpEarned: 310,
		pointsEarned: 180,
		participants: [
			{ name: "You", kills: 6, deaths: 2, isCurrentUser: true, isWinner: true },
			{ name: "KeenShot", kills: 3, deaths: 3 },
			{ name: "DriftZero", kills: 2, deaths: 4 },
		],
		summary: "Momentum came back after the third turn and never let go.",
	},
	{
		id: "match-4909",
		mode: "Warmup Duel",
		mapName: "Neon Ridge",
		playedAt: "2026-05-29T20:05:00.000Z",
		durationMinutes: 8,
		outcome: "draw",
		score: "2 - 2",
		kills: 3,
		deaths: 3,
		xpEarned: 60,
		pointsEarned: 20,
		participants: [
			{ name: "You", kills: 3, deaths: 3, isCurrentUser: true },
			{ name: "ForgeFox", kills: 3, deaths: 3 },
		],
		summary: "A balanced match with almost no wasted shots.",
	},
];

const outcomeMeta: Record<MatchOutcome, { label: string; chip: string; accent: string }> = {
	win: {
		label: "Victory",
		chip: "bg-emerald-100 text-emerald-700 border-emerald-200",
		accent: "from-emerald-50 via-white to-white",
	},
	loss: {
		label: "Defeat",
		chip: "bg-rose-100 text-rose-700 border-rose-200",
		accent: "from-rose-50 via-white to-white",
	},
	draw: {
		label: "Draw",
		chip: "bg-amber-100 text-amber-700 border-amber-200",
		accent: "from-amber-50 via-white to-white",
	},
	pending: {
		label: "Pending",
		chip: "bg-zinc-100 text-zinc-600 border-zinc-200",
		accent: "from-zinc-50 via-white to-white",
	},
};

function formatPlayedAt(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function formatDuration(minutes: number) {
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	const remainder = minutes % 60;
	return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function MatchHistory({
	matches = [],
	className = "",
	emptyTitle = "No matches yet.",
	emptyDescription = "Once you finish a battle, the history will appear here.",
	useMockData = true,
}: MatchHistoryProps) {
	const matchItems = matches.length > 0 ? matches : useMockData ? MOCK_MATCHES : [];
	const completedMatches = matchItems.filter((match) => match.outcome === "win").length;
	const totalMatches = matchItems.length;
	const losses = matchItems.filter((match) => match.outcome === "loss").length;
	const winRate = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

	return (
		<div className={`mt-2 flex h-full min-h-0 flex-col rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
			<div className="mb-5 flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h4 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">Match History</h4>
					<p className="mt-1 text-xs text-zinc-500">Recent battle results, outcomes, and team performance.</p>
				</div>
				<div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">{totalMatches} Total</span>
					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">{completedMatches} Wins</span>
					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">{losses} Losses</span>
					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">{winRate}% Win Rate</span>
				</div>
			</div>

			{matchItems.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
					<div className="text-base font-bold text-zinc-800">{emptyTitle}</div>
					<p className="mt-2 text-sm text-zinc-500">{emptyDescription}</p>
				</div>
			) : (
				<div className="min-h-0 grow overflow-y-auto pr-2 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
					<div className="flex flex-col gap-4">
						{matchItems.map((match) => {
							const outcome = outcomeMeta[match.outcome];
							return (
								<article
									key={match.id}
									className={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-linear-to-br ${outcome.accent} p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md`}
								>
									<div className="relative flex flex-col gap-4">
										<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
											<div className="min-w-0 flex-1">
												<div className="flex flex-wrap items-center gap-2">
													<p className="text-sm font-black text-zinc-900">{match.mode}</p>
													<span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${outcome.chip}`}>
														{outcome.label}
													</span>
												</div>
												<p className="mt-1 text-xs leading-5 text-zinc-600">{match.summary}</p>
											</div>
											<div className="flex flex-col items-start gap-1 sm:items-end">
												<p className="text-lg font-black text-zinc-900">{match.score}</p>
												<p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">{match.mapName}</p>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
											<div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
												<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Date</p>
												<p className="text-xs font-black text-zinc-900">{formatPlayedAt(match.playedAt)}</p>
											</div>
											<div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
												<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Duration</p>
												<p className="text-sm font-black text-zinc-900">{formatDuration(match.durationMinutes)}</p>
											</div>
											<div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
												<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Kills</p>
												<p className="text-sm font-black text-zinc-900">{match.kills}</p>
											</div>
											<div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
												<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Deaths</p>
												<p className="text-sm font-black text-zinc-900">{match.deaths}</p>
											</div>
										</div>

										<div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
											<span className="rounded-full border border-zinc-200 bg-white px-3 py-1">+{match.xpEarned} XP</span>
											<span className="rounded-full border border-zinc-200 bg-white px-3 py-1">+{match.pointsEarned} Points</span>
											<span className="rounded-full border border-zinc-200 bg-white px-3 py-1">{match.participants.length} Players</span>
										</div>

										<div className="rounded-2xl border border-zinc-200 bg-white/80 p-3">
											<div className="mb-2 flex items-center justify-between">
												<p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Participants</p>
												<p className="text-[10px] font-medium text-zinc-500">{match.outcome === "win" ? "Victory secured" : match.outcome === "loss" ? "Needs rematch" : match.outcome === "draw" ? "Even fight" : "Waiting for result"}</p>
											</div>
											<div className="flex flex-col gap-2">
												{match.participants.map((participant) => (
													<div
														key={`${match.id}-${participant.name}`}
														className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm ${
														participant.isCurrentUser
															? "bg-blue-50 text-blue-700"
															: "bg-zinc-50 text-zinc-700"
														}`}
													>
														<div className="min-w-0">
															<p className="truncate font-bold">{participant.name}</p>
															<p className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
																{participant.isWinner ? "Winner" : "Competitor"}
															</p>
														</div>
														<div className="flex shrink-0 items-center gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
															<span>{participant.kills} K</span>
															<span>{participant.deaths} D</span>
														</div>
													</div>
												))}
											</div>
										</div>
									</div>
								</article>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

export default MatchHistory;