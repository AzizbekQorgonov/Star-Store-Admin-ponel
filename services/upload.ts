const resolveApiBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envUrl) return envUrl;
  if (import.meta.env.PROD) return 'https://star-store-backend.onrender.com';
  return 'http://localhost:5000';
};

const API_BASE_URL = resolveApiBaseUrl();

type UploadScope = 'products' | 'site' | 'avatars' | 'general';

type UploadSignatureResponse = {
  success: boolean;
  cloud_name: string;
  api_key: string;
  timestamp: number;
  folder: string;
  signature: string;
  upload_url: string;
  error?: string;
};

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const json = await response.json();
    if (typeof json?.error === 'string' && json.error.trim()) return json.error;
    if (typeof json?.error?.message === 'string' && json.error.message.trim()) return json.error.message;
    if (typeof json?.message === 'string' && json.message.trim()) return json.message;
  } catch {
    // ignore
  }
  return fallback;
};

const getAdminToken = () => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('admin_auth_token') || '';
};

export const uploadImageToCloudinary = async (file: File, scope: UploadScope = 'products') => {
  const token = getAdminToken();
  const signResponse = await fetch(`${API_BASE_URL}/uploads/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ scope }),
  });

  if (!signResponse.ok) {
    throw new Error(await parseErrorMessage(signResponse, 'Upload signing failed'));
  }

  const signJson = (await signResponse.json()) as UploadSignatureResponse;
  if (!signJson?.success || !signJson?.upload_url || !signJson?.api_key || !signJson?.signature) {
    throw new Error(signJson?.error || 'Upload signing payload is invalid');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signJson.api_key);
  formData.append('timestamp', String(signJson.timestamp));
  formData.append('signature', signJson.signature);
  if (signJson.folder) {
    formData.append('folder', signJson.folder);
  }

  const uploadResponse = await fetch(signJson.upload_url, {
    method: 'POST',
    body: formData,
  });
  if (!uploadResponse.ok) {
    throw new Error(await parseErrorMessage(uploadResponse, 'Cloud upload failed'));
  }

  const uploadJson = await uploadResponse.json();
  const secureUrl = String(uploadJson?.secure_url || uploadJson?.url || '').trim();
  if (!secureUrl) throw new Error('Cloud upload response does not contain URL');
  return secureUrl;
};
