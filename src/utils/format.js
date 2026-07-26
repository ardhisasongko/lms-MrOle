export function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function formatDateShort(date) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
  }).format(new Date(date));
}

export function formatPercentage(value) {
  return `${Math.round(value)}%`;
}

export function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(value);
}
