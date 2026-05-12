import React, { useState } from 'react';

interface AdminModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    requireReason?: boolean;
    onConfirm: (reason?: string) => void;
    onClose: () => void;
}

export const AdminActionModal: React.FC<AdminModalProps> = (
    {isOpen, title, description, requireReason, onConfirm, onClose
}) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 transform transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-6">{description}</p>

                {requireReason && (
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
                            Required Reason
                        </label>
                        <textarea
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50"
                            rows={3}
                            placeholder="Why is this action being taken?"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        className="px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                        disabled={requireReason && !reason.trim()}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};