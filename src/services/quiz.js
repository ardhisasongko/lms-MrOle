import { supabase } from './supabase';

export async function getLastScores(userId) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('category_id, difficulty, score, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });
  if (error) throw error;
  // Only the latest attempt per category+difficulty
  const latest = {};
  for (const a of data || []) {
    const key = `${a.category_id}:${a.difficulty}`;
    if (!latest[key]) latest[key] = { score: a.score, completedAt: a.completed_at };
  }
  return latest;
}

function mapQuestion(question) {
  const {
    correct_answer: _correctAnswer,
    correctAnswer: _camelCorrectAnswer,
    explanation: _explanation,
    ...contentMetadata
  } = question.content_metadata || {};

  return {
    id: question.question_id,
    position: question.position,
    type: question.type,
    question: question.prompt,
    stimulus: question.stimulus,
    options: question.options,
    contentMetadata,
    userAnswer: question.user_answer,
  };
}

export async function startQuizSession({
  categoryId,
  difficulty,
  mode = 'normal',
  sourceAttemptId = null,
  challengeToken = null,
}) {
  const { data, error } = await supabase.rpc('start_quiz_session', {
    p_category_id: categoryId,
    p_difficulty: difficulty,
    p_mode: mode,
    p_source_attempt_id: sourceAttemptId,
    p_challenge_token: challengeToken,
  });

  if (error) throw error;

  const questions = Array.isArray(data?.questions) ? data.questions : [];
  const questionCount = Number(data?.question_count);
  const sessionMode = data?.mode || mode;
  const validCount = sessionMode === 'retry'
    ? Number.isInteger(questionCount) && questionCount >= 1 && questionCount <= 20
    : questionCount === 20;

  if (!validCount || questions.length !== questionCount) {
    throw new Error('Sesi kuis tidak valid. Silakan mulai sesi baru.');
  }

  return {
    sessionId: data?.session_id,
    categoryId: data?.category_id,
    difficulty: data?.difficulty,
    mode: sessionMode,
    questionCount,
    sourceAttemptId: data?.source_attempt_id,
    challengeToken: data?.challenge_token,
    status: data?.status,
    startedAt: data?.started_at,
    expiresAt: data?.expires_at,
    questions: questions.map(mapQuestion),
  };
}

export async function saveQuizSessionAnswer({ sessionId, questionId, userAnswer }) {
  const { data, error } = await supabase.rpc('save_quiz_session_answer', {
    p_session_id: sessionId,
    p_question_id: questionId,
    p_user_answer: userAnswer,
  });

  if (error) throw error;

  return {
    sessionId: data?.session_id,
    questionId: data?.question_id,
    userAnswer: data?.user_answer,
    answeredAt: data?.answered_at,
  };
}

export async function submitQuizSession({ sessionId, answers = null }) {
  const pAnswers = answers?.map(({ questionId, userAnswer }) => ({
    question_id: questionId,
    user_answer: userAnswer,
  })) ?? null;
  const { data, error } = await supabase.rpc('submit_quiz_session', {
    p_session_id: sessionId,
    p_answers: pAnswers,
  });

  if (error) throw error;

  return {
    sessionId: data?.session_id,
    attemptId: data?.attempt_id,
    score: data?.score,
    correct: data?.correct,
    total: data?.total,
    mode: data?.mode,
    alreadySubmitted: Boolean(data?.already_submitted),
    status: data?.status,
  };
}

export const HISTORY_PAGE_SIZE = 10;

export async function getAttempts(userId, { page = 0, categoryFilter = '' } = {}) {
  let query = supabase
    .from('quiz_attempts')
    .select('id, score, total_questions, correct_answers, difficulty, completed_at, category_id, categories(name)', { count: 'exact' })
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .range(page * HISTORY_PAGE_SIZE, (page + 1) * HISTORY_PAGE_SIZE - 1);

  if (categoryFilter) {
    query = query.eq('category_id', categoryFilter);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: data || [], count: count || 0, hasMore: count > (page + 1) * HISTORY_PAGE_SIZE };
}

export async function getAttemptDetails(attemptId) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*, quiz_answers(*, questions(*))')
    .eq('id', attemptId)
    .single();
  if (error) throw error;

  const { data: session, error: sessionError } = await supabase
    .from('quiz_sessions')
    .select('id')
    .eq('attempt_id', attemptId)
    .maybeSingle();
  if (sessionError) throw sessionError;
  if (!session?.id) return data;

  const { data: snapshots, error: snapshotError } = await supabase
    .from('quiz_session_questions')
    .select('question_id, position, question_type, legacy_question, stimulus, prompt, options, correct_answer, user_answer, questions(explanation)')
    .eq('session_id', session.id)
    .order('position');
  if (snapshotError) throw snapshotError;
  if (!snapshots?.length) throw new Error('Quiz session snapshot is incomplete');

  const answersByQuestion = new Map((data.quiz_answers || []).map((answer) => [answer.question_id, answer]));
  return {
    ...data,
    quiz_answers: snapshots.map((snapshot) => {
      const answer = answersByQuestion.get(snapshot.question_id);
      return {
        ...answer,
        question_id: snapshot.question_id,
        user_answer: snapshot.user_answer,
        questions: {
          id: snapshot.question_id,
          question: snapshot.prompt || snapshot.legacy_question,
          prompt: snapshot.prompt,
          stimulus: snapshot.stimulus,
          options: snapshot.options,
          type: snapshot.question_type,
          correct_answer: snapshot.correct_answer,
          explanation: snapshot.questions?.explanation || answer?.questions?.explanation || '',
        },
      };
    }),
  };
}

export async function getRecentAttempts(userId, limit = 100) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('score, total_questions, completed_at, category_id, categories(name)')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
