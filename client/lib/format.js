export const formatMoney = (amount, currency = 'NPR') => {
  const n = Number(amount) || 0;
  const sym = currency === 'NPR' ? 'Rs. ' : currency === 'USD' ? '$' : `${currency} `;
  return `${sym}${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(new Date(value).getTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

export const timeAgo = (value) => {
  if (!value) return '—';
  const s = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(value).split(',')[0];
};

export const stars = (rating) => {
  const r = Math.round((Number(rating) || 0) * 2) / 2;
  let out = '★'.repeat(Math.floor(r));
  if (r % 1 >= 0.5) out += '½';
  out += '☆'.repeat(Math.max(0, 5 - Math.ceil(r)));
  return out;
};

export const titleCase = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());