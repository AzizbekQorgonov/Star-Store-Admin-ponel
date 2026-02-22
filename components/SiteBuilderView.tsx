import React, { useMemo, useState } from 'react';
import { Plus, GripVertical, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Save, Link as LinkIcon } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SiteSection } from '../types';
import { imageLimitLabel, validateImageFile } from '../utils/image';
import { uploadImageToCloudinary } from '../services/upload';

const SECTION_TYPES = [
  { id: 'hero', label: 'Hero' },
  { id: 'banner', label: 'Banner' },
  { id: 'text', label: 'Text Block' },
  { id: 'about_block', label: 'About Block' },
  { id: 'about_banner', label: 'About Banner' },
  { id: 'featured', label: 'Featured Products' },
  { id: 'categories', label: 'Categories' },
  { id: 'brand_grid', label: 'Brand Grid' },
  { id: 'smart_discovery', label: 'Smart Discovery' },
  { id: 'trust', label: 'Trust Section' },
  { id: 'spacer', label: 'Spacer' },
];

const DEFAULT_DATA: Record<string, any> = {
  hero: {
    slides: [
      {
        title: 'Yangi kolleksiya',
        subtitle: 'Eng so‘nggi urfdagi mahsulotlar',
        bgImage: '',
        image: '',
        buttonText: 'Xarid qilish',
        buttonLink: '/catalog',
        newsLink: '',
      }
    ]
  },
  banner: {
    slides: [
      {
        title: 'Chegirma haftaligi',
        subtitle: '50% gacha chegirmalar',
        image: '',
        link: '/catalog',
      }
    ]
  },
  text: {
    title: 'Yangilik',
    body: 'Bu yerga qisqa matn yozing.',
    align: 'left',
  },
  about_banner: {
    title: 'Biz haqimizda',
    subtitle: 'Star Store jamoasi mijozlarga sifatli mahsulot va tezkor xizmat taqdim etadi.',
    buttonText: 'Batafsil',
    buttonLink: '#about',
  },
  spacer: {
    height: 32,
  },
  footer: {
    socialLinks: [
      { label: 'Telegram', url: 'https://t.me/' },
      { label: 'Instagram', url: 'https://instagram.com/' },
      { label: 'YouTube', url: 'https://youtube.com/' },
    ],
    footerLinks: [
      { group: 'about', label: 'Biz haqimizda', page: 'about' },
      { group: 'about', label: 'Barqarorlik', page: 'sustainability' },
      { group: 'about', label: 'Karyera', page: 'careers' },
      { group: 'help', label: 'Buyurtma holati', page: 'order-status' },
      { group: 'help', label: 'Yetkazib berish', page: 'shipping' },
      { group: 'help', label: 'Qaytarish', page: 'returns' },
      { group: 'legal', label: 'Maxfiylik siyosati', page: 'privacy-policy' },
      { group: 'legal', label: 'Xizmat shartlari', page: 'terms-of-service' },
      { group: 'legal', label: 'Cookies', page: 'cookies' },
    ]
  },
  about_block: {
    title: 'Biz haqimizda',
    subtitle: 'Qisqa tavsif shu yerda.',
    image: '',
    linkUrl: '',
    linkTarget: 'title'
  }
};

const DEFAULT_LAYOUT: Array<{ type: string; data?: Record<string, any>; page?: string }> = [
  { type: 'hero', data: DEFAULT_DATA.hero, page: 'home' },
  { type: 'categories', page: 'home' },
  { type: 'about_banner', data: DEFAULT_DATA.about_banner, page: 'home' },
  { type: 'featured', page: 'home' },
  { type: 'brand_grid', page: 'home' },
  { type: 'smart_discovery', page: 'home' },
  { type: 'trust', page: 'home' },
  { type: 'footer', data: DEFAULT_DATA.footer, page: 'home' },
  { type: 'about_block', data: DEFAULT_DATA.about_block, page: 'about' },
];

const normalizeOrder = (sections: SiteSection[]) =>
  sections.map((s, idx) => ({ ...s, orderIndex: idx }));

