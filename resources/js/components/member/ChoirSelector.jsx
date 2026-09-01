import { useChoir } from '../../context/ChoirContext';
import { ChevronDown, Church } from 'lucide-react';

/**
 * Admin-only choir selector dropdown.
 * Sits in the sidebar. When a choir is selected the entire context switches.
 */
export default function ChoirSelector() {
    const { currentChoir, setCurrentChoir, choirs } = useChoir();

    const handleChange = (e) => {
        const val = e.target.value;
        if (val === '__all__') {
            setCurrentChoir(null);
        } else {
            const choir = choirs.find((c) => String(c.id) === val) ?? null;
            setCurrentChoir(choir);
        }
    };

    const selectedValue = currentChoir ? String(currentChoir.id) : '__all__';

    return (
        <div className="mx-4 mb-4">
            <p className="mb-1.5 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Current Choir
            </p>
            <div className="relative">
                <Church
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-primary)]"
                />
                <select
                    value={selectedValue}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 pl-8 pr-8 text-sm font-semibold text-slate-100 outline-none transition focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)]/50"
                >
                    <option value="__all__">All Choirs</option>
                    {choirs.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
            </div>
            {currentChoir && (
                <div className="mt-2 flex items-center gap-2 px-1">
                    {currentChoir.uniform_primary_color && (
                        <span
                            className="inline-block h-3 w-3 rounded-full border border-slate-600"
                            style={{ backgroundColor: currentChoir.uniform_primary_color }}
                            title={`Primary: ${currentChoir.uniform_primary_color}`}
                        />
                    )}
                    {currentChoir.uniform_secondary_color && (
                        <span
                            className="inline-block h-3 w-3 rounded-full border border-slate-600"
                            style={{ backgroundColor: currentChoir.uniform_secondary_color }}
                            title={`Secondary: ${currentChoir.uniform_secondary_color}`}
                        />
                    )}
                    {currentChoir.choir_type && (
                        <span className="text-xs text-slate-400">{currentChoir.choir_type}</span>
                    )}
                </div>
            )}
        </div>
    );
}
