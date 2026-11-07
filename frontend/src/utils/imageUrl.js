const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const backendOrigin = apiBaseUrl
  .replace(/\/api\/?$/, '')
  .replace(/\/+$/, '');

export const getImageUrl = (image, fallback = '/assets/images/produce/bhindi_exact.png') => {
  if (!image) return fallback;
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  if (image.startsWith('/assets/')) return image;
  if (image.startsWith('/uploads/')) return `${backendOrigin}${image}`;
  if (image.startsWith('/')) return image;
  return `${backendOrigin}/uploads/${image}`;
};
