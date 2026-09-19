import { Music2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function AboutPage() {
    const { t } = useLanguage();
    const paragraphs = [t('about.paragraph1'), t('about.paragraph2'), t('about.paragraph3')];

    return (
        <main className="min-h-screen bg-white text-slate-800">
            <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                <div className="border-b border-slate-200 pb-10">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">{t('about.eyebrow')}</p>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                        {t('about.title')}
                    </h1>
                </div>

                <div className="space-y-6 py-10 text-base leading-8 text-slate-600 sm:py-12 sm:text-lg">
                    {paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                    ))}
                </div>

                {/* Choir Group Photo Display Area */}
                <section className="my-8 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm" aria-label={t('about.groupPhotoTitle')}>
                    <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9]">
                        <img
                            src="/images/p1.jpg"
                            alt={t('about.groupPhotoTitle')}
                            className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 text-white">
                            <span className="inline-block rounded-full bg-blue-600/90 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white shadow-sm backdrop-blur-sm">
                                {t('brand.choirName')}
                            </span>
                            <h2 className="mt-2 text-xl sm:text-3xl font-black text-white drop-shadow-md">
                                {t('about.groupPhotoTitle')}
                            </h2>
                            <p className="mt-1 text-xs sm:text-sm text-slate-200 max-w-xl drop-shadow">
                                {t('about.groupPhotoSubtitle')}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="border-t border-slate-200 pt-10 sm:pt-12" aria-labelledby="pastor-heading">
                    <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-center sm:gap-10">
                        <div className="h-40 w-40 shrink-0 overflow-hidden rounded-full border border-blue-100 bg-slate-100 ring-8 ring-slate-50">
                            <img
                                src="/images/p5.jpg"
                                alt={t('about.pastor')}
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <div className="max-w-2xl text-center sm:text-left">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">{t('about.pastoralMessage')}</p>
                            <h2 id="pastor-heading" className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                                Pastor Kashune anbo
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">{t('about.pastor')}</p>
                            <p className="mt-5 text-base leading-7 text-slate-600">
                                {t('about.pastorMessage')}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="border-t border-slate-200 pt-10 sm:pt-12" aria-labelledby="pastor-heading-2">
                    <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-center sm:gap-10">
                        <div className="h-40 w-40 shrink-0 overflow-hidden rounded-full border border-blue-100 bg-slate-100 ring-8 ring-slate-50">
                            <img
                                src="/images/p5.jpg"
                                alt="Pastor asenafi"
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <div className="max-w-2xl text-center sm:text-left">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">{t('about.pastoralMessage')}</p>
                            <h2 id="pastor-heading-2" className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                                Pastor asenafi 
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">{t('about.pastor')}</p>
                            <p className="mt-5 text-base leading-7 text-slate-600">
                                {t('about.pastorMessage')}
                            </p>
                        </div>
                    </div>
                </section>

    

                <div className="mt-12 flex justify-center border-t border-slate-100 pt-8">
                    <Link
                        to="/songs"
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
                    >
                        <Music2 size={17} />
                        {t('about.exploreSongs')}
                    </Link>
                </div>
            </section>
        </main>
    );
}
