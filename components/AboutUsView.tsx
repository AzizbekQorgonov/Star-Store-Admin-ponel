import React, { useMemo, useState } from 'react';
import { Plus, Save, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, FileText, Link as LinkIcon, Languages, Globe2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SiteSection } from '../types';

interface AboutDraft {
  title: string;
  subtitle: string;
  image: string;
  linkUrl: string;
  linkTarget: 'title' | 'subtitle' | 'image';
  enabled: boolean;
  enTitle: string;
  enSubtitle: string;
  ruTitle: string;
  ruSubtitle: string;
}

const DEFAULT_DRAFT: AboutDraft = {
  title: 'Biz haqimizda',
  subtitle: 'Brendimiz tarixi, qadriyatlari va jamoamiz haqida qisqacha ma\'lumot.',
  image: '',
  linkUrl: '',
  linkTarget: 'title',
  enabled: true,
  enTitle: '',
  enSubtitle: '',
  ruTitle: '',
  ruSubtitle: '',
};

const normalizeAboutOrder = (items: SiteSection[]) =>
  items.map((item, idx) => ({ ...item, orderIndex: idx }));

const resolveApiBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envUrl) return envUrl;
  if (import.meta.env.PROD) return 'https://star-store-backend.onrender.com';
  return 'http://localhost:5000';
};

const createAboutSection = (insertIndex: number, draft?: AboutDraft): SiteSection => ({
  id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : Date.now().toString(),
  type: 'about_block',
  page: 'about',
  orderIndex: insertIndex,
  enabled: draft?.enabled ?? true,
  data: {
    title: draft?.title || DEFAULT_DRAFT.title,
    subtitle: draft?.subtitle || DEFAULT_DRAFT.subtitle,
    image: draft?.image || '',
    linkUrl: draft?.linkUrl || '',
    linkTarget: draft?.linkTarget || 'title',
  },
});

