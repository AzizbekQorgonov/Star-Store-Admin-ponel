const DEFAULT_MAX_IMAGE_MB = 3;

const toPositiveNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

export const MAX_IMAGE_MB = toPositiveNumber(import.meta.env.VITE_MAX_IMAGE_MB, DEFAULT_MAX_IMAGE_MB);
export const MAX_IMAGE_BYTES = Math.round(MAX_IMAGE_MB * 1024 * 1024);

const IMAGE_BASE_URL = String(import.meta.env.VITE_IMAGE_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '');

const isAbsoluteUrl = (value: string) => /^(?:https?:)?\/\//i.test(value);
const isDataOrBlob = (value: string) => /^(?:data:|blob:)/i.test(value);

export const resolveImageUrl = (rawValue?: string | null) => {
  const value = String(rawValue || '').trim();
  if (!value) return '';
  if (isAbsoluteUrl(value) || isDataOrBlob(value)) return value;
  if (!IMAGE_BASE_URL) return value;
  if (value.startsWith('/')) return `${IMAGE_BASE_URL}${value}`;
  return `${IMAGE_BASE_URL}/${value}`;
};

export const validateImageFile = (file: File): string | null => {
  if (!file.type.startsWith('image/')) {
    return 'Faqat image fayl yuklash mumkin';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Rasm hajmi ${MAX_IMAGE_MB}MB dan oshmasligi kerak`;
  }
  return null;
};

export const imageLimitLabel = `${MAX_IMAGE_MB}MB`;
