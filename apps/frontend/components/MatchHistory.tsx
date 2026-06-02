//type MatchHistoryParticipant = {
//	userId: string;
//	displayName?: string | null;
//	avatarUrl?: string | null;
//	isWinner?: boolean;
//	kills: number;
//	deaths: number;
//};

//type MatchHistoryItem = {
//	id: string;
//	status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
//	duration?: number | null;
//	createdAt: string;
//	endedAt?: string | null;
//	mode?: string | null;
//	mapName?: string | null;
//	score?: string | null;
//	summary?: string | null;
//	player: MatchHistoryParticipant;
//	participants?: MatchHistoryParticipant[];
//};

//type MatchHistoryProps = {
//	matches?: MatchHistoryItem[];
//	currentUserId?: string;
//	className?: string;
//	emptyTitle?: string;
//	emptyDescription?: string;
//};

//const statusMeta: Record<'win' | 'loss' | 'draw' | 'pending', { label: string; chip: string; accent: string }> = {
//	win: {
//		label: 'Victory',
//		chip: 'bg-emerald-100 text-emerald-700 border-emerald-200',
//		accent: 'from-emerald-50 via-white to-white',
//	},
//	loss: {
//		label: 'Defeat',
//		chip: 'bg-rose-100 text-rose-700 border-rose-200',
//		accent: 'from-rose-50 via-white to-white',
//	},
//	draw: {
//		label: 'Draw',
//		chip: 'bg-amber-100 text-amber-700 border-amber-200',
//		accent: 'from-amber-50 via-white to-white',
//	},
//	pending: {
//		label: 'Pending',
//		chip: 'bg-zinc-100 text-zinc-600 border-zinc-200',
//		accent: 'from-zinc-50 via-white to-white',
//	},
//};

//function formatDate(value?: string | null) {
//	if (!value) return '—';
//	const date = new Date(value);
//	if (Number.isNaN(date.getTime())) return '—';
//	return new Intl.DateTimeFormat(undefined, {
//		month: 'short',
//		day: 'numeric',
//		year: 'numeric',
//		hour: '2-digit',
//		minute: '2-digit',
//	}).format(date);
//}

//function formatDuration(duration?: number | null) {
//	if (!duration && duration !== 0) return '—';
//	if (duration < 60) return `${duration}m`;
//	const hours = Math.floor(duration / 60);
//	const minutes = duration % 60;
//	return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
//}

//function getMatchOutcome(match: MatchHistoryItem) {
//	if (match.status !== 'FINISHED') return 'pending' as const;

//	// Prefer explicit player winner flag from backend payload.
//	if (typeof match.player?.isWinner === 'boolean') {
//		return match.player.isWinner ? 'win' as const : 'loss' as const;
//	}

//	if (match.score && /^\s*(\d+)\s*[-:]\s*(\d+)\s*$/.test(match.score)) {
//		const [, left, right] = match.score.match(/^\s*(\d+)\s*[-:]\s*(\d+)\s*$/) ?? [];
//		if (left && right) {
//			const leftValue = Number(left);
//			const rightValue = Number(right);
//			if (leftValue === rightValue) return 'draw' as const;
//			return leftValue > rightValue ? 'win' as const : 'loss' as const;
//		}
//	}

//	return 'loss' as const;
//}

//function getDisplayName(participant: MatchHistoryParticipant, currentUserId?: string) {
//	if (participant.userId === currentUserId) return 'You';
//	return participant.displayName?.trim() || participant.userId.slice(0, 8);
//}


//function ParticipantAvatar({ participant, currentUserId }: { participant: MatchHistoryParticipant; currentUserId?: string }) {
//	const label = getDisplayName(participant, currentUserId);
//	const fallback = label
//		.split(' ')
//		.map((part) => part[0])
//		.slice(0, 2)
//		.join('')
//		.toUpperCase();

//	return (
//		<div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-[10px] font-black uppercase text-zinc-600">
//			{participant.avatarUrl ? (
//				<img src={participant.avatarUrl} alt={`${label} avatar`} className="h-full w-full object-cover" />
//			) : (
//				fallback || 'W'
//			)}
//		</div>
//	);
//}

