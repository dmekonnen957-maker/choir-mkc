import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { api } from '../../axios';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { useLanguage } from '../../context/LanguageContext';

export default function ChoirDeleteModal({ open, onClose, choir, onDeleted }) {
    const { t } = useLanguage();
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setReason('');
            setError('');
            setSubmitting(false);
        }
    }, [open]);

    if (!choir) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError(t('choirs.delete_reason_required', 'Please provide a reason for deleting this choir.'));
            return;
        }

        setSubmitting(true);
        setError('');

        api.delete(`/admin/choirs/${choir.id}`, {
            data: { deletion_reason: reason.trim() },
            params: { deletion_reason: reason.trim() },
        })
            .then(() => {
                onDeleted?.(choir.id);
                onClose?.();
            })
            .catch((err) => {
                setError(
                    err.response?.data?.message ||
                        t('choirs.load_error', 'Failed to load choirs.')
                );
            })
            .finally(() => setSubmitting(false));
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t('choirs.modal_delete_title', 'Delete Choir: {{name}}').replace('{{name}}', choir.name)}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 p-4 text-rose-900">
                    <AlertTriangle size={24} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                        <p className="font-bold text-sm text-rose-950">{t('choirs.delete_warning_title', 'Are you sure you want to delete this choir?')}</p>
                        <p className="mt-1 text-rose-800">
                            {t('choirs.delete_warning_desc', 'The choir will be deactivated and hidden from the dashboard. Members, songs, and historical worship records will remain safely preserved in the database.')}
                        </p>
                    </div>
                </div>

                {error && <Alert variant="error">{error}</Alert>}

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                        {t('choirs.delete_reason_label', 'Deletion Reason')} <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t('choirs.delete_reason_placeholder', 'Please state why this choir is being deleted...')}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                        {t('choirs.delete_reason_audit_notice', 'This deletion reason will be permanently recorded in the system audit logs.')}
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button type="submit" variant="danger" disabled={submitting}>
                        {submitting ? (
                            <Loader2 size={16} className="mr-1.5 animate-spin" />
                        ) : (
                            <Trash2 size={16} className="mr-1.5" />
                        )}
                        {t('common.delete', 'Delete')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
