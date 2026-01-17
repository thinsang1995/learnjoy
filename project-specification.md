# 📄 PROJECT SPECIFICATION — LearnJoy Japanese Listening Platform (N2/N3)

**Version**: MVP v1.1  
**Owner**: thín  
**Date**: 2026-01-17  
**UI Theme**: LearnJoy Claymorphism Design System

---

## 1. 🎯 Mục tiêu dự án

Tạo một nền tảng web giúp người học tiếng Nhật N2–N3:

- Nghe audio theo chủ đề
- Làm quiz tương tác ngay khi nghe
- Tự động tạo transcript và quiz từ audio có sẵn
- Tái sử dụng audio để scale lên hàng trăm bài nghe
- Trải nghiệm mượt, nhẹ, tối ưu dung lượng
- **UI/UX Playful với Claymorphism design**

---

## 2. 👥 Đối tượng người dùng

- Người học JLPT N3–N2
- Người muốn luyện nghe hội thoại tự nhiên
- Người muốn luyện nghe theo chủ đề đời sống Nhật
- Người muốn luyện nghe + làm quiz giống JLPT

---

## 3. 🎨 UI/UX Design System - LearnJoy Claymorphism

### 3.1. Brand Identity

| Element | Value |
|---------|-------|
| **Brand Name** | LearnJoy |
| **Tagline** | "Learn Anything, Joyfully" |
| **Design Style** | Claymorphism (Soft 3D, Playful) |

### 3.2. Color Palette

```css
/* Primary Colors */
--primary: #4F46E5;      /* Indigo - Main brand */
--secondary: #818CF8;    /* Light Indigo */
--cta: #F97316;          /* Orange - Call to action */

/* Background & Text */
--background: #EEF2FF;   /* Soft indigo background */
--text: #1E1B4B;         /* Dark indigo text */
--border: #C7D2FE;       /* Light border */

/* Accent Colors (Cards) */
--soft-peach: #FDBCB4;   /* Topic: 日常会話 */
--baby-blue: #ADD8E6;    /* Topic: ビジネス */
--mint: #98FF98;         /* Topic: 旅行 */
--lilac: #E6E6FA;        /* Topic: 文化 */
```

### 3.3. Typography

| Element | Font | Weight |
|---------|------|--------|
| Headings | Fredoka | 400-700 |
| Body | Nunito | 300-700 |

### 3.4. Claymorphism Card Styles

```css
.clay-card {
  background: linear-gradient(145deg, #ffffff, #f5f5f5);
  border-radius: 24px;
  border: 3px solid rgba(0, 0, 0, 0.08);
  box-shadow: 
    8px 8px 16px rgba(0, 0, 0, 0.1),
    -4px -4px 12px rgba(255, 255, 255, 0.9),
    inset 2px 2px 4px rgba(255, 255, 255, 0.5);
  transition: all 200ms ease-out;
}

.clay-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    12px 12px 24px rgba(0, 0, 0, 0.12),
    -6px -6px 16px rgba(255, 255, 255, 1);
}
```

### 3.5. Component Reference

| Component | Class | Usage |
|-----------|-------|-------|
| Default Card | `.clay-card` | Audio cards, Quiz containers |
| Peach Card | `.clay-card-peach` | 日常会話 topic |
| Blue Card | `.clay-card-blue` | ビジネス topic |
| Mint Card | `.clay-card-mint` | 旅行 topic |
| Lilac Card | `.clay-card-lilac` | 文化 topic |
| Primary Button | `.clay-card-primary .clay-btn` | Main CTA |
| Secondary Button | `.clay-card-secondary .clay-btn` | Secondary actions |

---

## 4. 🧩 Tính năng chính (MVP)

### 4.1. Upload & quản lý audio

- Upload file `.mp3` / `.m4a`
- Lưu file vào **Cloudflare R2** (free tier: 10GB, egress miễn phí)
- Lưu metadata vào DB:
  - `id`, `title`, `topic`, `audio_url`, `duration`, `thumbnail_color`

