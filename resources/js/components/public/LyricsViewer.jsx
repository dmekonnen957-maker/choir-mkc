import React from 'react';

// Splits a single line into plain text and chord spans ([Chord]).
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
                className="font-bold text-indigo-600"
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
        return <p className="text-sm text-ink-400">No lyrics added yet.</p>;
    }

    const lines = lyrics.split('\n');

    return (
        <div className="whitespace-pre-wrap font-medium leading-relaxed text-ink-700">
            {lines.map((line, idx) => (
                <div key={idx}>{renderLine(line, idx)}</div>
            ))}
        </div>
    );
}
