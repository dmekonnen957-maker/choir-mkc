import { useEffect, useState, useCallback } from 'react';
import { Palette, User, Loader2, Save, X, Check } from 'lucide-react';
import { api } from '../../axios';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';

const EMPTY = {
    name: '',
    choir_type: '',
    description: '',
    church_name: '',
    status: 'active',
    is_public: false,
    team_leader_id: '',
    uniform_primary_color: '#2563eb',
    uniform_secondary_color: '#ffffff',
    uniform_pattern: '',
    uniform_description: '',
};

const CHOIR_TYPES = [
    'Adult Choir',
    "Children's Choir",
    'Youth Choir',
    "Women's Choir",
    "Men's Choir",
    'Mixed Choir',
    'Worship Team',
    'Other',
];

const PRESET_COLORS = [
    { label: 'White', hex: '#ffffff' },
    { label: 'Black', hex: '#000000' },
    { label: 'Blue', hex: '#2563eb' },
    { label: 'Gold', hex: '#f59e0b' },
    { label: 'Emerald', hex: '#10b981' },
    { label: 'Rose', hex: '#f43f5e' },
    { label: 'Purple', hex: '#8b5cf6' },
    { label: 'Navy', hex: '#0b132b' },
    { label: 'Sky', hex: '#0ea5e9' },
    { label: 'Amber', hex: '#d97706' },
];

function ColorFieldPicker({ label, value, onChange, error }) {
    const safeValue = value && value.trim() ? value : '#ffffff';

    return (
        <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                {label}
            </label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={safeValue.startsWith('#') ? safeValue : '#ffffff'}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1 shadow-xs"
                />
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#RRGGBB"
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
            </div>

            {/* Quick Preset Buttons */}
            <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => {
                    const isSelected = (value || '').toLowerCase() === c.hex.toLowerCase();
                    return (
                        <button
                            key={c.hex}
                            type="button"
                            onClick={() => onChange(c.hex)}
                            className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                                isSelected ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={`${c.label} (${c.hex})`}
                        >
                            {isSelected && (
                                <Check
                                    size={12}
                                    className={c.hex === '#ffffff' ? 'text-slate-900' : 'text-white'}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
            {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
        </div>
    );
}

function ColorPreviewBadge({ primary, secondary, pattern }) {
    if (!primary && !secondary) return null;
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center -space-x-2">
                {primary && (
                    <span
                        className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: primary }}
                        title={`Primary: ${primary}`}
                    />
                )}
                {secondary && (
                    <span
                        className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: secondary }}
                        title={`Secondary: ${secondary}`}
                    />
                )}
            </div>
            <div className="text-xs text-slate-600">
                <p>
                    Primary: <span className="font-mono font-bold text-slate-900">{primary || '—'}</span>
                </p>
                <p>
                    Secondary: <span className="font-mono font-bold text-slate-900">{secondary || '—'}</span>
                </p>
                {pattern && (
                    <p>
                        Pattern: <span className="font-bold text-slate-900">{pattern}</span>
                    </p>
                )}
            </div>
        </div>
    );
}