//export function MatchHistory({
//	matches = [],
//	currentUserId,
//	className = '',
//	emptyTitle = 'No matches yet.',
//	emptyDescription = 'Once a match is recorded in the stats service, it will appear here.',
//}: MatchHistoryProps) {
//	const totalMatches = matches.length;
//	const wins = matches.filter((match) => getMatchOutcome(match) === 'win').length;
//	const losses = matches.filter((match) => getMatchOutcome(match) === 'loss').length;
//	const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

//	return (
//		<div className={`mt-2 flex h-auto min-h-0 flex-col rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
//			<div className="mb-5 flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
//				<div>
//					<h4 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">Match History</h4>
//					<p className="mt-1 text-xs text-zinc-500">Recent battles, outcomes, and performance snapshots.</p>
//				</div>
//				<div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
//					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">{totalMatches} Total</span>
//					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">{wins} Wins</span>
//					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">{losses} Losses</span>
//					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">{winRate}% Win Rate</span>
//				</div>
//			</div>

//			{matches.length === 0 ? (
//				<div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
//					<div className="text-base font-bold text-zinc-800">{emptyTitle}</div>
//					<p className="mt-2 text-sm text-zinc-500">{emptyDescription}</p>
//				</div>
//			) : (
//				<div className="min-h-0 grow overflow-y-auto pr-2 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
//					<div className="flex flex-col gap-4">
//						{matches.map((match) => {
//							const outcome = getMatchOutcome(match);
//							const meta = statusMeta[outcome];
//							const participants = match.participants?.length ? match.participants : [match.player];
//							const visibleParticipants = participants.slice(0, 4);

//							return (
//								<article
//									key={match.id}
//									className={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-linear-to-br ${meta.accent} p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md`}
//								>
//									<div className="relative flex flex-col gap-4">
//										<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
//											<div className="min-w-0 flex-1">
//												<div className="flex flex-wrap items-center gap-2">
//													<p className="text-sm font-black text-zinc-900">{match.mode ?? 'Match'}</p>
//													<span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${meta.chip}`}>{meta.label}</span>
//												</div>
//												{/*<p className="mt-1 text-xs leading-5 text-zinc-600">
//													{match.summary || 'The match record has been stored in the stats service.'}
//												</p>*/}
//											</div>
//											<div className="flex flex-col items-start gap-1 sm:items-end">
												
//												<p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">{match.mapName ?? 'Unknown map'}</p>
//											</div>
//										</div>

//										<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
//											<div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
//												<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Played</p>
//												<p className="text-xs font-black text-zinc-900">{formatDate(match.endedAt ?? match.createdAt)}</p>
//											</div>
//											<div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
//												<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Duration</p>
//												<p className="text-sm font-black text-zinc-900">{formatDuration(match.duration)}</p>
//											</div>
//											<div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
//												<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Result</p>
//												<p className="text-sm font-black text-zinc-900">{outcome === 'pending' ? 'Pending' : meta.label}</p>
//											</div>
//											<div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
//												<p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">Status</p>
//												<p className="text-sm font-black text-zinc-900">{match.status}</p>
//											</div>
//										</div>

//										<div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
//											<span className="rounded-full border border-zinc-200 bg-white px-3 py-1">{match.player.kills} Kills</span>
//											<span className="rounded-full border border-zinc-200 bg-white px-3 py-1">{match.player.deaths} Deaths</span>
//											<span className="rounded-full border border-zinc-200 bg-white px-3 py-1">{participants.length} Players</span>
//											{match.player.userId === currentUserId && (
//												<span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">You</span>
//											)}
//											<span className="rounded-full border border-zinc-200 bg-white px-3 py-1">{match.score ?? '—'}</span>
//										</div>

