import React from 'react';

function renderLine(line, lineIndex) {
    const parts = [];
    const regex = /\[([^\]]+)\]/g;
    let last = 0;
    let match;
    let i = 0;

    while ((match = regex.exec(line)) !== null) {
        if (match.index > last) {
            parts.push(line.slice(last, match.index));
        }
        parts.push(
            <span
                key={`c-${lineIndex}-${i++}`}
                className="mx-0.5 inline-block rounded bg-indigo-50 px-1 font-mono text-xs font-bold text-indigo-600"
            >
                {match[1]}
            </span>
        );
        last = match.index + match[0].length;
    }

    if (last < line.length) {
        parts.push(line.slice(last));
    }

    return parts;
}

export default function LyricsViewer({ lyrics }) {
    if (!lyrics || !lyrics.trim()) {
        return (
            <div className="py-8 text-center text-slate-400">
                <p className="text-sm font-medium">Lyrics are not available for this song.</p>
            </div>
        );
    }

    const sectionRegex = /^(verse\s*\d*|chorus\s*\d*|bridge\s*\d*|intro\s*\d*|outro\s*\d*|refrain\s*\d*|pre-chorus\s*\d*|tag\s*\d*):?$/i;
    const lines = lyrics.split('\n');

    return (
        <div className="space-y-1.5 text-base font-normal leading-relaxed text-slate-800">
            {lines.map((rawLine, idx) => {
                const trimmed = rawLine.trim();
                const isSectionHeader = sectionRegex.test(trimmed);

                if (isSectionHeader) {
                    return (
                        <div key={idx} className="pb-1 pt-4">
                            <span className="inline-block rounded-md bg-blue-100/80 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-900">
                                {trimmed.replace(/:$/, '').toUpperCase()}
                            </span>
                        </div>
                    );
                }

                if (!trimmed) {
                    return <div key={idx} className="h-3" />;
                }

                return <div key={idx}>{renderLine(rawLine, idx)}</div>;
            })}
        </div>
    );
}
