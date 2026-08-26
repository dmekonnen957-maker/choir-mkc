export default function AudioPlayer({ src, className = '' }) {
    if (!src) {
        return <p className="text-sm text-slate-400">Audio preview is not available for this song.</p>;
    }
    return (
        <audio controls preload="none" src={src} className={`h-11 w-full ${className}`}>
            Your browser does not support the audio element.
        </audio>
    );
}
