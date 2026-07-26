export function getLocale() {
  return localStorage.getItem('mr-ole-lang') === 'en' ? 'en-US' : 'id-ID';
}

export function formatDate(date) {
  return new Intl.DateTimeFormat(getLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function formatDateShort(date) {
  return new Intl.DateTimeFormat(getLocale(), {
    dateStyle: 'medium',
  }).format(new Date(date));
}


