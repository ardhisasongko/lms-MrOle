// Util murni Mode Kelas: kode gabung & status tugas.
// Alfabet kode sengaja TANPA karakter ambigu (0/O, 1/I/L) agar kode
// yang dibacakan guru atau ditulis tangan tidak tertukar.
export const JOIN_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const JOIN_CODE_LENGTH = 6;

export function generateJoinCode(random = Math.random) {
  let code = '';
  for (let i = 0; i < JOIN_CODE_LENGTH; i += 1) {
    const idx = Math.min(
      JOIN_CODE_ALPHABET.length - 1,
      Math.floor(random() * JOIN_CODE_ALPHABET.length),
    );
    code += JOIN_CODE_ALPHABET[idx];
  }
  return code;
}

export function normalizeJoinCode(input) {
  return String(input || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, JOIN_CODE_LENGTH);
}

export function isValidJoinCode(input) {
  const code = normalizeJoinCode(input);
  return (
    code.length === JOIN_CODE_LENGTH
    && [...code].every((ch) => JOIN_CODE_ALPHABET.includes(ch))
  );
}

// Status tugas untuk seorang murid:
// - 'completed' bila murid sudah mengerjakan kuis kategori+difficulty
//   tugas itu (flag dihitung pemanggil dari data attempt),
// - 'overdue' bila tenggat sudah lewat,
// - 'active' selain itu (termasuk tugas tanpa tenggat).
export function getAssignmentStatus(assignment, now = new Date(), completed = false) {
  if (completed) return 'completed';
  if (assignment?.dueAt) {
    const due = new Date(assignment.dueAt);
    if (!Number.isNaN(due.getTime()) && now.getTime() > due.getTime()) return 'overdue';
  }
  return 'active';
}

export const ASSIGNMENT_STATUS_LABEL = {
  active: 'Aktif',
  overdue: 'Lewat Tenggat',
  completed: 'Selesai',
};
