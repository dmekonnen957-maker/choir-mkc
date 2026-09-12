import { Music2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ABOUT_PLACEHOLDERS = [
    'Add the first paragraph about Yeka Meserete Kristos Church and its story here.',
    'Add the second paragraph about the choir ministry, worship, and community here.',
    'Add the third paragraph about the purpose of this music archive and its future here.',
];

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white text-slate-800">
            <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                <div className="border-b border-slate-200 pb-10">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">About Us</p>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
                        About Yeka Meserete Kristos
                    </h1>
                </div>

                <div className="space-y-6 py-10 text-base leading-8 text-slate-600 sm:py-12 sm:text-lg">
                    {ABOUT_PLACEHOLDERS.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                    ))}
                </div>

                <section className="border-t border-slate-200 pt-10 sm:pt-12" aria-labelledby="pastor-heading">
                    <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-center sm:gap-10">
                        <div className="h-40 w-40 shrink-0 overflow-hidden rounded-full border border-blue-100 bg-slate-100 ring-8 ring-slate-50">
                            <img
                                src="/images/p5.jpg"
                                alt="Pastor"
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <div className="max-w-2xl text-center sm:text-left">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Pastoral Message</p>
                            <h2 id="pastor-heading" className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                                Pastor Name
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">Pastor</p>
                            <p className="mt-5 text-base leading-7 text-slate-600">
                                Add a short message from the pastor here. This space can introduce the church, welcome visitors, and share a word about the choir ministry.
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
                        Explore Choir Songs
                    </Link>
                </div>
            </section>
        </main>
    );
}
