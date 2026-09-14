import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronRight, Heart, MapPin, Music2, Pause, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import HeroCarousel from '../components/landing/HeroCarousel';
import { fetchAllPerformances, fetchAllSongs, isUpcoming, likeSong, unlikeSong } from '../lib/publicApi';
import { localizedDate } from '../lib/dates';

function FeaturedSongRow({ song, onLikeChanged, onPlay, isPlaying, onPromptLogin }) {
    const { isAuthenticated, hasRole } = useAuth();
    const { t } = useLanguage();
    const canLike = isAuthenticated && hasRole('member');
    const [liked, setLiked] = useState(Boolean(song.is_liked));
    const [likes, setLikes] = useState(Number(song.likes_count || 0));
    const [saving, setSaving] = useState(false);

    const toggleLike = async () => {
        if (!canLike) {
            onPromptLogin();
            return;
        }
        if (saving) return;
        const nextLiked = !liked;
        const previousLikes = likes;
        setLiked(nextLiked);
        setLikes(nextLiked ? likes + 1 : Math.max(0, likes - 1));
        setSaving(true);
        try {
            const response = nextLiked ? await likeSong(song.id) : await unlikeSong(song.id);
            const nextCount = response?.likes_count === undefined ? (nextLiked ? previousLikes + 1 : Math.max(0, previousLikes - 1)) : Number(response.likes_count);
            setLikes(nextCount);
            onLikeChanged(song.id, nextLiked, nextCount);
        } catch {
            setLiked(!nextLiked);
            setLikes(previousLikes);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:px-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Music2 size={17} />
            </div>
            <div className="min-w-0 flex-1">
                <Link to={`/songs/${song.id}`} className="block truncate text-sm font-bold text-slate-900 hover:text-blue-700">
                    {song.title}
                </Link>
                <p className="truncate text-xs text-slate-500">{song.choir?.name || t('brand.choirName')}</p>
            </div>
            <span className="hidden min-w-24 text-xs font-semibold text-slate-500 sm:block">{song.scale || song.scale_mode || 'Traditional'}</span>
            <button
                type="button"
                onClick={toggleLike}
                disabled={saving}
                title={canLike ? (liked ? t('songs.unlike') : t('songs.like')) : t('home.loginToLike')}
                aria-label={canLike ? (liked ? t('songs.unlike') : t('songs.like')) : t('home.loginToLike')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${liked ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600'} disabled:cursor-not-allowed disabled:opacity-60`}
            >
                <Heart size={15} className={liked ? 'fill-current' : ''} />
                <span>{likes}</span>
            </button>
            {song.audio_url && (
                <button type="button" onClick={() => onPlay(song)} aria-label={isPlaying ? `Pause ${song.title}` : `Play ${song.title}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700">
                    {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>
            )}
        </div>
    );
}

export default function HomePage() {
    const [songs, setSongs] = useState([]);
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playingSong, setPlayingSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loginPrompt, setLoginPrompt] = useState(false);
    const audioRef = useRef(null);
    const { t, language } = useLanguage();

    useEffect(() => {
        let mounted = true;
        Promise.all([fetchAllSongs({ per_page: 100 }).catch(() => []), fetchAllPerformances({ per_page: 100 }).catch(() => [])])
            .then(([songData, performanceData]) => {
                if (!mounted) return;
                setSongs(Array.isArray(songData) ? songData : []);
                setPerformances(Array.isArray(performanceData) ? performanceData : []);
            })
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (!playingSong?.audio_url || !audioRef.current) return;
        audioRef.current.src = playingSong.audio_url;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }, [playingSong]);

    const handlePlay = (song) => {
        if (playingSong?.id === song.id) {
            if (isPlaying) audioRef.current?.pause();
            else audioRef.current?.play().catch(() => {});
            setIsPlaying(!isPlaying);
            return;
        }
        setPlayingSong(song);
        setIsPlaying(true);
    };

    const updateLike = (songId, isLiked, likesCount) => {
        setSongs((current) => current.map((song) => song.id === songId ? { ...song, is_liked: isLiked, likes_count: likesCount } : song));
    };

    const featuredSongs = songs.slice(0, 6);
    const upcomingPerformances = performances.filter((performance) => isUpcoming(performance.date)).slice(0, 3);

    return (
        <div className="min-h-screen bg-white text-slate-800">
            <audio ref={audioRef} onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} />

            {/* Top Hero Section: Horizontal Scrolling Image Carousel */}
            <HeroCarousel />

            <main className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
                <section aria-labelledby="featured-songs-heading">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{t('home.musicLibrary')}</p><h2 id="featured-songs-heading" className="mt-1 text-2xl font-black text-slate-950">{t('home.featuredSongs')}</h2></div>
                        <Link to="/songs" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:text-blue-800">{t('home.viewAllSongs')} <ChevronRight size={16} /></Link>
                    </div>
                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="hidden items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:flex"><span className="w-9" /><span className="flex-1">{t('home.songAndChoir')}</span><span className="min-w-24">{t('home.ethiopianScale')}</span><span className="w-16 text-center">{t('home.likes')}</span><span className="w-8" /></div>
                        {loading ? <div className="px-5 py-10 text-center text-sm font-semibold text-slate-500">{t('songs.loading')}</div> : featuredSongs.length === 0 ? <div className="px-5 py-10 text-center text-sm text-slate-500">{t('songs.empty')}</div> : featuredSongs.map((song) => <FeaturedSongRow key={song.id} song={song} onLikeChanged={updateLike} onPlay={handlePlay} isPlaying={playingSong?.id === song.id && isPlaying} onPromptLogin={() => setLoginPrompt(true)} />)}
                    </div>
                </section>

                <section aria-labelledby="performances-heading">
                    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{t('home.liveWorship')}</p><h2 id="performances-heading" className="mt-1 text-2xl font-black text-slate-950">{t('home.upcomingPerformances')}</h2></div><Link to="/performances" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:text-blue-800">{t('nav.performances')} <ChevronRight size={16} /></Link></div>
                    <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                        {loading ? <p className="py-8 text-center text-sm text-slate-500">{t('common.loading')}</p> : upcomingPerformances.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">{t('home.noScheduled')}</p> : upcomingPerformances.map((performance) => <Link key={performance.id} to={`/performances/${performance.id}`} className="grid gap-2 py-4 transition hover:bg-slate-50 sm:grid-cols-[1.4fr_1fr_1fr_1fr] sm:items-center sm:px-3"><span className="font-bold text-slate-900">{performance.title}</span><span className="text-sm text-slate-600"><CalendarDays size={14} className="mr-1 inline text-blue-600" />{localizedDate(performance.date, language)}</span><span className="truncate text-sm text-slate-600"><MapPin size={14} className="mr-1 inline text-slate-400" />{performance.location || performance.venue || t('home.locationTba')}</span><span className="text-sm font-semibold text-slate-600">{performance.choir?.name || t('brand.choirName')}</span></Link>)}
                    </div>
                </section>

                <section className="border-t border-slate-200 pt-10" aria-labelledby="about-heading">
                    <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{t('home.about')}</p><h2 id="about-heading" className="mt-2 text-2xl font-black text-slate-950">{t('home.aboutHeading')}</h2><p className="mt-3 text-base leading-7 text-slate-600">{t('home.aboutText')}</p><Link to="/about" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:text-blue-800">{t('home.readMore')} <ChevronRight size={16} /></Link></div>
                </section>
            </main>

            {loginPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
                        <Heart size={28} className="mx-auto text-rose-500" />
                        <h2 className="mt-4 text-xl font-black text-slate-900">{t('home.loginPromptTitle')}</h2>
                        <p className="mt-2 text-sm text-slate-500">{t('home.loginPromptText')}</p>
                        <div className="mt-6 flex justify-center gap-3">
                            <button type="button" onClick={() => setLoginPrompt(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50">{t('home.cancel')}</button>
                            <Link to="/login?redirect=/" className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">{t('home.login')}</Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