//										<div className="rounded-2xl border border-zinc-200 bg-white/80 p-3">
//											<div className="mb-2 flex items-center justify-between gap-3">
//												<p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Participants</p>
//												<p className="text-[10px] font-medium text-zinc-500">
//													{outcome === 'win' ? 'Victory secured' : outcome === 'loss' ? 'Needs rematch' : outcome === 'draw' ? 'Even fight' : 'Waiting for result'}
//												</p>
//											</div>
//											<div className="flex flex-col gap-2">
//												{visibleParticipants.map((participant) => {
//													const isCurrentUser = participant.userId === currentUserId || participant.userId === match.player.userId;
//													const isWinner = Boolean(participant.isWinner);
//													const participantClass = isWinner
//														? 'bg-emerald-50 text-emerald-700 border-emerald-200'
//														: isCurrentUser
//														? 'bg-blue-50 text-blue-700 border-blue-200'
//														: 'bg-zinc-50 text-zinc-700 border-zinc-200';
//													return (
//														<div key={`${match.id}-${participant.userId}`}	className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm border min-w-0 overflow-hidden ${participantClass}`}>
//															<ParticipantAvatar participant={participant} currentUserId={currentUserId} />
//															<div className="min-w-0 flex-1">
//																<p className="truncate font-bold">{getDisplayName(participant, currentUserId)}</p>
//																<p className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">
//																	{participant.isWinner ? 'Winner' : 'Competitor'}
//																</p>
//															</div>
//															<div className="flex shrink-0 items-center gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
//																<span>{participant.kills} K</span>
//																<span>{participant.deaths} D</span>
//															</div>
//														</div>
//													);
//												})}
//											</div>
//										</div>
//									</div>
//								</article>
//							);
//						})}
//					</div>
//				</div>
//			)}
//		</div>
//	);
//}

//export default MatchHistory;


// MatchHistory.tsx
// The parent component. All card rendering is now delegated to <MatchCard />.

//import { MatchCard } from './MatchCard';
import type { MatchCardItem } from './MatchHistory/Card';
import MatchCard from './MatchHistory/Card';

// Re-export the item type under the original name so existing imports don't break
export type MatchHistoryItem = MatchCardItem;

export type MatchHistoryProps = {
	matches?: MatchHistoryItem[];
	currentUserId?: string;
	className?: string;
	emptyTitle?: string;
	emptyDescription?: string;
};

// ─── Helpers (only what MatchHistory itself needs) ────────────────────────────

function getMatchOutcome(match: MatchHistoryItem): 'win' | 'loss' | 'draw' | 'pending' {
	if (match.status !== 'FINISHED') return 'pending';
	if (typeof match.player?.isWinner === 'boolean') {
		return match.player.isWinner ? 'win' : 'loss';
	}
	if (match.score && /^\s*(\d+)\s*[-:]\s*(\d+)\s*$/.test(match.score)) {
		const [, left, right] = match.score.match(/^\s*(\d+)\s*[-:]\s*(\d+)\s*$/) ?? [];
		if (left && right) {
			const l = Number(left);
			const r = Number(right);
			if (l === r) return 'draw';
			return l > r ? 'win' : 'loss';
		}
	}
	return 'loss';
}

// ─── MatchHistory ─────────────────────────────────────────────────────────────

export function MatchHistory({
	matches = [],
	currentUserId,
	className = '',
	emptyTitle = 'No matches yet.',
	emptyDescription = 'Once a match is recorded in the stats service, it will appear here.',
}: MatchHistoryProps) {
	// Derived stats — computed from the matches array, not stored in state
	const totalMatches = matches.length;
	const wins = matches.filter((m) => getMatchOutcome(m) === 'win').length;
	const losses = matches.filter((m) => getMatchOutcome(m) === 'loss').length;
	const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

	return (
		<div
			className={`mt-2 flex h-auto min-h-0 flex-col rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}
		>
			{/* Header */}
			<div className="mb-5 flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h4 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">
						Match History
					</h4>
					<p className="mt-1 text-xs text-zinc-500">
						Recent battles, outcomes, and performance snapshots.
					</p>
				</div>
				<div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
						{totalMatches} Total
					</span>
					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
						{wins} Wins
					</span>
					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
						{losses} Losses
					</span>
					<span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1">
						{winRate}% Win Rate
					</span>
				</div>
			</div>

			{/* Empty state */}
			{matches.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
					<div className="text-base font-bold text-zinc-800">{emptyTitle}</div>
					<p className="mt-2 text-sm text-zinc-500">{emptyDescription}</p>
				</div>
			) : (
				// Scrollable card list
				<div className="min-h-0 grow overflow-y-auto pr-2 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
					<div className="flex flex-col gap-4">
						{matches.map((match) => (
							// MatchHistory only passes down what MatchCard needs
							<MatchCard
								key={match.id}
								match={match}
								currentUserId={currentUserId}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default MatchHistory;