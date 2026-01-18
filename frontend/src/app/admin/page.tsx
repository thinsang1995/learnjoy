'use client';

import { useState, useCallback, useEffect } from 'react';
import { Navbar, Footer } from '@/components/layout';
import { ClayButton, ClayCard } from '@/components/ui';
import { 
  Audio, 
  uploadAudio, 
  fetchAdminAudioList, 
  updateAudio, 
  deleteAudio, 
  togglePublishAudio,
  regenerateQuizzes,
  generateTranscript,
  formatDuration,
  getTopicInfo,
} from '@/lib/api';

const TOPICS = ['daily', 'business', 'travel', 'culture', 'news'] as const;
const LEVELS = ['N2', 'N3'] as const;

type Topic = typeof TOPICS[number];
type Level = typeof LEVELS[number];

const topicLabels: Record<string, string> = {
  daily: '日常会話',
  business: 'ビジネス',
  travel: '旅行',
  culture: '文化',
  news: 'ニュース',
};

// Tab type
type TabType = 'upload' | 'list';

export default function AdminPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('list');
  
  // Upload form states
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState<Topic>('daily');
  const [level, setLevel] = useState<Level>('N3');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Audio list states
  const [audios, setAudios] = useState<Audio[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  
  // Edit modal states
  const [editingAudio, setEditingAudio] = useState<Audio | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', topic: '', jlptLevel: '', transcript: '' });
  const [isEditing, setIsEditing] = useState(false);
  
  // Delete confirmation
  const [deletingAudio, setDeletingAudio] = useState<Audio | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch audio list
  const fetchAudios = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const result = await fetchAdminAudioList({ limit: 50, includeUnpublished: true });
      setAudios(result.data);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to load audio list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudios();
  }, [fetchAudios]);

  // Upload handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
      }
    } else {
      setUploadError('音声ファイルをアップロードしてください');
    }
  }, [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!file) {
      setUploadError('音声ファイルを選択してください');
      return;
    }

    if (!title.trim()) {
      setUploadError('タイトルを入力してください');
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadAudio(file, title, topic, level);
      setUploadSuccess(`アップロード完了: ${result.title}`);
      setFile(null);
      setTitle('');
      
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Refresh list and switch to list tab
      await fetchAudios();
      setTimeout(() => setActiveTab('list'), 1500);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  // Edit handlers
  const openEditModal = (audio: Audio) => {
    setEditingAudio(audio);
    setEditForm({
      title: audio.title,
      description: audio.description || '',
      topic: audio.topic,
      jlptLevel: audio.jlptLevel,
      transcript: audio.transcript || '',
    });
  };

  const closeEditModal = () => {
    setEditingAudio(null);
    setEditForm({ title: '', description: '', topic: '', jlptLevel: '', transcript: '' });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAudio) return;

    setIsEditing(true);
    try {
      await updateAudio(editingAudio.id, editForm);
      await fetchAudios();
      closeEditModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setIsEditing(false);
    }
  };

  // Delete handlers
  const openDeleteConfirm = (audio: Audio) => {
    setDeletingAudio(audio);
  };

  const closeDeleteConfirm = () => {
    setDeletingAudio(null);
  };

  const handleDelete = async () => {
    if (!deletingAudio) return;

    setIsDeleting(true);
    try {
      await deleteAudio(deletingAudio.id);
      await fetchAudios();
      closeDeleteConfirm();
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle publish
  const handleTogglePublish = async (audio: Audio) => {
    setActionLoading(audio.id);
    try {
      await togglePublishAudio(audio.id, !audio.isPublished);
      await fetchAudios();
    } catch (err) {
      alert(err instanceof Error ? err.message : '公開状態の変更に失敗しました');
    } finally {
      setActionLoading(null);
    }
  };

  // Regenerate quizzes
  const handleRegenerateQuizzes = async (audio: Audio) => {
    if (!audio.transcript) {
      alert('トランスクリプトがありません。先にトランスクリプトを生成してください。');
      return;
    }
    
    setActionLoading(`quiz-${audio.id}`);
    try {
      const result = await regenerateQuizzes(audio.id);
      alert(`クイズを再生成しました: ${result.count}問`);
      await fetchAudios();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'クイズの再生成に失敗しました');
    } finally {
      setActionLoading(null);
    }
  };

  // Generate transcript
  const handleGenerateTranscript = async (audio: Audio) => {
    if (audio.transcript) {
      if (!confirm('既にトランスクリプトがあります。再生成しますか？')) {
        return;
      }
    }
    
    setActionLoading(`transcript-${audio.id}`);
    try {
      alert('トランスクリプト生成を開始しました。数分かかる場合があります...');
      const result = await generateTranscript(audio.id);
      alert(`トランスクリプト生成完了！\n${result.transcript.substring(0, 100)}...`);
      await fetchAudios();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'トランスクリプトの生成に失敗しました');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-fredoka text-3xl font-bold text-text mb-2">
            🎛️ 管理ダッシュボード
          </h1>
          <p className="text-text/70 mb-8">
            音声コンテンツの管理・編集・削除ができます
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'list'
                  ? 'clay-btn-primary text-white'
                  : 'clay-btn'
              }`}
            >
              📋 音声一覧
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'clay-btn-primary text-white'
                  : 'clay-btn'
              }`}
            >
              📤 アップロード
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <ClayCard className="p-6 max-w-2xl">
              <h2 className="font-fredoka text-xl font-semibold mb-4">新規音声アップロード</h2>
              <form onSubmit={handleUploadSubmit} className="space-y-6">
                {/* File Upload Zone */}
                <div
                  className={`
                    border-2 border-dashed rounded-2xl p-8 text-center transition-colors
                    ${dragActive ? 'border-primary bg-primary/10' : 'border-text/20 hover:border-primary/50'}
                    ${file ? 'bg-mint/20' : ''}
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  
                  {file ? (
                    <div>
                      <div className="text-4xl mb-3">🎵</div>
                      <p className="font-semibold text-text">{file.name}</p>
                      <p className="text-sm text-text/60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button
                        type="button"
                        className="mt-3 text-sm text-primary hover:underline"
                        onClick={() => setFile(null)}
                      >
                        ファイルを変更
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="file-input" className="cursor-pointer">
                      <div className="text-4xl mb-3">📁</div>
                      <p className="font-semibold text-text mb-1">ファイルをドラッグ＆ドロップ</p>
                      <p className="text-sm text-text/60">またはクリックしてファイルを選択</p>
                      <p className="text-xs text-text/40 mt-2">対応形式: MP3, WAV, M4A (最大50MB)</p>
                    </label>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">タイトル</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="clay-input w-full"
                    placeholder="レッスンのタイトルを入力..."
                  />
                </div>

                {/* Topic */}
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">トピック</label>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTopic(t)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          topic === t ? 'clay-card-primary text-white' : 'bg-white/50 text-text/70 hover:bg-white'
                        }`}
                      >
                        {topicLabels[t]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">レベル</label>
                  <div className="flex gap-3">
                    {LEVELS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLevel(l)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                          level === l ? 'clay-card-secondary text-text' : 'bg-white/50 text-text/70 hover:bg-white'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                {uploadError && (
                  <div className="p-4 rounded-xl bg-red-100 text-red-700 text-sm">⚠️ {uploadError}</div>
                )}
                {uploadSuccess && (
                  <div className="p-4 rounded-xl bg-green-100 text-green-700 text-sm">✅ {uploadSuccess}</div>
                )}

                {/* Submit */}
                <ClayButton type="submit" disabled={isUploading || !file} className="w-full">
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> アップロード中...
                    </span>
                  ) : (
                    'アップロード'
                  )}
                </ClayButton>
              </form>
            </ClayCard>
          )}

          {/* List Tab */}
          {activeTab === 'list' && (
            <div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin text-4xl mb-4">⏳</div>
                  <p className="text-text/60">読み込み中...</p>
                </div>
              ) : listError ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p className="text-red-600">{listError}</p>
                  <button onClick={fetchAudios} className="mt-4 text-primary hover:underline">
                    再読み込み
                  </button>
                </div>
              ) : audios.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="font-fredoka text-xl font-semibold mb-2">音声がありません</h3>
                  <p className="text-text/60 mb-4">新しい音声をアップロードしてください</p>
                  <ClayButton onClick={() => setActiveTab('upload')}>
                    📤 アップロードする
                  </ClayButton>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-text/60">
                    全 {audios.length} 件
                  </div>
                  
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full clay-card">
                      <thead>
                        <tr className="border-b border-text/10">
                          <th className="text-left p-4 font-semibold">タイトル</th>
                          <th className="text-left p-4 font-semibold">トピック</th>
                          <th className="text-left p-4 font-semibold">レベル</th>
                          <th className="text-left p-4 font-semibold">時間</th>
                          <th className="text-left p-4 font-semibold">クイズ</th>
                          <th className="text-center p-4 font-semibold">公開</th>
                          <th className="text-center p-4 font-semibold">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {audios.map((audio) => {
                          const topicInfo = getTopicInfo(audio.topic);
                          return (
                            <tr key={audio.id} className="border-b border-text/5 hover:bg-white/30">
                              <td className="p-4">
                                <div className="font-medium">{audio.title}</div>
                                {!audio.transcript && (
                                  <span className="text-xs text-orange-500">⚠️ トランスクリプトなし</span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center gap-1">
                                  {topicInfo.icon} {topicInfo.name}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-1 bg-primary/10 rounded-full text-sm font-medium">
                                  {audio.jlptLevel}
                                </span>
                              </td>
                              <td className="p-4 text-text/60">
                                {formatDuration(audio.duration)}
                              </td>
                              <td className="p-4">
                                <span className="text-text/60">{audio._count?.quizzes || 0}問</span>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleTogglePublish(audio)}
                                  disabled={actionLoading === audio.id}
                                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                    audio.isPublished
                                      ? 'bg-mint/50 text-green-700'
                                      : 'bg-gray-200 text-gray-600'
                                  }`}
                                >
                                  {actionLoading === audio.id ? '...' : audio.isPublished ? '公開中' : '非公開'}
                                </button>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => openEditModal(audio)}
                                    className="p-2 hover:bg-white rounded-lg transition-colors"
                                    title="編集"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleGenerateTranscript(audio)}
                                    disabled={actionLoading === `transcript-${audio.id}`}
                                    className={`p-2 hover:bg-white rounded-lg transition-colors ${!audio.transcript ? 'text-orange-500' : ''}`}
                                    title={audio.transcript ? 'トランスクリプト再生成' : 'トランスクリプト生成'}
                                  >
                                    {actionLoading === `transcript-${audio.id}` ? '⏳' : '📝'}
                                  </button>
                                  <button
                                    onClick={() => handleRegenerateQuizzes(audio)}
                                    disabled={actionLoading === `quiz-${audio.id}` || !audio.transcript}
                                    className={`p-2 hover:bg-white rounded-lg transition-colors ${!audio.transcript ? 'opacity-30' : ''}`}
                                    title="クイズ再生成"
                                  >
                                    {actionLoading === `quiz-${audio.id}` ? '⏳' : '🔄'}
                                  </button>
                                  <button
                                    onClick={() => openDeleteConfirm(audio)}
                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500"
                                    title="削除"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {audios.map((audio) => {
                      const topicInfo = getTopicInfo(audio.topic);
                      return (
                        <ClayCard key={audio.id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{audio.title}</h3>
                              <div className="flex flex-wrap gap-2 text-sm text-text/60">
                                <span>{topicInfo.icon} {topicInfo.name}</span>
                                <span>• {audio.jlptLevel}</span>
                                <span>• {formatDuration(audio.duration)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleTogglePublish(audio)}
                              disabled={actionLoading === audio.id}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                audio.isPublished ? 'bg-mint/50 text-green-700' : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {actionLoading === audio.id ? '...' : audio.isPublished ? '公開' : '非公開'}
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-text/10">
                            <span className="text-sm text-text/60">
                              📝 {audio._count?.quizzes || 0}問
                              {!audio.transcript && <span className="ml-2 text-orange-500">⚠️ No transcript</span>}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(audio)}
                                className="p-2 clay-btn text-sm"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleGenerateTranscript(audio)}
                                disabled={actionLoading === `transcript-${audio.id}`}
                                className={`p-2 clay-btn text-sm ${!audio.transcript ? 'text-orange-500' : ''}`}
                              >
                                {actionLoading === `transcript-${audio.id}` ? '⏳' : '📝'}
                              </button>
                              <button
                                onClick={() => handleRegenerateQuizzes(audio)}
                                disabled={actionLoading === `quiz-${audio.id}` || !audio.transcript}
                                className={`p-2 clay-btn text-sm ${!audio.transcript ? 'opacity-30' : ''}`}
                              >
                                {actionLoading === `quiz-${audio.id}` ? '⏳' : '🔄'}
                              </button>
                              <button
                                onClick={() => openDeleteConfirm(audio)}
                                className="p-2 clay-btn text-sm text-red-500"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </ClayCard>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Edit Modal */}
      {editingAudio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <ClayCard className="w-full max-w-lg p-6">
            <h2 className="font-fredoka text-xl font-semibold mb-4">✏️ 音声を編集</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">タイトル</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="clay-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">説明</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="clay-input w-full h-24 resize-none"
                  placeholder="説明を入力..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">トピック</label>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, topic: t })}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        editForm.topic === t
                          ? 'bg-primary text-white'
                          : 'bg-white/50 hover:bg-white'
                      }`}
                    >
                      {topicLabels[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">レベル</label>
                <div className="flex gap-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, jlptLevel: l })}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        editForm.jlptLevel === l
                          ? 'bg-secondary text-white'
                          : 'bg-white/50 hover:bg-white'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">📝 トランスクリプト</label>
                <textarea
                  value={editForm.transcript}
                  onChange={(e) => setEditForm({ ...editForm, transcript: e.target.value })}
                  className="clay-input w-full h-40 resize-none font-mono text-sm"
                  placeholder="音声のトランスクリプト（書き起こし）を入力..."
                />
                {editingAudio?.transcript && editForm.transcript !== editingAudio.transcript && (
                  <p className="text-xs text-orange-500 mt-1">⚠️ トランスクリプトが変更されています</p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <ClayButton type="submit" disabled={isEditing} className="flex-1">
                  {isEditing ? '保存中...' : '保存'}
                </ClayButton>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="clay-btn px-6"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </ClayCard>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAudio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <ClayCard className="w-full max-w-md p-6 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="font-fredoka text-xl font-semibold mb-2">削除確認</h2>
            <p className="text-text/70 mb-2">この音声を削除しますか？</p>
            <p className="font-semibold text-lg mb-6">「{deletingAudio.title}」</p>
            <p className="text-sm text-red-500 mb-6">この操作は取り消せません</p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
              <button
                onClick={closeDeleteConfirm}
                className="clay-btn px-6 py-3"
              >
                キャンセル
              </button>
            </div>
          </ClayCard>
        </div>
      )}

      <Footer />
    </main>
  );
}
