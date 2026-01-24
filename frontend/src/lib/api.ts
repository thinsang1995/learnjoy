// API configuration
// In browser: use backend directly via localhost
// On server (SSR): use internal docker network URL
const getApiBaseUrl = () => {
  // Check if running in browser
  if (typeof window !== 'undefined') {
    // Browser: use relative path if configured (ngrok/nginx), otherwise localhost
    if (process.env.NEXT_PUBLIC_API_URL === '') return '';
    return 'http://localhost:3001';
  }
  // Server-side (SSR): use docker internal network
  return process.env.NEXT_PUBLIC_API_URL || 'http://backend:3001';
};

const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  // Audio
  audio: `${API_BASE_URL}/api/audio`,
  audioUpload: `${API_BASE_URL}/api/audio/upload`,
  audioTopics: `${API_BASE_URL}/api/audio/topics`,
  audioAdmin: `${API_BASE_URL}/api/audio/admin`,
  audioById: (id: string) => `${getApiBaseUrl()}/api/audio/${id}`,
  audioTranscript: (id: string) => `${getApiBaseUrl()}/api/audio/${id}/transcript`,
  audioPublish: (id: string) => `${getApiBaseUrl()}/api/audio/${id}/publish`,
  
  // Quiz
  quizByAudio: (audioId: string) => `${getApiBaseUrl()}/api/audio/${audioId}/quiz`,
  quizGenerate: `${API_BASE_URL}/api/quiz/generate`,
  quizGenerateBatch: `${API_BASE_URL}/api/quiz/generate-batch`,
  quizSubmit: (id: string) => `${getApiBaseUrl()}/api/quiz/${id}/submit`,
  quizRegenerate: (audioId: string) => `${getApiBaseUrl()}/api/audio/${audioId}/quiz/regenerate`,
  
  // Transcript
  transcriptHealth: `${API_BASE_URL}/api/transcript/health`,
};

// Type definitions
export interface Audio {
  id: string;
  title: string;
  description?: string;
  topic: 'daily' | 'business' | 'travel' | 'culture';
  jlptLevel: 'N2' | 'N3';
  audioUrl: string;
  duration: number;
  thumbnailColor: 'peach' | 'blue' | 'mint' | 'lilac';
  transcript?: string;
  transcriptJson?: any;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  quizzes?: Quiz[];
  _count?: { quizzes: number };
}

export interface Quiz {
  id: string;
  audioId: string;
  type: 'mcq' | 'fill' | 'reorder';
  question?: string;
  dataJson: MCQData | FillBlankData | ReorderData;
  order: number;
  createdAt: string;
}

export interface MCQData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface FillBlankData {
  sentence: string;
  blankWord: string;
  options: string[];
  hint?: string;
}

export interface ReorderData {
  originalSentence: string;
  segments: string[];
  correctOrder: number[];
}

export interface QuizResult {
  correct: boolean;
  explanation: string;
  correctAnswer?: any;
}