export default function ChoirFormModal({ open, onClose, choir = null, onSaved }) {
    const isEdit = !!choir?.id;
    const [form, setForm] = useState(EMPTY);
    const [leaders, setLeaders] = useState([]);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const loadLeaders = useCallback(() => {
        Promise.all([
            api.get('/admin/users', { params: { role: 'team_leader', status: 'approved', per_page: 200 } }),
            api.get('/admin/users', { params: { role: 'admin', status: 'approved', per_page: 200 } }),
        ])
            .then(([r1, r2]) => {
                const map = new Map();
                [...(r1.data.data.items || []), ...(r2.data.data.items || [])].forEach((u) => {
                    map.set(u.id, u);
                });
                setLeaders([...map.values()]);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (open) {
            loadLeaders();
            setError('');
            setErrors({});

            if (choir) {
                setForm({
                    name: choir.name || '',
                    choir_type: choir.choir_type || '',
                    description: choir.description || '',
                    church_name: choir.church_name || '',
                    status: choir.status || 'active',
                    is_public: !!choir.is_public,
                    team_leader_id: choir.team_leader_id ? String(choir.team_leader_id) : '',
                    uniform_primary_color: choir.uniform_primary_color || '#2563eb',
                    uniform_secondary_color: choir.uniform_secondary_color || '#ffffff',
                    uniform_pattern: choir.uniform_pattern || '',
                    uniform_description: choir.uniform_description || '',
                });
            } else {
                setForm(EMPTY);
            }
        }
    }, [open, choir, loadLeaders]);

    const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const submit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});
        setError('');

        const payload = {
            ...form,
            is_public: !!form.is_public,
            team_leader_id: form.team_leader_id ? Number(form.team_leader_id) : null,
            uniform_primary_color: form.uniform_primary_color || null,
            uniform_secondary_color: form.uniform_secondary_color || null,
        };

        const req = isEdit
            ? api.put(`/admin/choirs/${choir.id}`, payload)
            : api.post('/admin/choirs', payload);

        req
            .then((res) => {
                const savedData = res.data.data;
                onSaved?.(savedData);
                onClose?.();
            })
            .catch((err) => {
                if (err.response?.status === 422) {
                    setErrors(err.response.data.errors || {});
                } else {
                    setError(err.response?.data?.message || 'Failed to save choir.');
                }
            })
            .finally(() => setSubmitting(false));
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? `Edit Choir: ${choir?.name}` : 'Create New Choir'}
            size="lg"
        >
            <form onSubmit={submit} className="space-y-5">
                {error && <Alert variant="error">{error}</Alert>}

                <div className="space-y-4">
                    <Input
                        label="Choir Name *"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        error={errors.name?.[0]}
                        placeholder="e.g. Gospel Worship Choir"
                        required
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Choir Type
                            </label>
                            <select
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                value={form.choir_type}
                                onChange={(e) => update('choir_type', e.target.value)}
                            >
                                <option value="">Select choir type</option>
                                {CHOIR_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                            {errors.choir_type?.[0] && (
                                <p className="mt-1 text-xs text-rose-500">{errors.choir_type[0]}</p>
                            )}
                        </div>

                        <Input
                            label="Church / Organization"
                            value={form.church_name}
                            onChange={(e) => update('church_name', e.target.value)}
                            error={errors.church_name?.[0]}
                            placeholder="e.g. EKA MKC Church"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            value={form.description}
                            onChange={(e) => update('description', e.target.value)}
                            placeholder="A short description of this choir ministry..."
                        />
                        {errors.description?.[0] && (
                            <p className="mt-1 text-xs text-rose-500">{errors.description[0]}</p>
                        )}
                    </div>

                    {/* Team Leader Select */}
                    <div>
                        <label className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700">
                            <User size={14} className="text-blue-600" /> Assigned Team Leader
                        </label>
                        <select
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            value={form.team_leader_id}
                            onChange={(e) => update('team_leader_id', e.target.value)}
                        >
                            <option value="">No Team Leader Assigned</option>
                            {leaders.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.name} {l.email ? `(${l.email})` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.team_leader_id?.[0] && (
                            <p className="mt-1 text-xs text-rose-500">{errors.team_leader_id[0]}</p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-1">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Status
                            </label>
                            <select
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                value={form.status}
                                onChange={(e) => update('status', e.target.value)}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <label className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                                checked={form.is_public}
                                onChange={(e) => update('is_public', e.target.checked)}
                            />
                            Listed on public registration &amp; website
                        </label>
                    </div>
                </div>

                {/* Theme & Uniform Section */}
                <div className="border-t border-slate-100 pt-5 space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <Palette size={18} className="text-blue-600" /> Uniform &amp; Colors Selection
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <ColorFieldPicker
                            label="Primary Color"
                            value={form.uniform_primary_color}
                            onChange={(v) => update('uniform_primary_color', v)}
                            error={errors.uniform_primary_color?.[0]}
                        />
                        <ColorFieldPicker
                            label="Secondary Color"
                            value={form.uniform_secondary_color}
                            onChange={(v) => update('uniform_secondary_color', v)}
                            error={errors.uniform_secondary_color?.[0]}
                        />
                    </div>

                    <ColorPreviewBadge
                        primary={form.uniform_primary_color}
                        secondary={form.uniform_secondary_color}
                        pattern={form.uniform_pattern}
                    />

                    <Input
                        label="Uniform Pattern"
                        value={form.uniform_pattern}
                        onChange={(e) => update('uniform_pattern', e.target.value)}
                        error={errors.uniform_pattern?.[0]}
                        placeholder="e.g. White Stripes, Gold Embroidery, Solid Blue..."
                    />

                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Uniform Description
                        </label>
                        <textarea
                            rows={2}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            value={form.uniform_description}
                            onChange={(e) => update('uniform_description', e.target.value)}
                            placeholder="Detailed description of choir uniform requirements..."
                        />
                        {errors.uniform_description?.[0] && (
                            <p className="mt-1 text-xs text-rose-500">{errors.uniform_description[0]}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? (
                            <Loader2 size={16} className="mr-1.5 animate-spin" />
                        ) : (
                            <Save size={16} className="mr-1.5" />
                        )}
                        {isEdit ? 'Save Changes' : 'Create Choir'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