### 4.2. Tự động tạo transcript (Whisper)

- Dùng **Whisper.cpp** chạy trong Docker container
- Model: `medium` (tối ưu cho tiếng Nhật)
- Tạo transcript tiếng Nhật với timestamps
- Lưu transcript vào DB

### 4.3. Tự động tạo quiz (Groq + Llama 3.1)

Từ transcript, AI tạo 3 loại quiz:

| Type | Description | UI Component |
|------|-------------|--------------|
| **MCQ** | 1 câu hỏi, 4 đáp án, giải thích | Radio buttons với clay-card |
| **Fill-blank** | 1 câu, 1 từ ẩn, 3 lựa chọn | Select dropdown với clay styling |
| **Reorder** | 1 câu, 4-6 mảnh xáo trộn | Drag & drop với dnd-kit |

### 4.4. UI vừa nghe vừa làm quiz

- Audio player với clay-card styling
- Quiz hiển thị ngay dưới audio
- Người dùng có thể:
  - Replay đoạn audio
  - Chọn đáp án (với visual feedback)
  - Xem đúng/sai (highlight màu)
  - Xem giải thích

### 4.5. Tối ưu dung lượng & tốc độ

- Audio streaming (HTTP Range Requests)
- Nén audio 64–96kbps
- CDN phân phối audio (R2 + Cloudflare)
- Cache transcript + quiz
- Không generate lại quiz nếu đã có

---

## 5. 🧱 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Environment                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │   Backend    │    │  PostgreSQL  │  │
│  │   Next.js    │◄──►│   NestJS     │◄──►│     DB       │  │
│  │   :3000      │    │   :3001      │    │   :5432      │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                             │                                │
│                             ▼                                │
│                    ┌──────────────┐                         │
│                    │   Whisper    │                         │
│                    │  Container   │                         │
│                    └──────────────┘                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
      │ Cloudflare  │ │  Groq API   │ │   Vercel    │
      │     R2      │ │ (Llama 3.1) │ │  (Deploy)   │
      └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 6. 🗄️ Database Schema (MVP)

### Table: `audio`

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `title` | text | Tên bài nghe |
| `topic` | text | Chủ đề (daily, business, travel, culture) |
| `audio_url` | text | Link CDN |
| `duration` | int | Giây |
| `thumbnail_color` | text | peach/blue/mint/lilac |
| `transcript` | text | Transcript đầy đủ |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### Table: `quiz`

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key |
| `audio_id` | uuid | Foreign key |
| `type` | enum | mcq / fill / reorder |
| `data_json` | jsonb | Nội dung quiz |
| `created_at` | timestamp | |

---

## 7. 🔧 Backend API (NestJS)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/audio/upload` | Upload audio → storage → return audio_id |
| `GET` | `/api/audio` | List audio (paginated, filter by topic) |
| `GET` | `/api/audio/:id` | Get audio detail |
| `POST` | `/api/audio/:id/transcript` | Generate transcript via Whisper |
| `DELETE` | `/api/audio/:id` | Delete audio |
| `POST` | `/api/quiz/generate` | Generate quiz from transcript |
| `GET` | `/api/audio/:id/quiz` | Get saved quizzes |
| `POST` | `/api/quiz/:id/submit` | Submit answer, get result |

---

## 8. 🐳 Docker Setup (Cross-platform)

### Yêu cầu hệ thống

| Platform | Requirement |
|----------|-------------|
| **Windows** | Docker Desktop, WSL2 |
| **macOS** | Docker Desktop (Apple Silicon/Intel) |
| **RAM** | Minimum 8GB, Recommended 16GB |

### Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `postgres` | postgres:15-alpine | 5432 | Database |
| `backend` | node:20-alpine | 3001 | NestJS API |
| `frontend` | node:20-alpine | 3000 | Next.js UI |
| `whisper` | Custom Dockerfile | - | Whisper.cpp |