export interface TopicStat {
  topic: string;
  count: number;
  name: string;
  color: string;
  icon: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API functions
export async function fetchAudioList(params?: {
  topic?: string;
  jlptLevel?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Audio>> {
  const searchParams = new URLSearchParams();
  if (params?.topic) searchParams.set('topic', params.topic);
  if (params?.jlptLevel) searchParams.set('jlptLevel', params.jlptLevel);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const url = `${API_ENDPOINTS.audio}?${searchParams.toString()}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  
  if (!res.ok) throw new Error('Failed to fetch audio list');
  return res.json();
}

export async function fetchAudioById(id: string): Promise<Audio> {
  const res = await fetch(API_ENDPOINTS.audioById(id), { 
    next: { revalidate: 60 } 
  });
  
  if (!res.ok) throw new Error('Audio not found');
  return res.json();
}

export async function fetchTopics(): Promise<TopicStat[]> {
  const res = await fetch(API_ENDPOINTS.audioTopics, { 
    next: { revalidate: 300 } 
  });
  
  if (!res.ok) throw new Error('Failed to fetch topics');
  return res.json();
}

export async function fetchQuizzesByAudio(audioId: string, type?: string): Promise<Quiz[]> {
  const url = type 
    ? `${API_ENDPOINTS.quizByAudio(audioId)}?type=${type}`
    : API_ENDPOINTS.quizByAudio(audioId);
    
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch quizzes');
  return res.json();
}

export async function submitQuizAnswer(quizId: string, answer: any): Promise<QuizResult> {
  const res = await fetch(API_ENDPOINTS.quizSubmit(quizId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  
  if (!res.ok) throw new Error('Failed to submit answer');
  return res.json();
}

export async function generateTranscript(audioId: string): Promise<{
  transcript: string;
  segments: any[];
  cached: boolean;
}> {
  const res = await fetch(API_ENDPOINTS.audioTranscript(audioId), {
    method: 'POST',
  });
  
  if (!res.ok) throw new Error('Failed to generate transcript');
  return res.json();
}

export async function generateQuizzes(audioId: string, options?: {
  includeMcq?: boolean;
  includeFill?: boolean;
  includeReorder?: boolean;
  countEach?: number;
}): Promise<any> {
  const res = await fetch(API_ENDPOINTS.quizGenerateBatch, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioId, ...options }),
  });
  
  if (!res.ok) throw new Error('Failed to generate quizzes');
  return res.json();
}

// Utility functions
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getTopicInfo(topic: string) {
  const topicMap: Record<string, { name: string; color: string; icon: string }> = {
    daily: { name: '日常会話', color: 'peach', icon: '💬' },
    business: { name: 'ビジネス', color: 'blue', icon: '💼' },
    travel: { name: '旅行', color: 'mint', icon: '✈️' },
    culture: { name: '文化', color: 'lilac', icon: '🏯' },
  };
  return topicMap[topic] || { name: topic, color: 'peach', icon: '📚' };
}

export function getCardColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    peach: 'clay-card-peach',
    blue: 'clay-card-blue',
    mint: 'clay-card-mint',
    lilac: 'clay-card-lilac',
  };
  return colorMap[color] || 'clay-card';
}

export async function uploadAudio(
  file: File,
  title: string,
  topic: string,
  jlptLevel: string,
  autoTranscribe: boolean = true
): Promise<Audio> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('topic', topic);
  formData.append('jlptLevel', jlptLevel);
  formData.append('autoTranscribe', autoTranscribe.toString());

  const res = await fetch(API_ENDPOINTS.audioUpload, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Failed to upload audio');
  }

  return res.json();
}

// Admin API functions
export async function fetchAdminAudioList(params?: {
  topic?: string;
  jlptLevel?: string;
  page?: number;
  limit?: number;
  includeUnpublished?: boolean;
}): Promise<PaginatedResponse<Audio>> {
  const searchParams = new URLSearchParams();
  if (params?.topic) searchParams.set('topic', params.topic);
  if (params?.jlptLevel) searchParams.set('jlptLevel', params.jlptLevel);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  searchParams.set('includeUnpublished', 'true');

  const url = `${API_ENDPOINTS.audioAdmin}?${searchParams.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });
  
  if (!res.ok) throw new Error('Failed to fetch admin audio list');
  return res.json();
}

export async function updateAudio(id: string, data: {
  title?: string;
  description?: string;
  topic?: string;
  jlptLevel?: string;
  transcript?: string;
}): Promise<Audio> {
  const res = await fetch(API_ENDPOINTS.audioById(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Update failed' }));
    throw new Error(error.message || 'Failed to update audio');
  }

  return res.json();
}

export async function deleteAudio(id: string): Promise<void> {
  const res = await fetch(API_ENDPOINTS.audioById(id), {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Delete failed' }));
    throw new Error(error.message || 'Failed to delete audio');
  }
}

export async function togglePublishAudio(id: string, isPublished: boolean): Promise<Audio> {
  const res = await fetch(API_ENDPOINTS.audioPublish(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPublished }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Toggle publish failed' }));
    throw new Error(error.message || 'Failed to toggle publish status');
  }

  return res.json();
}

export async function regenerateQuizzes(audioId: string): Promise<{ message: string; count: number }> {
  const res = await fetch(API_ENDPOINTS.quizRegenerate(audioId), {
    method: 'POST',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Regenerate failed' }));
    throw new Error(error.message || 'Failed to regenerate quizzes');
  }

  return res.json();
}