const AboutUsView: React.FC = () => {
  const {
    siteSections,
    upsertSiteSection,
    deleteSiteSection,
    reorderSiteSections,
    addNotification,
  } = useStore();

  const aboutSections = useMemo(
    () => siteSections
      .filter((s) => (s.page || 'home') === 'about' && s.type === 'about_block')
      .sort((a, b) => a.orderIndex - b.orderIndex),
    [siteSections]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = aboutSections.find((s) => s.id === selectedId) || null;
  const [draft, setDraft] = useState<AboutDraft>(DEFAULT_DRAFT);

  const [previewUrl, setPreviewUrl] = useState(() => {
    if (typeof window === 'undefined') return 'http://localhost:5173/';
    return localStorage.getItem('about_preview_url') || 'http://localhost:5173/';
  });

  React.useEffect(() => {
    if (!selected) {
      setDraft(DEFAULT_DRAFT);
      return;
    }

    const data = selected.data || {};
    setDraft({
      title: data.title || '',
      subtitle: data.subtitle || '',
      image: data.image || '',
      linkUrl: data.linkUrl || '',
      linkTarget: (data.linkTarget === 'subtitle' || data.linkTarget === 'image') ? data.linkTarget : 'title',
      enabled: selected.enabled,
      enTitle: data.i18n?.en?.title || '',
      enSubtitle: data.i18n?.en?.subtitle || '',
      ruTitle: data.i18n?.ru?.title || '',
      ruSubtitle: data.i18n?.ru?.subtitle || '',
    });
  }, [selected]);

  const syncAboutSections = async (nextAboutSections: SiteSection[]) => {
    const normalizedAbout = normalizeAboutOrder(nextAboutSections);
    const otherPages = siteSections.filter((s) => (s.page || 'home') !== 'about');
    await reorderSiteSections([...otherPages, ...normalizedAbout]);
  };

  React.useEffect(() => {
    const handler = async (event: MessageEvent) => {
      const payload = event.data;
      if (!payload || payload.source !== 'site-builder' || payload.page !== 'about') return;

      if (payload.type === 'select') {
        setSelectedId(payload.sectionId || null);
        return;
      }

      if (payload.type === 'add') {
        const index = Math.max(0, Math.min(Number(payload.insertIndex ?? aboutSections.length), aboutSections.length));
        const next = createAboutSection(index, DEFAULT_DRAFT);
        const arranged = [
          ...aboutSections.slice(0, index),
          next,
          ...aboutSections.slice(index),
        ];
        await syncAboutSections(arranged);
        setSelectedId(next.id);
        addNotification('success', 'Yangi About blok qo\'shildi');
        return;
      }

      if (payload.type === 'delete' && payload.sectionId) {
        await deleteSiteSection(payload.sectionId);
        if (selectedId === payload.sectionId) {
          setSelectedId(null);
        }
        addNotification('info', 'About blok o\'chirildi');
        return;
      }

      if (payload.type === 'set-link' && payload.sectionId) {
        const target = aboutSections.find((s) => s.id === payload.sectionId);
        if (!target) return;
        const data = target.data || {};
        const nextSection: SiteSection = {
          ...target,
          data: {
            ...data,
            linkTarget: payload.linkTarget || data.linkTarget || 'title',
            linkUrl: payload.linkUrl || data.linkUrl || '',
          },
        };
        await upsertSiteSection(nextSection);
        if (selectedId === payload.sectionId) {
          setDraft((prev) => ({
            ...prev,
            linkTarget: nextSection.data?.linkTarget || 'title',
            linkUrl: nextSection.data?.linkUrl || '',
          }));
        }
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [aboutSections, selectedId, siteSections]);

  const moveSection = async (id: string, dir: 'up' | 'down') => {
    const idx = aboutSections.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= aboutSections.length) return;

    const nextAbout = [...aboutSections];
    const temp = nextAbout[idx];
    nextAbout[idx] = nextAbout[target];
    nextAbout[target] = temp;
    await syncAboutSections(nextAbout);
  };

  const startCreate = () => {
    setSelectedId(null);
    setDraft(DEFAULT_DRAFT);
  };

  const addAtEnd = async () => {
    const next = createAboutSection(aboutSections.length, DEFAULT_DRAFT);
    await syncAboutSections([...aboutSections, next]);
    setSelectedId(next.id);
    addNotification('success', 'Yangi About blok qo\'shildi');
  };

  const save = async () => {
    const title = draft.title.trim();
    if (!title) {
      addNotification('warning', 'Sarlavha kiritish majburiy');
      return;
    }

    const translateText = async (text: string, target: 'en' | 'ru') => {
      if (!text) return '';
      try {
        const api = import.meta.env.VITE_TRANSLATE_API_URL || `${resolveApiBaseUrl()}/translate`;
        const res = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: text, source: 'uz', target })
        });
        const json = await res.json();
        return json?.translatedText || text;
      } catch {
        return text;
      }
    };

    const enTitle = draft.enTitle.trim() || await translateText(title, 'en');
    const enSubtitle = draft.enSubtitle.trim() || await translateText(draft.subtitle, 'en');
    const ruTitle = draft.ruTitle.trim() || await translateText(title, 'ru');
    const ruSubtitle = draft.ruSubtitle.trim() || await translateText(draft.subtitle, 'ru');

    if (!selected) {
      const next = createAboutSection(aboutSections.length, draft);
      const nextWithI18n: SiteSection = {
        ...next,
        data: {
          ...(next.data || {}),
          i18n: {
            en: { title: enTitle, subtitle: enSubtitle },
            ru: { title: ruTitle, subtitle: ruSubtitle },
          },
        },
      };
      await syncAboutSections([...aboutSections, nextWithI18n]);
      setSelectedId(next.id);
      addNotification('success', 'Yangi About blok qo\'shildi');
      return;
    }

    const section: SiteSection = {
      ...selected,
      enabled: draft.enabled,
      data: {
        title,
        subtitle: draft.subtitle,
        image: draft.image,
        linkUrl: draft.linkUrl,
        linkTarget: draft.linkTarget,
        i18n: {
          en: { title: enTitle, subtitle: enSubtitle },
          ru: { title: ruTitle, subtitle: ruSubtitle },
        },
      },
    };

    await upsertSiteSection(section);
    addNotification('success', 'About blok yangilandi');
  };

  const remove = async (id: string) => {
    await deleteSiteSection(id);
    if (selectedId === id) {
      setSelectedId(null);
      setDraft(DEFAULT_DRAFT);
    }
    addNotification('info', 'About blok o\'chirildi');
  };

  const toggleEnabled = async (section: SiteSection) => {
    await upsertSiteSection({ ...section, enabled: !section.enabled });
  };

  const savePreviewUrl = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('about_preview_url', previewUrl);
  };

  const normalizePreviewUrl = (url: string) => {
    if (url.includes('#about')) return url;
    return url
      .replace(/#.*$/, '')
      .replace(/\/about\/?$/, '/')
      .replace(/\/?$/, '/#about');
  };

  const getPreviewWithBuilder = (url: string) => {
    try {
      const parsed = new URL(normalizePreviewUrl(url));
      parsed.searchParams.set('builder', '1');
      return parsed.toString();
    } catch {
      const base = normalizePreviewUrl(url);
      return base.includes('?') ? `${base}&builder=1` : `${base}?builder=1`;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary dark:text-white">About Us Page</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">About sahifasi uchun bloklarni yaratish, live preview orqali kuzatish va boshqarish.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
            placeholder="Preview URL (masalan: http://localhost:3000/)"
            className="w-[320px] max-w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          />
          <button
            onClick={savePreviewUrl}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2"
          >
            <LinkIcon size={14} /> Saqlash
          </button>
          <button
            onClick={startCreate}
            className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-sm flex items-center gap-2"
          >
            <Plus size={14} /> Yangi blok
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-800 dark:text-white">Bloklar ro'yxati</h3>
            <button onClick={addAtEnd} className="text-xs px-2.5 py-1.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
              + Qo'shish
            </button>
          </div>

          {aboutSections.length === 0 && (
            <div className="text-sm text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center">
              Hozircha blok yo'q
            </div>
          )}

          {aboutSections.map((section, idx) => {
            const data = section.data || {};
            return (
              <div
                key={section.id}
                className={`p-3 rounded-lg border ${selectedId === section.id ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-slate-900`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => setSelectedId(section.id)} className="text-left flex-1">
                    <div className="text-sm font-medium text-slate-800 dark:text-white line-clamp-1">{data.title || `About blok #${idx + 1}`}</div>
                    <div className="text-xs text-slate-400 mt-1 line-clamp-2">{data.subtitle || 'Subtitle yo\'q'}</div>
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveSection(section.id, 'up')} className="p-1 text-slate-400 hover:text-indigo-600"><ArrowUp size={14} /></button>
                    <button onClick={() => moveSection(section.id, 'down')} className="p-1 text-slate-400 hover:text-indigo-600"><ArrowDown size={14} /></button>
                    <button onClick={() => toggleEnabled(section)} className="p-1 text-slate-400 hover:text-indigo-600">
                      {section.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => remove(section.id)} className="p-1 text-red-500 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <FileText size={16} /> {selected ? 'Blokni tahrirlash' : 'Yangi blok'}
              </h3>
              <button onClick={save} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2">
                <Save size={14} /> Saqlash
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm text-slate-600 dark:text-slate-300">Sarlavha</label>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-slate-600 dark:text-slate-300">Tavsif</label>
                <textarea
                  rows={4}
                  value={draft.subtitle}
                  onChange={(e) => setDraft((prev) => ({ ...prev, subtitle: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-slate-600 dark:text-slate-300">Rasm URL</label>
                <input
                  value={draft.image}
                  onChange={(e) => setDraft((prev) => ({ ...prev, image: e.target.value }))}
                  placeholder="https://..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 dark:text-slate-300">Link URL</label>
                <input
                  value={draft.linkUrl}
                  onChange={(e) => setDraft((prev) => ({ ...prev, linkUrl: e.target.value }))}
                  placeholder="/catalog yoki https://..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600 dark:text-slate-300">Link biriktirish joyi</label>
                <select
                  value={draft.linkTarget}
                  onChange={(e) => setDraft((prev) => ({ ...prev, linkTarget: e.target.value as AboutDraft['linkTarget'] }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                >
                  <option value="title">Title</option>
                  <option value="subtitle">Subtitle</option>
                  <option value="image">Image</option>
                </select>
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="about-enabled"
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(e) => setDraft((prev) => ({ ...prev, enabled: e.target.checked }))}
                />
                <label htmlFor="about-enabled" className="text-sm text-slate-600 dark:text-slate-300">Faol (enabled)</label>
              </div>

              <div className="md:col-span-2 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/70 to-violet-50/70 dark:from-slate-900 dark:to-indigo-950/20 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  <Languages size={16} />
                  Tarjima (EN / RU)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Globe2 size={12} /> EN
                    </label>
                    <input
                      value={draft.enTitle}
                      onChange={(e) => setDraft((prev) => ({ ...prev, enTitle: e.target.value }))}
                      placeholder="About us"
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-white/90 dark:bg-slate-900 text-sm"
                    />
                    <textarea
                      rows={3}
                      value={draft.enSubtitle}
                      onChange={(e) => setDraft((prev) => ({ ...prev, enSubtitle: e.target.value }))}
                      placeholder="Short description in English..."
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-white/90 dark:bg-slate-900 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Globe2 size={12} /> RU
                    </label>
                    <input
                      value={draft.ruTitle}
                      onChange={(e) => setDraft((prev) => ({ ...prev, ruTitle: e.target.value }))}
                      placeholder="О нас"
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-white/90 dark:bg-slate-900 text-sm"
                    />
                    <textarea
                      rows={3}
                      value={draft.ruSubtitle}
                      onChange={(e) => setDraft((prev) => ({ ...prev, ruSubtitle: e.target.value }))}
                      placeholder="Краткое описание на русском..."
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-white/90 dark:bg-slate-900 text-sm"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tarjima inputlari bo'sh bo'lsa, saqlashda avtomatik tarjima qilinadi.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 dark:text-white">Live Preview</h3>
              <a href={getPreviewWithBuilder(previewUrl)} target="_blank" rel="noreferrer" className="text-xs text-indigo-600">Yangi tabda ochish</a>
            </div>
            <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <iframe title="about-preview" src={getPreviewWithBuilder(previewUrl)} className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsView;
