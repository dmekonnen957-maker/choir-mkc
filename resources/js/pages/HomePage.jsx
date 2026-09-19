import { useEffect, useState } from 'react';
import { CalendarDays, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import HeroCarousel from '../components/landing/HeroCarousel';
import { fetchAllPerformances, isUpcoming } from '../lib/publicApi';
import { localizedDate } from '../lib/dates';


export default function HomePage() {
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t, language } = useLanguage();

    useEffect(() => {
        let mounted = true;
        fetchAllPerformances({ per_page: 100 })
            .then((performanceData) => {
                if (!mounted) return;
                setPerformances(Array.isArray(performanceData) ? performanceData : []);
            })
            .catch(() => {
                if (!mounted) return;
                setPerformances([]);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    const upcomingPerformances = performances.filter((performance) => isUpcoming(performance.date)).slice(0, 3);

    return (
        <div className="min-h-screen bg-white text-slate-800">
            {/* Top Hero Section: Horizontal Scrolling Image Carousel */}
            <HeroCarousel />

            <main className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
                <section aria-labelledby="performances-heading">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{t('home.liveWorship')}</p>
                            <h2 id="performances-heading" className="mt-1 text-2xl font-black text-slate-950">{t('home.upcomingPerformances')}</h2>
                        </div>
                        <Link to="/performances" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:text-blue-800">
                            {t('nav.performances')} <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                        {loading ? (
                            <p className="py-8 text-center text-sm text-slate-500">{t('common.loading')}</p>
                        ) : upcomingPerformances.length === 0 ? (
                            <p className="py-8 text-center text-sm text-slate-500">{t('home.noScheduled')}</p>
                        ) : (
                            upcomingPerformances.map((performance) => (
                                <Link
                                    key={performance.id}
                                    to={`/performances/${performance.id}`}
                                    className="grid gap-2 py-4 transition hover:bg-slate-50 sm:grid-cols-[1.4fr_1fr_1fr_1fr] sm:items-center sm:px-3"
                                >
                                    <span className="font-bold text-slate-900">{performance.title}</span>
                                    <span className="text-sm text-slate-600">
                                        <CalendarDays size={14} className="mr-1 inline text-blue-600" />
                                        {localizedDate(performance.date, language)}
                                    </span>
                                    <span className="truncate text-sm text-slate-600">
                                        <MapPin size={14} className="mr-1 inline text-slate-400" />
                                        {performance.location || performance.venue || t('home.locationTba')}
                                    </span>
                                    <span className="text-sm font-semibold text-slate-600">
                                        {performance.choir?.name || t('brand.choirName')}
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                </section>

                <section className="border-t border-slate-200 pt-10" aria-labelledby="about-heading">
                    <div className="max-w-2xl">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{t('home.about')}</p>
                        <h2 id="about-heading" className="mt-2 text-2xl font-black text-slate-950">{t('home.aboutHeading')}</h2>
                        <p className="mt-3 text-base leading-7 text-slate-600">{t('home.aboutText')}</p>
                        <Link to="/about" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:text-blue-800">
                            {t('home.readMore')} <ChevronRight size={16} />
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