const SiteBuilderView: React.FC = () => {
  const { siteSections, upsertSiteSection, deleteSiteSection, reorderSiteSections, addNotification } = useStore();
  const [initialized, setInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number>(0);
  const [newType, setNewType] = useState<string>('hero');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newPageName, setNewPageName] = useState('');

  const [previewUrl, setPreviewUrl] = useState(() => {
    if (typeof window === 'undefined') return 'http://localhost:5173/';
    return localStorage.getItem('site_builder_preview_url') || 'http://localhost:5173/';
  });

  const allSections = useMemo(
    () => [...siteSections].sort((a, b) => a.orderIndex - b.orderIndex),
    [siteSections]
  );

  const sections = useMemo(
    () => allSections.filter(s => (s.page || 'home') === currentPage).sort((a, b) => a.orderIndex - b.orderIndex),
    [allSections, currentPage]
  );

  const availablePages = useMemo(() => {
    const set = new Set<string>(['home', 'about']);
    allSections.forEach((s) => set.add(s.page || 'home'));
    return Array.from(set);
  }, [allSections]);

  React.useEffect(() => {
    if (initialized) return;
    if (siteSections.length === 0) {
      const pageCounters: Record<string, number> = {};
      const defaults: SiteSection[] = DEFAULT_LAYOUT.map((item, idx) => {
        const page = item.page || 'home';
        pageCounters[page] = (pageCounters[page] || 0) + 1;
        return {
          id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}-${idx}`,
          type: item.type,
          orderIndex: pageCounters[page] - 1,
          page,
          enabled: true,
          data: item.data || {},
        };
      });
      reorderSiteSections(defaults);
    }
    setInitialized(true);
  }, [initialized, siteSections.length]);

  React.useEffect(() => {
    const handler = (event: MessageEvent) => {
      const payload = event.data;
      if (!payload || payload.source !== 'site-builder') return;

      const pageFromPayload = typeof payload.page === 'string' && payload.page.trim() ? payload.page : 'home';
      const pageSections = allSections.filter(s => (s.page || 'home') === pageFromPayload);

      if (payload.page && typeof payload.page === 'string') {
        setCurrentPage(payload.page);
      }
      if (payload.type === 'select') {
        setSelectedId(payload.sectionId || null);
      }
      if (payload.type === 'add') {
        const index = Number(payload.insertIndex ?? pageSections.length);
        openAddModal(index, pageFromPayload);
      }
      if (payload.type === 'add-slide') {
        const sectionId = payload.sectionId;
        const target = allSections.find(s => s.id === sectionId);
        if (!target) return;
        const data = target.data || {};
        const slides = Array.isArray(data.slides) ? data.slides : [];
        const defaultSlide = target.type === 'banner'
          ? { title: 'Yangi banner', subtitle: '', image: '', link: '' }
          : { title: 'Yangi hero', subtitle: '', bgImage: '', image: '', buttonText: 'Xarid qilish', buttonLink: '/catalog', newsLink: '' };
        const next = { ...target, data: { ...data, slides: [...slides, defaultSlide] } };
        upsertSiteSection(next);
        setSelectedId(sectionId);
      }
      if (payload.type === 'set-link') {
        const { sectionId, linkTarget, linkUrl } = payload;
        const target = allSections.find(s => s.id === sectionId);
        if (!target) return;
        const data = target.data || {};
        const next = { ...target, data: { ...data, linkTarget, linkUrl } };
        upsertSiteSection(next);
        setSelectedId(sectionId);
      }
      if (payload.type === 'delete') {
        if (payload.sectionId) handleDelete(payload.sectionId);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [allSections, currentPage]);

  const selected = sections.find(s => s.id === selectedId) || null;
  const [draft, setDraft] = useState<Record<string, any> | null>(null);

  React.useEffect(() => {
    if (selected) {
      const data = selected.data || {};
      if ((selected.type === 'hero' || selected.type === 'banner') && !Array.isArray(data.slides)) {
        const fallbackSlide = selected.type === 'banner'
          ? { title: data.title || 'Banner', subtitle: data.subtitle || '', image: data.image || '', link: data.link || '' }
          : { title: data.title || 'Hero', subtitle: data.subtitle || '', bgImage: data.bgImage || '', image: data.image || '', buttonText: data.buttonText || 'Xarid qilish', buttonLink: data.buttonLink || '/catalog', newsLink: data.newsLink || '' };
        setDraft({ ...data, slides: [fallbackSlide] });
      } else {
        setDraft(data);
      }
    }
    else setDraft(null);
    setActiveSlideIndex(0);
  }, [selectedId, selected]);

  const openAddModal = (index: number, pageOverride?: string) => {
    if (pageOverride && pageOverride !== currentPage) {
      setCurrentPage(pageOverride);
    }
    setInsertIndex(index);
    setNewType('hero');
    setIsAddOpen(true);
  };

  const createPage = () => {
    const slug = newPageName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    if (!slug) {
      addNotification('warning', 'Sahifa nomini kiriting');
      return;
    }
    if (availablePages.includes(slug)) {
      addNotification('warning', 'Bu sahifa allaqachon mavjud');
      return;
    }
    setCurrentPage(slug);
    setNewPageName('');
    addNotification('success', `"${slug}" sahifasi tanlandi`);
  };

  const deleteCurrentPage = async () => {
    if (currentPage === 'home' || isSaving) return;
    setIsSaving(true);
    const toDelete = allSections.filter((s) => (s.page || 'home') === currentPage);
    try {
      await Promise.all(toDelete.map((section) => deleteSiteSection(section.id)));
      setCurrentPage('home');
      setSelectedId(null);
      addNotification('info', 'Sahifa o‘chirildi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSection = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const newId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : Date.now().toString();
    const sourceData = DEFAULT_DATA[newType] || {};
    const baseData = typeof structuredClone === 'function'
      ? structuredClone(sourceData)
      : JSON.parse(JSON.stringify(sourceData));
    const next: SiteSection = {
      id: newId,
      type: newType,
      orderIndex: insertIndex,
      page: currentPage,
      enabled: true,
      data: baseData,
    };
    const nextList = normalizeOrder([
      ...sections.slice(0, insertIndex),
      next,
      ...sections.slice(insertIndex),
    ]);
    try {
      await reorderSiteSections(nextList);
      setSelectedId(newId);
      setIsAddOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    if (isSaving) return;
    const idx = sections.findIndex(s => s.id === id);
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || target < 0 || target >= sections.length) return;
    const swapped = [...sections];
    const temp = swapped[idx];
    swapped[idx] = swapped[target];
    swapped[target] = temp;
    setIsSaving(true);
    try {
      await reorderSiteSections(normalizeOrder(swapped));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnabled = async (section: SiteSection) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await upsertSiteSection({ ...section, enabled: !section.enabled });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selected || isSaving) return;
    setIsSaving(true);
    const translateText = async (text: string, target: 'en' | 'ru') => {
      if (!text) return text;
      try {
        const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').trim();
        const api = import.meta.env.VITE_TRANSLATE_API_URL || `${apiBase}/translate`;
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

    const data = draft || {};
    const i18n: any = { en: {}, ru: {} };

    if (selected.type === 'hero' || selected.type === 'banner') {
      const slides = Array.isArray(data.slides) ? data.slides : [];
      i18n.en.slides = [];
      i18n.ru.slides = [];
      for (const slide of slides) {
        i18n.en.slides.push({
          title: await translateText(slide.title || '', 'en'),
          subtitle: await translateText(slide.subtitle || '', 'en'),
          buttonText: slide.buttonText ? await translateText(slide.buttonText, 'en') : ''
        });
        i18n.ru.slides.push({
          title: await translateText(slide.title || '', 'ru'),
          subtitle: await translateText(slide.subtitle || '', 'ru'),
          buttonText: slide.buttonText ? await translateText(slide.buttonText, 'ru') : ''
        });
      }
    }

    if (selected.type === 'text' || selected.type === 'about_banner' || selected.type === 'featured' || selected.type === 'about_block') {
      if (data.title) {
        i18n.en.title = await translateText(data.title, 'en');
        i18n.ru.title = await translateText(data.title, 'ru');
      }
      if (data.subtitle || data.body) {
        const base = data.subtitle || data.body || '';
        i18n.en.subtitle = await translateText(base, 'en');
        i18n.ru.subtitle = await translateText(base, 'ru');
      }
      if (data.linkText) {
        i18n.en.linkText = await translateText(data.linkText, 'en');
        i18n.ru.linkText = await translateText(data.linkText, 'ru');
      }
      if (data.buttonText) {
        i18n.en.buttonText = await translateText(data.buttonText, 'en');
        i18n.ru.buttonText = await translateText(data.buttonText, 'ru');
      }
    }

    if (selected.type === 'footer') {
      const footerLinks = Array.isArray(data.footerLinks) ? data.footerLinks : [];
      i18n.en.footerLinks = [];
      i18n.ru.footerLinks = [];
      for (const link of footerLinks) {
        i18n.en.footerLinks.push({
          ...link,
          label: await translateText(link.label || '', 'en'),
        });
        i18n.ru.footerLinks.push({
          ...link,
          label: await translateText(link.label || '', 'ru'),
        });
      }
    }

    const nextData = { ...data, i18n };
    try {
      await upsertSiteSection({ ...selected, data: nextData });
      addNotification('success', 'Bo‘lim saqlandi');
    } finally {
      setIsSaving(false);
    }
  };

  const uploadImage = async (file: File) => {
    const imageError = validateImageFile(file);
    if (imageError) {
      addNotification('error', imageError);
      return '';
    }

    setIsUploading(true);
    try {
      return await uploadImageToCloudinary(file, 'site');
    } catch (error) {
      addNotification('error', (error as Error).message || 'Image upload failed');
      return '';
    } finally {
      setIsUploading(false);
    }
  };

  const setSlideField = (field: string, value: string) => {
    const slides = Array.isArray(draft?.slides) ? [...draft.slides] : [];
    if (!slides[activeSlideIndex]) slides[activeSlideIndex] = {};
    slides[activeSlideIndex] = { ...slides[activeSlideIndex], [field]: value };
    setDraft(prev => ({ ...(prev || {}), slides }));
  };

  const handleDelete = async (id: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await deleteSiteSection(id);
      setSelectedId(prev => (prev === id ? null : prev));
    } finally {
      setIsSaving(false);
    }
  };

  const savePreviewUrl = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('site_builder_preview_url', previewUrl);
  };

  const normalizePreviewUrl = (url: string) => {
    const base = url.replace(/#.*$/, '').replace(/\/about\/?$/, '/').replace(/\/?$/, '/');
    if (currentPage === 'home') return base;
    return `${base}#page/${currentPage}`;
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
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary dark:text-white">Pages Manager</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Barcha sahifalar va footer linklarini shu joydan boshqaring.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {availablePages.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                disabled={isSaving}
                className={`px-3 py-1.5 rounded-lg text-xs capitalize ${currentPage === page ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                {page.replace(/-/g, ' ')}
              </button>
            ))}
            <div className="flex items-center gap-2">
              <input
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                disabled={isSaving}
                placeholder="new-page"
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
              <button disabled={isSaving} onClick={createPage} className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 text-white dark:bg-slate-700 disabled:opacity-50">
                + Page
              </button>
              {currentPage !== 'home' && (
                <button disabled={isSaving} onClick={deleteCurrentPage} className="px-2.5 py-1.5 text-xs rounded-lg bg-red-600 text-white disabled:opacity-50">
                  Delete Page
                </button>
              )}
            </div>
          </div>
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
            disabled={isSaving}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <LinkIcon size={14} /> Saqlash
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Layout column */}
        <div className="xl:col-span-1 space-y-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 dark:text-white">Layout</h3>
              <button
                onClick={() => openAddModal(0)}
                disabled={isSaving}
                className="text-xs px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
              >
                <Plus size={12} /> Yangi bo‘lim
              </button>
            </div>

            <div className="space-y-2">
              {sections.map((section, index) => (
                <div key={section.id} className="space-y-2">
                  <button
                    onClick={() => openAddModal(index)}
                    disabled={isSaving}
                    className="w-full text-xs py-1.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-500 hover:border-indigo-300 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Plus size={12} /> Bu yerga qo‘shish
                  </button>

                  <div
                    className={`p-3 rounded-lg border ${selectedId === section.id ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-slate-900`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <GripVertical size={16} className="text-slate-400" />
                        <div>
                          <div className="text-sm font-medium text-slate-800 dark:text-white">{section.type}</div>
                          <div className="text-xs text-slate-400">#{index + 1}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button disabled={isSaving} onClick={() => handleMove(section.id, 'up')} className="p-1 text-slate-400 hover:text-indigo-500 disabled:opacity-50">
                          <ArrowUp size={14} />
                        </button>
                        <button disabled={isSaving} onClick={() => handleMove(section.id, 'down')} className="p-1 text-slate-400 hover:text-indigo-500 disabled:opacity-50">
                          <ArrowDown size={14} />
                        </button>
                        <button disabled={isSaving} onClick={() => handleToggleEnabled(section)} className="p-1 text-slate-400 hover:text-indigo-500 disabled:opacity-50">
                          {section.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button disabled={isSaving} onClick={() => setSelectedId(section.id)} className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50">
                          Tahrirlash
                        </button>
                        {section.type !== 'footer' && (
                          <button disabled={isSaving} onClick={() => handleDelete(section.id)} className="p-1 text-red-500 hover:text-red-600 disabled:opacity-50">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => openAddModal(sections.length)}
                disabled={isSaving}
                className="w-full text-xs py-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-500 hover:border-indigo-300 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Plus size={12} /> Oxiriga qo‘shish
              </button>
            </div>
          </div>
        </div>

        {/* Editor + Preview */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-white">Bo‘lim sozlamalari</h3>
              {selected && (
                <button disabled={isSaving} onClick={handleSave} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2 disabled:opacity-50">
                  <Save size={14} /> {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              )}
            </div>

            {!selected && (
              <div className="text-sm text-slate-500">Tahrirlash uchun bo‘limni tanlang.</div>
            )}

            {selected && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-xs uppercase tracking-wider text-slate-400">Type</div>
                <div className="text-sm text-slate-700 dark:text-slate-200">{selected.type}</div>

                {(selected.type === 'hero' || selected.type === 'banner') && (
                  <>
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Slides</div>
                        <button
                          onClick={() => {
                            const slides = Array.isArray(draft?.slides) ? [...draft.slides] : [];
                            const newSlide = selected.type === 'banner'
                              ? { title: 'Yangi banner', subtitle: '', image: '', link: '' }
                              : { title: 'Yangi hero', subtitle: '', bgImage: '', image: '', buttonText: 'Xarid qilish', buttonLink: '/catalog', newsLink: '' };
                            slides.push(newSlide);
                            setDraft(prev => ({ ...(prev || {}), slides }));
                            setActiveSlideIndex(slides.length - 1);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs"
                        >
                          + Slide
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(draft?.slides) ? draft.slides : []).map((_: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setActiveSlideIndex(idx)}
                            className={`px-3 py-1.5 rounded-full text-xs border ${activeSlideIndex === idx ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                          >
                            Slide {idx + 1}
                          </button>
                        ))}
                        {(Array.isArray(draft?.slides) ? draft.slides : []).length > 1 && (
                          <button
                            onClick={() => {
                              const slides = Array.isArray(draft?.slides) ? [...draft.slides] : [];
                              slides.splice(activeSlideIndex, 1);
                              setDraft(prev => ({ ...(prev || {}), slides }));
                              setActiveSlideIndex(Math.max(0, activeSlideIndex - 1));
                            }}
                            className="px-3 py-1.5 rounded-full text-xs border border-red-200 text-red-600"
                          >
                            Delete slide
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {(selected.type === 'hero' || selected.type === 'banner' || selected.type === 'text' || selected.type === 'about_banner') && (
                  <>
                    <label className="text-sm text-slate-600 dark:text-slate-300">Title</label>
                    <input
                      value={
                        selected.type === 'hero' || selected.type === 'banner'
                          ? (draft?.slides?.[activeSlideIndex]?.title || '')
                          : (draft?.title || '')
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (selected.type === 'hero' || selected.type === 'banner') {
                          const slides = Array.isArray(draft?.slides) ? [...draft.slides] : [];
                          if (!slides[activeSlideIndex]) slides[activeSlideIndex] = {};
                          slides[activeSlideIndex] = { ...slides[activeSlideIndex], title: value };
                          setDraft(prev => ({ ...(prev || {}), slides }));
                        } else {
                          setDraft(prev => ({ ...(prev || {}), title: value }));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                  </>
                )}

                {(selected.type === 'hero' || selected.type === 'banner' || selected.type === 'text' || selected.type === 'about_banner') && (
                  <>
                    <label className="text-sm text-slate-600 dark:text-slate-300">Subtitle / Body</label>
                    <textarea
                      value={
                        selected.type === 'hero' || selected.type === 'banner'
                          ? (draft?.slides?.[activeSlideIndex]?.subtitle || '')
                          : (draft?.subtitle || draft?.body || '')
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (selected.type === 'hero' || selected.type === 'banner') {
                          const slides = Array.isArray(draft?.slides) ? [...draft.slides] : [];
                          if (!slides[activeSlideIndex]) slides[activeSlideIndex] = {};
                          slides[activeSlideIndex] = { ...slides[activeSlideIndex], subtitle: value };
                          setDraft(prev => ({ ...(prev || {}), slides }));
                        } else {
                          setDraft(prev => ({ ...(prev || {}), subtitle: value, body: value }));
                        }
                      }}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                  </>
                )}

                {selected.type === 'hero' && (
                  <>
                    <label className="text-sm text-slate-600 dark:text-slate-300">Background Image URL</label>
                    <input
                      value={draft?.slides?.[activeSlideIndex]?.bgImage || ''}
                      onChange={(e) => setSlideField('bgImage', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                    <label className="text-xs text-slate-400">{`BG Image file (max ${imageLimitLabel})`}</label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImage(file);
                        if (url) setSlideField('bgImage', url);
                      }}
                      className="w-full text-xs"
                    />
                    <label className="text-sm text-slate-600 dark:text-slate-300">Optional Image URL</label>
                    <input
                      value={draft?.slides?.[activeSlideIndex]?.image || ''}
                      onChange={(e) => setSlideField('image', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                    <label className="text-xs text-slate-400">{`Image file (max ${imageLimitLabel})`}</label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImage(file);
                        if (url) setSlideField('image', url);
                      }}
                      className="w-full text-xs"
                    />
                    <label className="text-sm text-slate-600 dark:text-slate-300">Button Text</label>
                    <input
                      value={draft?.slides?.[activeSlideIndex]?.buttonText || ''}
                      onChange={(e) => setSlideField('buttonText', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                    <label className="text-sm text-slate-600 dark:text-slate-300">Button Link</label>
                    <input
                      value={draft?.slides?.[activeSlideIndex]?.buttonLink || ''}
                      onChange={(e) => setSlideField('buttonLink', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                    <label className="text-sm text-slate-600 dark:text-slate-300">News Link (optional)</label>
                    <input
                      value={draft?.slides?.[activeSlideIndex]?.newsLink || ''}
                      onChange={(e) => setSlideField('newsLink', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                  </>
                )}

                {selected.type === 'banner' && (
                  <>
                    <label className="text-sm text-slate-600 dark:text-slate-300">Image URL</label>
                    <input
                      value={draft?.slides?.[activeSlideIndex]?.image || ''}
                      onChange={(e) => setSlideField('image', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                    <label className="text-xs text-slate-400">{`Image file (max ${imageLimitLabel})`}</label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImage(file);
                        if (url) setSlideField('image', url);
                      }}
                      className="w-full text-xs"
                    />
                    <label className="text-sm text-slate-600 dark:text-slate-300">Link</label>
                    <input
                      value={draft?.slides?.[activeSlideIndex]?.link || ''}
                      onChange={(e) => setSlideField('link', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                  </>
                )}

                {selected.type === 'about_banner' && (
                  <>
                    <label className="text-sm text-slate-600 dark:text-slate-300">Button Text</label>
                    <input
                      value={draft?.buttonText || ''}
                      onChange={(e) => setDraft(prev => ({ ...(prev || {}), buttonText: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                    <label className="text-sm text-slate-600 dark:text-slate-300">Button Link</label>
                    <input
                      value={draft?.buttonLink || ''}
                      onChange={(e) => setDraft(prev => ({ ...(prev || {}), buttonLink: e.target.value }))}
                      placeholder="#about"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                  </>
                )}

                {selected.type === 'footer' && (
                  <>
                    <div className="md:col-span-2">
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Footer links (hammasi)</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Ijtimoiy tarmoqlar</div>
                      <div className="space-y-2 mb-5">
                        {(draft?.footerLinks || []).map((link: any, idx: number) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                            <input
                              value={link.group || ''}
                              onChange={(e) => {
                                const footerLinks = [...(draft?.footerLinks || [])];
                                footerLinks[idx] = { ...footerLinks[idx], group: e.target.value };
                                setDraft(prev => ({ ...(prev || {}), footerLinks }));
                              }}
                              placeholder="group"
                              className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                            />
                            <input
                              value={link.label || ''}
                              onChange={(e) => {
                                const footerLinks = [...(draft?.footerLinks || [])];
                                footerLinks[idx] = { ...footerLinks[idx], label: e.target.value };
                                setDraft(prev => ({ ...(prev || {}), footerLinks }));
                              }}
                              placeholder="label"
                              className="col-span-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                            />
                            <input
                              value={link.page || ''}
                              onChange={(e) => {
                                const footerLinks = [...(draft?.footerLinks || [])];
                                footerLinks[idx] = { ...footerLinks[idx], page: e.target.value };
                                setDraft(prev => ({ ...(prev || {}), footerLinks }));
                              }}
                              placeholder="page slug"
                              className="col-span-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                            />
                            <input
                              value={link.url || ''}
                              onChange={(e) => {
                                const footerLinks = [...(draft?.footerLinks || [])];
                                footerLinks[idx] = { ...footerLinks[idx], url: e.target.value };
                                setDraft(prev => ({ ...(prev || {}), footerLinks }));
                              }}
                              placeholder="external url (optional)"
                              className="col-span-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                            />
                            <button
                              onClick={() => {
                                const footerLinks = [...(draft?.footerLinks || [])];
                                footerLinks.splice(idx, 1);
                                setDraft(prev => ({ ...(prev || {}), footerLinks }));
                              }}
                              className="col-span-1 p-2 text-red-500 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const footerLinks = [...(draft?.footerLinks || [])];
                            footerLinks.push({ group: 'about', label: 'Yangi link', page: '', url: '' });
                            setDraft(prev => ({ ...(prev || {}), footerLinks }));
                          }}
                          className="px-3 py-2 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500"
                        >
                          + Footer link qo'shish
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(draft?.socialLinks || []).map((link: any, idx: number) => (
                          <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                            <input
                              value={link.label || ''}
                              onChange={(e) => {
                                const socialLinks = [...(draft?.socialLinks || [])];
                                socialLinks[idx] = { ...socialLinks[idx], label: e.target.value };
                                setDraft(prev => ({ ...(prev || {}), socialLinks }));
                              }}
                              placeholder="Label"
                              className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                            />
                            <input
                              value={link.url || ''}
                              onChange={(e) => {
                                const socialLinks = [...(draft?.socialLinks || [])];
                                socialLinks[idx] = { ...socialLinks[idx], url: e.target.value };
                                setDraft(prev => ({ ...(prev || {}), socialLinks }));
                              }}
                              placeholder="https://..."
                              className="col-span-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const socialLinks = [...(draft?.socialLinks || [])];
                            socialLinks.push({ label: 'Link', url: '' });
                            setDraft(prev => ({ ...(prev || {}), socialLinks }));
                          }}
                          className="px-3 py-2 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500"
                        >
                          + Yangi link
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {selected.type === 'about_block' && (
                  <>
                    <label className="text-sm text-slate-600 dark:text-slate-300">Image URL</label>
                    <input
                      value={draft?.image || ''}
                      onChange={(e) => setDraft(prev => ({ ...(prev || {}), image: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                    <label className="text-xs text-slate-400">{`Image file (max ${imageLimitLabel})`}</label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImage(file);
                        if (url) setDraft(prev => ({ ...(prev || {}), image: url }));
                      }}
                      className="w-full text-xs"
                    />
                    <label className="text-sm text-slate-600 dark:text-slate-300">Link URL</label>
                    <input
                      value={draft?.linkUrl || ''}
                      onChange={(e) => setDraft(prev => ({ ...(prev || {}), linkUrl: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                    <label className="text-sm text-slate-600 dark:text-slate-300">Link Target</label>
                    <select
                      value={draft?.linkTarget || 'title'}
                      onChange={(e) => setDraft(prev => ({ ...(prev || {}), linkTarget: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    >
                      <option value="title">Title</option>
                      <option value="subtitle">Subtitle</option>
                      <option value="image">Image</option>
                    </select>
                  </>
                )}

                {selected.type === 'spacer' && (
                  <>
                    <label className="text-sm text-slate-600 dark:text-slate-300">Height (px)</label>
                    <input
                      type="number"
                      value={draft?.height || 24}
                      onChange={(e) => setDraft(prev => ({ ...(prev || {}), height: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                  </>
                )}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 dark:text-white">Live Preview</h3>
              <a href={getPreviewWithBuilder(previewUrl)} target="_blank" rel="noreferrer" className="text-xs text-indigo-600">Yangi tabda ochish</a>
            </div>
            <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <iframe title="shop-preview" src={getPreviewWithBuilder(previewUrl)} className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Add section modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Yangi bo‘lim qo‘shish</h3>
            <label className="text-sm text-slate-500">Bo‘lim turi</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            >
              {SECTION_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700">
                Bekor qilish
              </button>
              <button disabled={isSaving} onClick={handleAddSection} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white flex items-center gap-2 disabled:opacity-50">
                <Plus size={14} /> Qo‘shish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteBuilderView;
