import { supabase } from './supabase';
import { generateJoinCode, normalizeJoinCode } from '../utils/classes';

// Mode Kelas butuh tabel/RPC dari migrasi 202608030001 yang dijalankan
// manual di Supabase. Selama migrasi belum dijalankan, PostgREST
// mengembalikan error "tabel/fungsi tidak ditemukan" — service ini
// menandainya dengan kode khusus agar UI bisa menampilkan status
// "belum diaktifkan" secara ramah, bukan crash.
export const CLASSES_NOT_ACTIVE = 'CLASSES_NOT_ACTIVE';

const NOT_ACTIVE_CODES = new Set(['42P01', '42883', 'PGRST202', 'PGRST205']);

export function isClassesNotActiveError(error) {
  if (!error) return false;
  if (error.code === CLASSES_NOT_ACTIVE) return true;
  if (NOT_ACTIVE_CODES.has(error.code)) return true;
  const msg = String(error.message || '');
  return /could not find the (table|function)|relation .* does not exist|schema cache/i.test(msg)
    && /class/i.test(msg);
}

function rethrow(error) {
  if (isClassesNotActiveError(error)) {
    const err = new Error('Mode Kelas belum diaktifkan di server');
    err.code = CLASSES_NOT_ACTIVE;
    throw err;
  }
  throw error;
}

function mapClass(row, membership) {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description || '',
    joinCode: row.join_code,
    createdAt: row.created_at,
    membership: membership || (row.membership ?? null),
  };
}

function mapAssignment(row) {
  if (!row) return null;
  return {
    id: row.id,
    classId: row.class_id,
    title: row.title,
    categoryId: row.category_id,
    categoryName: row.categories?.name || null,
    difficulty: row.difficulty,
    questionCount: row.question_count,
    dueAt: row.due_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function createClass(userId, { name, description }) {
  // Kode gabung digenerate di klien; bila bentrok (unique), coba sekali
  // lagi dengan kode baru.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await supabase
      .from('classes')
      .insert({
        owner_id: userId,
        name: String(name || '').trim(),
        description: String(description || '').trim() || null,
        join_code: generateJoinCode(),
      })
      .select('*')
      .single();
    if (!error) return mapClass(data, 'owner');
    if (error.code !== '23505' || attempt === 1) rethrow(error);
  }
  return null;
}

export async function getMyClasses(userId, signal) {
  const [ownedRes, memberRes] = await Promise.all([
    supabase
      .from('classes')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .abortSignal(signal),
    supabase
      .from('class_members')
      .select('joined_at, classes:classes(*)')
      .eq('student_id', userId)
      .order('joined_at', { ascending: false })
      .abortSignal(signal),
  ]);
  if (ownedRes.error) rethrow(ownedRes.error);
  if (memberRes.error) rethrow(memberRes.error);

  const owned = (ownedRes.data || []).map((row) => mapClass(row, 'owner'));
  const ownedIds = new Set(owned.map((c) => c.id));
  const joined = (memberRes.data || [])
    .map((row) => mapClass(row.classes, 'member'))
    .filter((c) => c && !ownedIds.has(c.id));
  return [...owned, ...joined];
}

export async function joinClassByCode(code) {
  const { data, error } = await supabase.rpc('join_class_by_code', {
    p_code: normalizeJoinCode(code),
  });
  if (error) rethrow(error);
  const row = data?.[0];
  if (!row) return null;
  return {
    id: row.class_id,
    name: row.name,
    description: row.description || '',
    ownerId: row.owner_id,
    memberCount: row.member_count,
    membership: 'member',
  };
}

export async function getClassDetail(classId, signal) {
  const classRes = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .abortSignal(signal)
    .single();
  if (classRes.error) rethrow(classRes.error);

  const [membersRes, assignmentsRes] = await Promise.all([
    supabase
      .from('class_members')
      .select('student_id, joined_at, profiles:profiles(full_name, avatar_url)')
      .eq('class_id', classId)
      .order('joined_at', { ascending: true })
      .abortSignal(signal),
    supabase
      .from('class_assignments')
      .select('*, categories:categories(name)')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })
      .abortSignal(signal),
  ]);
  if (membersRes.error) rethrow(membersRes.error);
  if (assignmentsRes.error) rethrow(assignmentsRes.error);

  return {
    class: mapClass(classRes.data),
    members: (membersRes.data || []).map((row) => ({
      studentId: row.student_id,
      joinedAt: row.joined_at,
      // RLS profiles hanya membuka profil sendiri untuk non-pemilik;
      // nama anggota lain bisa kosong — UI menampilkan fallback.
      fullName: row.profiles?.full_name || null,
      avatarUrl: row.profiles?.avatar_url || null,
    })),
    assignments: (assignmentsRes.data || []).map(mapAssignment),
  };
}

export async function createAssignment(classId, userId, form) {
  const { data, error } = await supabase
    .from('class_assignments')
    .insert({
      class_id: classId,
      title: String(form.title || '').trim(),
      category_id: form.categoryId || null,
      difficulty: form.difficulty || 'easy',
      question_count: Number(form.questionCount) || 20,
      due_at: form.dueAt || null,
      created_by: userId,
    })
    .select('*, categories:categories(name)')
    .single();
  if (error) rethrow(error);
  return mapAssignment(data);
}

export async function getClassLeaderboard(classId, signal) {
  const { data, error } = await supabase
    .rpc('class_leaderboard', { p_class_id: classId })
    .abortSignal(signal);
  if (error) rethrow(error);
  return (data || []).map((row) => ({
    studentId: row.student_id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    quizzes: Number(row.quizzes) || 0,
    avgScore: row.avg_score === null ? null : Number(row.avg_score),
    totalQuestions: Number(row.total_questions) || 0,
    totalXp: Number(row.total_xp) || 0,
  }));
}
