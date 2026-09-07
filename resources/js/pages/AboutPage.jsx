import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    Heart, 
    Compass, 
    Music, 
    Users, 
    Sparkles, 
    Award, 
    Calendar, 
    MapPin, 
    Mail, 
    Phone, 
    Clock, 
    ChevronRight, 
    Image as ImageIcon,
    Mic,
    BookOpen
} from 'lucide-react';
import Reveal from '../components/ui/Reveal';
import SectionHeading from '../components/public/SectionHeading';
import CoverImage from '../components/public/CoverImage';
import { fetchChoirs, fetchAllPerformances, fetchAllGallery, formatDate, isUpcoming } from '../lib/publicApi';
import { AboutSkeleton } from '../components/public/PublicSkeletons';

export default function AboutPage() {
    const [choirs, setChoirs] = useState([]);
    const [performances, setPerformances] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetchChoirs().catch(() => []),
            fetchAllPerformances().catch(() => []),
            fetchAllGallery().catch(() => []),
        ])
            .then(([choirData, perfData, galleryData]) => {
                setChoirs(choirData || []);
                setPerformances(perfData || []);
                setGallery(galleryData || []);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const pastPerformances = performances.filter((p) => !isUpcoming(p.date));

    // Dynamic timeline from past performances and key milestones
    const timelineMilestones = [
        {
            year: '1995',
            title: 'Founding of Yeka MKC Choir Ministry',
            description: 'Begun with a passionate group of vocalists dedicated to lifting praise in Sunday services.',
        },
        {
            year: '2008',
            title: 'Expansion into Multi-Choir Groups',
            description: 'Established distinct vocal teams, youth choirs, and worship ensembles to mentor new generations.',
        },
        {
            year: '2018',
            title: 'Annual Worship Festival & Outreach',
            description: 'Launched community outreach programs, recorded choral arrangements, and regional praise nights.',
        },
        {
            year: 'Present',
            title: 'Modern Digital Era & Unity',
            description: `Over ${choirs.length || 4} active worship teams uniting hundreds of dedicated singers across generations.`,
        },
    ];

    if (loading) {
        return <AboutSkeleton />;
    }

    return (
        <div className="bg-slate-50 min-h-screen text-slate-800">
            {/* 1. Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white py-20 lg:py-28">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_50%)] pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-3xl">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30 tracking-wider uppercase mb-6 backdrop-blur-sm">
                            <Sparkles size={14} className="text-blue-300" />
                            About Our Ministry
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                            Yeka MKC Choirs &amp; Worship Teams
                        </h1>
                        <p className="mt-6 text-lg sm:text-xl text-blue-100/90 leading-relaxed font-normal">
                            Dedicated to exalting God through the transformative power of choral music, spiritual unity, and heartfelt worship at Yeka Meserete Kristos Church.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Link
                                to="/choirs"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md transition-all duration-200"
                            >
                                <Users size={18} />
                                Meet Our Choirs
                            </Link>
                            <Link
                                to="/performances"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 backdrop-blur-sm transition-all duration-200"
                            >
                                <Calendar size={18} />
                                View Performances
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Mission & Vision Section */}
            <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Our Core Purpose</span>
                        <h2 className="text-3xl font-bold text-slate-900 mt-2">Mission &amp; Vision</h2>
                        <p className="text-slate-600 mt-3">Anchored in faith, committed to serving God and His church through sacred music.</p>
                    </div>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Reveal>
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition duration-300 h-full flex flex-col justify-between">
                            <div>
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                                    <Compass size={28} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h3>
                                <p className="text-slate-600 leading-relaxed text-base">
                                    To proclaim the Gospel of Jesus Christ and lead the congregation in uplifting worship through biblical, Christ-centered choral excellence, discipling singers into devoted followers of Christ.
                                </p>
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-sm font-medium text-blue-600">
                                <span>Proclamation · Discipleship · Praise</span>
                            </div>
                        </div>
                    </Reveal>

                    <Reveal>
                        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition duration-300 h-full flex flex-col justify-between">
                            <div>
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                                    <Heart size={28} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h3>
                                <p className="text-slate-600 leading-relaxed text-base">
                                    To be a vibrant, spirit-led choral community inspiring generations to experience God's love, cultivating world-class vocal worship that touches hearts and transforms lives across the nation.
                                </p>
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-sm font-medium text-indigo-600">
                                <span>Inspiration · Transformation · Unity</span>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* 3. Worship Ministry Pillars */}
            <section className="py-16 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal>
                        <SectionHeading
                            eyebrow="Ministry Foundation"
                            title="Four Pillars of Our Worship"
                            subtitle="The guiding principles shaping our rehearsals, performances, and spiritual life."
                        />
                    </Reveal>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                        <Reveal>
                            <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-100 hover:border-blue-200 transition">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                                    <Music size={22} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 mb-2">Choral Excellence</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Mastering harmony, vocal technique, and musical expression to offer our highest praise.
                                </p>
                            </div>
                        </Reveal>

                        <Reveal>
                            <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-100 hover:border-blue-200 transition">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                                    <BookOpen size={22} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 mb-2">Spiritual Growth</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Grounded in prayer, biblical devotion, and personal spiritual discipleship.
                                </p>
                            </div>
                        </Reveal>

                        <Reveal>
                            <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-100 hover:border-blue-200 transition">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                                    <Users size={22} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 mb-2">Family &amp; Community</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Fostering genuine brotherhood and sisterhood through mutual love and support.
                                </p>
                            </div>
                        </Reveal>

                        <Reveal>
                            <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-100 hover:border-blue-200 transition">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                                    <Award size={22} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 mb-2">Servant Leadership</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Equipping worship leaders with humility, discipline, and dedication to serve God's people.
                                </p>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* 4. Our Choir Groups Overview */}
            <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                        <div>
                            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Our Voices</span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-2">Our Choir Groups</h2>
                            <p className="text-slate-600 mt-2">Each choir group serves with distinct musical gifts and unique worship styles.</p>
                        </div>
                        <Link
                            to="/choirs"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm group"
                        >
                            View All Groups <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {choirs.map((choir) => (
                        <Reveal key={choir.id}>
                            <Link
                                to={`/choirs/${choir.id}`}
                                className="group block bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition duration-300"
                            >
                                <div className="h-44 bg-gradient-to-tr from-blue-900 to-indigo-800 relative overflow-hidden">
                                    {choir.logo_url || choir.logo_path ? (
                                        <CoverImage
                                            src={choir.logo_url || choir.logo_path}
                                            label={choir.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/30">
                                            <Mic size={48} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <div className="absolute bottom-3 left-4 right-4">
                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-200 transition-colors">
                                            {choir.name}
                                        </h3>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                        {choir.description || 'Dedicated to choral excellence and heartfelt worship in every service.'}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-500">
                                        <span>Status: <strong className="text-emerald-600 capitalize">{choir.status || 'Active'}</strong></span>
                                        <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                            Explore Choir <ChevronRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* 5. Our Story & Milestones */}
            <section className="py-16 sm:py-20 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal>
                        <SectionHeading
                            eyebrow="Our Heritage"
                            title="The Story of Yeka MKC Choirs"
                            subtitle="A continuous journey of faithful voices glorifying God and serving generations."
                        />
                    </Reveal>

                    <div className="mt-12 max-w-4xl mx-auto">
                        <div className="relative border-l-2 border-blue-200 ml-4 md:ml-32 space-y-10 py-4">
                            {timelineMilestones.map((item, idx) => (
                                <Reveal key={idx}>
                                    <div className="relative pl-8">
                                        {/* Year Badge */}
                                        <div className="absolute -left-[45px] top-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs shadow-md ring-4 ring-white">
                                            {idx + 1}
                                        </div>
                                        <div className="hidden md:block absolute -left-32 top-0.5 w-24 text-right font-bold text-blue-700 text-lg">
                                            {item.year}
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                                            <span className="md:hidden inline-block text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded mb-2">
                                                {item.year}
                                            </span>
                                            <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                                            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.description}</p>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Ministry Activities */}
            <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <SectionHeading
                        eyebrow="Ministry Life"
                        title="Activities &amp; Service"
                        subtitle="How we participate actively in weekly worship, training, and community life."
                    />
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                            <Clock size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Weekly Rehearsals</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Vocal training, choir sectionals, and song arrangements every week in preparation for services.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                            <Music size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Sunday Services</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Leading congregational worship, anthems, and special musical presentations during Sunday morning and afternoon services.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                            <Sparkles size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Festivals &amp; Concerts</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Special seasonal worship concerts, Easter, Christmas cantatas, and community choir gatherings.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                            <Heart size={20} />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Community &amp; Outreach</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Serving local ministries, regional churches, and sharing Christ's love through musical missions.
                        </p>
                    </div>
                </div>
            </section>

            {/* 7. Photo Gallery Preview */}
            {gallery.length > 0 && (
                <section className="py-16 bg-white border-t border-slate-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <Reveal>
                            <div className="text-center max-w-2xl mx-auto mb-10">
                                <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Moments of Praise</span>
                                <h2 className="text-3xl font-bold text-slate-900 mt-2">Ministry Gallery</h2>
                                <p className="text-slate-600 mt-2">Snapshots from our rehearsals, concerts, and Sunday worship services.</p>
                            </div>
                        </Reveal>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {gallery.slice(0, 8).map((item) => (
                                <Reveal key={item.id}>
                                    <div className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-sm">
                                        <CoverImage
                                            src={item.media_path}
                                            label={item.title || 'Worship moment'}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                            <p className="text-xs font-semibold text-white truncate">{item.title || 'Choir Gathering'}</p>
                                            {item.event_date && (
                                                <p className="text-[10px] text-blue-200">{formatDate(item.event_date)}</p>
                                            )}
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 8. Contact & Location Information */}
            <section className="py-16 sm:py-20 bg-slate-900 text-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider mb-4">
                                Get In Touch
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                                Connect With Yeka MKC Worship Ministry
                            </h2>
                            <p className="mt-4 text-slate-300 leading-relaxed text-base">
                                Whether you are interested in joining our choir ministry, requesting songs, or attending our next worship service, we welcome you with open arms.
                            </p>
                            <div className="mt-8 space-y-4 text-sm text-slate-300">
                                <div className="flex items-start gap-3">
                                    <MapPin size={20} className="text-blue-400 shrink-0 mt-0.5" />
                                    <span>Yeka Meserete Kristos Church, Addis Ababa, Ethiopia</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail size={20} className="text-blue-400 shrink-0" />
                                    <span>worship@yekamkc.org</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock size={20} className="text-blue-400 shrink-0" />
                                    <span>Sunday Services: 8:30 AM &amp; 10:30 AM (EAT)</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
                            <h3 className="text-xl font-bold text-white mb-4">Join Our Choir Ministry</h3>
                            <p className="text-sm text-slate-300 leading-relaxed mb-6">
                                If God has given you a heart for music and worship, reach out to your choir leadership or visit our rehearsals on Saturday afternoons.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/choirs"
                                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-center shadow transition"
                                >
                                    Explore Choirs
                                </Link>
                                <Link
                                    to="/performances"
                                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-center border border-white/20 transition"
                                >
                                    Upcoming Schedule
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
