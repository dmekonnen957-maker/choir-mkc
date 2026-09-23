import { Construction } from 'lucide-react';
import EmptyState from '../../components/member/EmptyState';
import { useLanguage } from '../../context/LanguageContext';

export default function MemberPlaceholder({ title = null }) {
    const { t } = useLanguage();
    const displayTitle = title || t('common.coming_soon', 'Coming Soon');
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-ink-900">{displayTitle}</h1>
            <EmptyState
                icon={Construction}
                title={`${displayTitle} ${t('common.not_available', 'is not available yet')}`}
                message={t('common.not_available', 'This section is part of the upcoming member features and has not been built in this phase.')}
            />
        </div>
    );
}
