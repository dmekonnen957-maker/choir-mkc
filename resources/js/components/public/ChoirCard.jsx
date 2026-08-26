import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import CoverImage from './CoverImage';

export default function ChoirCard({ choir }) {
    const leader = choir.team_leader?.name;
    return (
        <Link
            to={`/choirs/${choir.id}`}
            className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
        >
            <div className="aspect-[4/3] w-full overflow-hidden">
                <div className="h-full w-full transition-transform duration-700 group-hover:scale-105">
                    <CoverImage src={choir.logo_path} label={choir.name} className="h-full w-full" />
                </div>
            </div>
            <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">{choir.name}</h3>
                {leader && <p className="mt-0.5 text-sm text-slate-500">Led by {leader}</p>}
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
                    {choir.description || 'A vibrant part of the Choir MKC community.'}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    <Users size={16} className="text-blue-500" />
                    {choir.member_count ?? 0} members
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                    View Choir
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                </span>
            </div>
        </Link>
    );
}