### Whisper Container Options

| Platform | Base Image | Model |
|----------|------------|-------|
| macOS (Apple Silicon) | Ubuntu + Metal | ggml-medium.bin |
| macOS (Intel) | Ubuntu + CPU | ggml-medium.bin |
| Windows (WSL2) | Ubuntu + CPU/CUDA | ggml-medium.bin |

---

## 9. 🎮 Quiz UI Components (Next.js + Claymorphism)

### MCQ Component

```tsx
<div className="clay-card p-6 space-y-4">
  <h3 className="font-heading text-xl">{question}</h3>
  {options.map((opt, i) => (
    <label className={`clay-card clay-btn p-4 cursor-pointer ${
      selected === i ? 'clay-card-primary text-white' : ''
    }`}>
      <input type="radio" /> {opt}
    </label>
  ))}
</div>
```

### Fill-blank Component

```tsx
<div className="clay-card p-6">
  <p className="text-lg">
    {beforeBlank} 
    <select className="clay-card px-4 py-2 mx-2">
      {options.map(opt => <option>{opt}</option>)}
    </select>
    {afterBlank}
  </p>
</div>
```

### Reorder Component

```tsx
<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={segments}>
    {segments.map(seg => (
      <div className="clay-card clay-btn p-4 cursor-grab">
        {seg.text}
      </div>
    ))}
  </SortableContext>
</DndContext>
```

---

## 10. 🚀 MVP 7-day Plan

| Day | Focus | Deliverables |
|-----|-------|--------------|
| **Day 1** | Docker Setup | docker-compose.yml, all services running |
| **Day 2** | Whisper Pipeline | Transcript service working in container |
| **Day 3** | Groq Integration | Quiz generation API |
| **Day 4** | Backend APIs | Full CRUD, Prisma, Swagger docs |
| **Day 5** | Frontend Core | LearnJoy UI, AudioPlayer, AudioList |
| **Day 6** | Quiz UI | 3 quiz types với Claymorphism |
| **Day 7** | Deploy & Test | Production deployment, E2E tests |

---

## 11. 📁 Project Structure

```
learnjoy/
├── docker-compose.yml          # Main orchestration
├── docker-compose.override.yml # Dev overrides
├── .env.example
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── audio/
│   │   ├── quiz/
│   │   ├── transcript/
│   │   ├── ai/
│   │   └── storage/
│   └── prisma/
│
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── audio/
│   │   │   ├── quiz/
│   │   │   └── ui/
│   │   └── styles/
│   │       └── claymorphism.css
│   └── tailwind.config.js
│
├── whisper/
│   ├── Dockerfile
│   └── scripts/
│
└── docs/
    ├── plan.md
    └── api-contracts.md
```

---

## 12. 🔑 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://admin:secret@postgres:5432/learnjoy

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=learnjoy-audio
R2_PUBLIC_URL=https://cdn.learnjoy.app

# Groq API
GROQ_API_KEY=gsk_xxxxx

# Whisper
WHISPER_MODEL=medium
WHISPER_LANGUAGE=ja

# App
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 13. ✅ Success Criteria (MVP)

- [ ] Docker Compose chạy được trên cả Windows và macOS
- [ ] Upload audio và tự động tạo transcript
- [ ] Generate được 3 loại quiz từ transcript
- [ ] UI LearnJoy với Claymorphism design
- [ ] Audio streaming mượt
- [ ] Quiz interaction hoạt động đúng với visual feedback
- [ ] Mobile responsive
- [ ] Response time < 3s

---

## 14. 🔮 Post-MVP Features

1. User Authentication (Supabase Auth)
2. Progress Tracking & Spaced Repetition
3. Leaderboard & Gamification
4. More Quiz Types (Shadowing, Dictation)
5. Admin Dashboard
6. Analytics Dashboard
7. PWA Offline Mode

---

**Last Updated**: 2026-01-17  
**Status**: Ready for Development