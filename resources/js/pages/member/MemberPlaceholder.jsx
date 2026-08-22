import { Construction } from 'lucide-react';
import EmptyState from '../../components/member/EmptyState';

export default function MemberPlaceholder({ title = 'Coming soon' }) {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
            <EmptyState
                icon={Construction}
                title={`${title} is not available yet`}
                message="This section is part of the upcoming member features and has not been built in this phase."
            />
        </div>
    );
}
