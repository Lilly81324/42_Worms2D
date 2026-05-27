"use client";

type EditProfileModalProps = {
    open: boolean;
    onClose?: () => void;
    displayName?: string;
    email?: string;
};

export default function EditProfileModal({ open, onClose, displayName, email }: EditProfileModalProps) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Edit profile</p>
                        <h2 className="mt-1 text-2xl font-black text-zinc-900 dark:text-zinc-50">Update your profile</h2>
                        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                            Placeholder modal shell for avatar, bio, and account fields.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                    >
                        Close
                    </button>
                </div>

                <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                    <section className="rounded-2xl border border-dashed border-zinc-200 p-4 dark:border-zinc-800">
                        <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-zinc-100 text-5xl dark:bg-zinc-900">
                            🪱
                        </div>
                        <p className="mt-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Avatar upload and crop
                        </p>
                    </section>

                    <section className="grid gap-4">
                        <label className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Display name
                            <input
                                type="text"
                                defaultValue={displayName ?? ""}
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                            />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Email
                            <input
                                type="email"
                                defaultValue={email ?? ""}
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                            />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Bio
                            <textarea
                                rows={5}
                                placeholder="Tell others a little about yourself"
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                            />
                        </label>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-white"
                            >
                                Save
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}