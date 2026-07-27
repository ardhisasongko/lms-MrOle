export function getLocale() {
  return localStorage.getItem('mr-ole-lang') === 'en' ? 'en-US' : 'id-ID';
}

export function formatDate(date) {
  try {
    return new Intl.DateTimeFormat(getLocale(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  } catch {
    return 'Invalid date';
  }
}


