# Implementation Plan: LearnJoy Japanese Listening Platform (N2/N3)

**Branch**: `001-learnjoy-japanese-listening` | **Date**: 2026-01-17 | **Spec**: [project-specification.md](project-specification.md)
**Input**: Feature specification from `/Learning-quiz/project-specification.md`
**UI Theme**: LearnJoy Claymorphism Design System

---

## Summary

Xây dựng nền tảng web luyện nghe tiếng Nhật N2–N3 với khả năng:

- Upload và quản lý audio files
- Tự động tạo transcript từ audio bằng Whisper (Docker container)
- Tự động generate quiz (MCQ, Fill-in-blank, Reorder) bằng Groq LLM
- UI streaming audio + interactive quiz với **LearnJoy Claymorphism design**
- **Docker-based development** (cross-platform: Windows + macOS)

**Technical Approach**: Next.js Frontend + NestJS Backend + PostgreSQL + Cloudflare R2 + Whisper.cpp (Docker) + Groq API

---

## Technical Context

| Item | Value |
|------|-------|
| **Language/Version** | TypeScript 5.x, Node.js 20 LTS |
| **Frontend** | Next.js 14 (App Router), React 18, TailwindCSS |
| **UI Design** | LearnJoy Claymorphism (Fredoka + Nunito fonts) |
| **Backend** | NestJS 10, Prisma |
| **Storage** | PostgreSQL 15, Cloudflare R2 (free tier: 10GB) |
| **AI/ML** | Whisper.cpp (Docker, medium model), Groq API (Llama 3.1) |
| **Container** | Docker Compose (Windows WSL2 + macOS) |
| **Testing** | Jest, React Testing Library, Playwright (E2E) |
| **Target Platform** | Web (Desktop + Mobile responsive) |
| **Performance Goals** | Audio streaming < 2s start, Quiz generation < 5s |
| **Constraints** | Audio compressed 64-96kbps, CDN caching |
| **Scale/Scope** | MVP: 100+ audio files, 1000+ users |

---

## UI Design System - LearnJoy Claymorphism

### Color Palette

```css
/* Primary */
--primary: #4F46E5;
--secondary: #818CF8;
--cta: #F97316;

/* Background */
--background: #EEF2FF;
--text: #1E1B4B;

/* Topic Colors */
--soft-peach: #FDBCB4;  /* 日常会話 */
--baby-blue: #ADD8E6;   /* ビジネス */
--mint: #98FF98;        /* 旅行 */
--lilac: #E6E6FA;       /* 文化 */
```

### Typography

| Element | Font | Weight |
|---------|------|--------|
| Headings | Fredoka | 400-700 |
| Body | Nunito | 300-700 |

### Claymorphism Classes

| Class | Usage |
|-------|-------|
| `.clay-card` | Default card styling |
| `.clay-card-peach` | Daily conversation topic |
| `.clay-card-blue` | Business topic |
| `.clay-card-mint` | Travel topic |
| `.clay-card-lilac` | Culture topic |
| `.clay-card-primary` | Primary action buttons |
| `.clay-btn` | Button with press animation |

---

## Project Structure

### Documentation

```text
Learning-quiz/
├── project-specification.md  # Project spec
├── plan.md                   # This file
├── main-ui.html              # UI reference (LearnJoy design)
├── research.md               # Phase 0 - Technical research
├── data-model.md             # Phase 1 - Database design
├── api-contracts.md          # Phase 1 - API documentation
├── quickstart.md             # Phase 1 - Setup guide
└── tasks.md                  # Phase 2 - Task breakdown
```

### Source Code (Repository Root)

```text
learnjoy/
├── docker-compose.yml           # Main Docker orchestration
├── docker-compose.override.yml  # Dev overrides
├── .env.example
├── README.md
│
├── backend/                     # NestJS Backend
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── config/
│   │   │   └── config.module.ts
│   │   ├── audio/
│   │   │   ├── audio.controller.ts
│   │   │   ├── audio.service.ts
│   │   │   ├── audio.module.ts
│   │   │   └── dto/
│   │   ├── quiz/
│   │   │   ├── quiz.controller.ts
│   │   │   ├── quiz.service.ts
│   │   │   ├── quiz.module.ts
│   │   │   └── dto/
│   │   ├── transcript/
│   │   │   ├── transcript.service.ts
│   │   │   └── transcript.module.ts
│   │   ├── ai/
│   │   │   ├── groq.service.ts
│   │   │   └── ai.module.ts
│   │   ├── storage/
│   │   │   ├── r2.service.ts
│   │   │   └── storage.module.ts
│   │   └── common/
│   │       ├── filters/
│   │       └── interceptors/
│   ├── test/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── package.json
│
├── frontend/                    # Next.js Frontend
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # Home (Hero + Course list)
│   │   │   ├── audio/
│   │   │   │   ├── page.tsx       # Audio list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Audio detail + quiz
│   │   │   └── admin/
│   │   │       └── upload/
│   │   │           └── page.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── Footer.tsx
│   │   │   ├── audio/
│   │   │   │   ├── AudioPlayer.tsx
│   │   │   │   ├── AudioCard.tsx
│   │   │   │   └── AudioList.tsx
│   │   │   ├── quiz/
│   │   │   │   ├── QuizContainer.tsx
│   │   │   │   ├── MCQQuiz.tsx
│   │   │   │   ├── FillBlankQuiz.tsx
│   │   │   │   └── ReorderQuiz.tsx
│   │   │   └── ui/
│   │   │       ├── ClayCard.tsx
│   │   │       ├── ClayButton.tsx
│   │   │       └── Loading.tsx
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── claymorphism.css
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── public/
│   ├── tailwind.config.js
│   └── package.json
│
├── whisper/                     # Whisper.cpp Container
│   ├── Dockerfile
│   ├── Dockerfile.apple-silicon # For M1/M2/M3 Macs
│   └── scripts/
│       └── transcribe.sh
│
└── scripts/
    ├── setup-windows.sh
    └── setup-macos.sh
```

---

## Docker Setup (Cross-Platform)

### System Requirements

| Platform | Requirement |
|----------|-------------|
| **Windows** | Docker Desktop 4.x, WSL2 enabled, 16GB RAM recommended |
| **macOS Intel** | Docker Desktop 4.x, 16GB RAM recommended |
| **macOS Apple Silicon** | Docker Desktop 4.x (ARM64), 16GB RAM recommended |

### docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: learnjoy-db
    environment:
      POSTGRES_DB: learnjoy
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secret}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d learnjoy"]
      interval: 10s
      timeout: 5s
      retries: 5

  # NestJS Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: learnjoy-backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD:-secret}@postgres:5432/learnjoy
      GROQ_API_KEY: ${GROQ_API_KEY}
      R2_ACCOUNT_ID: ${R2_ACCOUNT_ID}
      R2_ACCESS_KEY_ID: ${R2_ACCESS_KEY_ID}
      R2_SECRET_ACCESS_KEY: ${R2_SECRET_ACCESS_KEY}
      R2_BUCKET_NAME: ${R2_BUCKET_NAME:-learnjoy-audio}
      WHISPER_SERVICE_URL: http://whisper:5000
    volumes:
      - ./backend/src:/app/src
      - ./uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy

  # Next.js Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: learnjoy-frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
    depends_on:
      - backend

  # Whisper.cpp Service
  whisper:
    build:
      context: ./whisper
      dockerfile: ${WHISPER_DOCKERFILE:-Dockerfile}
    container_name: learnjoy-whisper
    ports:
      - "5000:5000"
    volumes:
      - ./uploads:/uploads
      - whisper_models:/models
    environment:
      WHISPER_MODEL: ${WHISPER_MODEL:-medium}
      WHISPER_LANGUAGE: ja

volumes:
  postgres_data:
  whisper_models:
```

### Whisper Dockerfiles

**Dockerfile (CPU - Universal)**

```dockerfile
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone and build whisper.cpp
RUN git clone https://github.com/ggerganov/whisper.cpp.git && \
    cd whisper.cpp && \
    make

# Download model
RUN cd whisper.cpp && \
    bash ./models/download-ggml-model.sh medium

# Install Flask for API
RUN pip3 install flask

COPY scripts/transcribe.sh /app/
COPY scripts/api.py /app/

EXPOSE 5000

CMD ["python3", "api.py"]
```

**Dockerfile.apple-silicon (For M1/M2/M3)**

```dockerfile
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone and build whisper.cpp with Metal support
RUN git clone https://github.com/ggerganov/whisper.cpp.git && \
    cd whisper.cpp && \
    WHISPER_METAL=1 make

RUN cd whisper.cpp && \
    bash ./models/download-ggml-model.sh medium

RUN pip3 install flask

COPY scripts/transcribe.sh /app/
COPY scripts/api.py /app/

EXPOSE 5000

CMD ["python3", "api.py"]
```

### Platform-Specific Setup Scripts

**setup-windows.sh (Run in WSL2)**

```bash
#!/bin/bash
echo "🚀 Setting up LearnJoy on Windows (WSL2)..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop."
    exit 1
fi

# Set Whisper Dockerfile for CPU
export WHISPER_DOCKERFILE=Dockerfile

# Copy env file
cp .env.example .env

echo "✅ Setup complete! Run: docker-compose up -d"
```

**setup-macos.sh**

```bash
#!/bin/bash
echo "🚀 Setting up LearnJoy on macOS..."

# Detect architecture
ARCH=$(uname -m)

if [ "$ARCH" = "arm64" ]; then
    echo "📱 Detected Apple Silicon (M1/M2/M3)"
    export WHISPER_DOCKERFILE=Dockerfile.apple-silicon
else
    echo "💻 Detected Intel Mac"
    export WHISPER_DOCKERFILE=Dockerfile
fi

# Copy env file
cp .env.example .env

echo "✅ Setup complete! Run: docker-compose up -d"
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Audio {
  id             String    @id @default(uuid())
  title          String
  topic          String    // daily, business, travel, culture
  audioUrl       String    @map("audio_url")
  duration       Int       // seconds
  thumbnailColor String    @default("peach") @map("thumbnail_color") // peach, blue, mint, lilac
  transcript     String?   @db.Text
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  
  quizzes        Quiz[]
  
  @@map("audio")
}

model Quiz {
  id        String   @id @default(uuid())
  audioId   String   @map("audio_id")
  type      QuizType
  dataJson  Json     @map("data_json")
  createdAt DateTime @default(now()) @map("created_at")
  
  audio     Audio    @relation(fields: [audioId], references: [id], onDelete: Cascade)
  
  @@map("quiz")
}

enum QuizType {
  mcq
  fill
  reorder
}
```

---

## API Contracts

### Audio APIs

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| `POST` | `/api/audio/upload` | Upload audio file | `multipart/form-data` | `{ id, title, audioUrl }` |
| `GET` | `/api/audio` | List all audio | `?topic=&page=&limit=` | `{ data: Audio[], total }` |
| `GET` | `/api/audio/:id` | Get audio detail | - | `Audio` |
| `POST` | `/api/audio/:id/transcript` | Generate transcript | - | `{ transcript }` |
| `DELETE` | `/api/audio/:id` | Delete audio | - | `{ success }` |

### Quiz APIs

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| `POST` | `/api/quiz/generate` | Generate quiz | `{ audioId, type }` | `Quiz` |
| `GET` | `/api/audio/:id/quiz` | Get quizzes for audio | `?type=` | `Quiz[]` |
| `POST` | `/api/quiz/:id/submit` | Submit quiz answer | `{ answer }` | `{ correct, explanation }` |

---

## Phase 0: Docker & Setup (Day 1)

### Tasks

| # | Task | Output | Duration |
|---|------|--------|----------|
| 0.1 | Create project structure | All folders created | 1h |
| 0.2 | Setup docker-compose.yml | All services defined | 1h |
| 0.3 | Create Whisper Dockerfiles | CPU + Apple Silicon | 1h |
| 0.4 | Setup PostgreSQL container | DB running, migrations | 1h |
| 0.5 | Setup Cloudflare R2 bucket | Storage ready | 1h |
| 0.6 | Create .env.example | All variables documented | 30m |
| 0.7 | Test on Windows (WSL2) | Services running | 1h |
| 0.8 | Test on macOS | Services running | 1h |

### Deliverables

- [ ] `docker-compose up -d` works on both platforms
- [ ] PostgreSQL accessible at localhost:5432
- [ ] Whisper container builds successfully
- [ ] `.env.example` with all required variables

---

## Phase 1: Backend Core (Day 2-4)

### Day 2: Whisper Pipeline

| # | Task | Description | Duration |
|---|------|-------------|----------|
| 1.1 | Create Whisper API service | Flask REST API | 2h |
| 1.2 | Create TranscriptService | NestJS service calling Whisper | 2h |
| 1.3 | Add audio preprocessing | Convert to WAV, normalize | 2h |
| 1.4 | Test Japanese transcription | Verify N2/N3 accuracy | 2h |

### Day 3: Groq Quiz Generator

| # | Task | Description | Duration |
|---|------|-------------|----------|
| 2.1 | Setup Groq SDK | API client in NestJS | 1h |
| 2.2 | Create MCQ prompt | Optimized for Japanese | 2h |
| 2.3 | Create Fill-blank prompt | Handle kanji/hiragana | 2h |
| 2.4 | Create Reorder prompt | Sentence segmentation | 2h |
| 2.5 | Implement QuizService | Generate + validate + cache | 2h |

### Day 4: API & Database

| # | Task | Description | Duration |
|---|------|-------------|----------|
| 3.1 | Setup Prisma schema | Migrations, seed data | 2h |
| 3.2 | Implement AudioController | CRUD endpoints | 2h |
| 3.3 | Implement QuizController | Generate + retrieve | 2h |
| 3.4 | Setup R2 StorageService | Upload, presigned URLs | 2h |
| 3.5 | Add Swagger documentation | API docs at /api/docs | 1h |

### Deliverables

- [ ] Whisper API endpoint working
- [ ] All CRUD APIs working
- [ ] Quiz generation working
- [ ] Swagger documentation
- [ ] Unit tests for services

---

## Phase 2: Frontend Development (Day 5-6)

### Day 5: Core UI with Claymorphism

| # | Task | Description | Duration |
|---|------|-------------|----------|
| 4.1 | Setup Next.js + TailwindCSS | Configure fonts, colors | 1h |
| 4.2 | Create claymorphism.css | All clay-* classes | 1h |
| 4.3 | Create Navbar component | Floating nav, logo | 1h |
| 4.4 | Create Hero section | Based on main-ui.html | 2h |
| 4.5 | Create AudioCard component | Clay card with topic colors | 2h |
| 4.6 | Create AudioList page | Grid layout, topic filters | 2h |

### Day 6: Quiz UI Components

| # | Task | Description | Duration |
|---|------|-------------|----------|
| 5.1 | Create AudioPlayer | Streaming, clay styling | 2h |
| 5.2 | Create MCQQuiz | Radio buttons, feedback | 2h |
| 5.3 | Create FillBlankQuiz | Select dropdown | 1h |
| 5.4 | Create ReorderQuiz | dnd-kit drag & drop | 3h |
| 5.5 | Add quiz result summary | Score, explanations | 1h |
| 5.6 | Mobile responsive | Touch optimization | 1h |

### Deliverables

- [ ] Home page with Hero + Course list
- [ ] Audio list page with filters
- [ ] Audio detail page with player + quiz
- [ ] All quiz types working
- [ ] Mobile responsive

---

## Phase 3: Optimization & Deploy (Day 7)

### Tasks

| # | Task | Description | Duration |
|---|------|-------------|----------|
| 6.1 | Audio streaming | HTTP Range Requests | 1h |
| 6.2 | Setup R2 public access | CDN URLs | 1h |
| 6.3 | Add response caching | Quiz, audio metadata | 2h |
| 6.4 | Lighthouse audit | Target > 90 score | 1h |
| 6.5 | Create production compose | docker-compose.prod.yml | 1h |
| 6.6 | Deploy to Railway/Fly.io | Backend deployment | 1h |
| 6.7 | Deploy to Vercel | Frontend deployment | 30m |
| 6.8 | E2E testing | Playwright tests | 2h |

### Deliverables

- [ ] Production deployment working
- [ ] CDN configured for audio
- [ ] Performance > 90 Lighthouse
- [ ] E2E tests passing

---

## AI Prompts Reference

### MCQ Generation Prompt

```text
あなたはJLPT N2/N3レベルの日本語リスニングクイズ作成者です。

以下のトランスクリプトから、選択式クイズを1問作成してください。

【トランスクリプト】
{transcript}

【出力形式】JSON
{
  "question": "質問文（日本語）",
  "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "correctIndex": 0,
  "explanation": "正解の理由（日本語）"
}

【注意】
- N2/N3レベルの語彙・文法を使用
- 音声を聞いて答えられる内容質問
- 紛らわしい選択肢を含める
```

### Fill-in-blank Prompt

```text
以下のトランスクリプトから、穴埋めクイズを1問作成してください。

【トランスクリプト】
{transcript}

【出力形式】JSON
{
  "sentence": "＿＿＿を含む文",
  "blankWord": "正解の単語",
  "options": ["正解", "誤答1", "誤答2"],
  "hint": "ヒント（任意）"
}
```

### Reorder Prompt

```text
以下のトランスクリプトから、並べ替えクイズを1問作成してください。

【トランスクリプト】
{transcript}

【出力形式】JSON
{
  "originalSentence": "元の文",
  "segments": ["シャッフルされた", "文の", "パーツ", "配列"],
  "correctOrder": [2, 0, 3, 1]
}
```

---

## Environment Variables

```bash
# .env.example

# Database
DB_PASSWORD=your_secure_password

# Cloudflare R2 (Free tier: 10GB)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=learnjoy-audio
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Groq API (Free tier: 14,400 req/day)
GROQ_API_KEY=gsk_xxxxx

# Whisper (Docker)
WHISPER_MODEL=medium
WHISPER_LANGUAGE=ja
WHISPER_DOCKERFILE=Dockerfile  # or Dockerfile.apple-silicon

# App URLs
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Risk & Mitigation

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| Whisper accuracy for Japanese | High | Test với multiple models, fallback to cloud API | ✅ Working |
| Groq rate limits | Medium | Implement queue, cache aggressively | ✅ Implemented |
| Docker build time | Medium | Use multi-stage builds, cache layers | ✅ Optimized |
| Cross-platform issues | Medium | Test on both Windows + macOS | ✅ Tested |
| Audio storage costs | Low | Cloudflare R2 free egress | ✅ Configured |
| **Prisma Alpine compatibility** | High | Add `linux-musl-openssl-3.0.x` binary target | ✅ Fixed |
| **Database password sync** | Medium | Document: reset volume if password changed | ✅ Documented |
| **R2 credential validation** | Medium | Auto-fallback to local storage if invalid | ✅ Implemented |

---

## Success Criteria (MVP)

- [ ] Docker Compose chạy được trên cả Windows và macOS
- [ ] Upload audio và tự động tạo transcript
- [ ] Generate được 3 loại quiz từ transcript
- [ ] UI LearnJoy với Claymorphism design
- [ ] Audio streaming mượt
- [ ] Quiz interaction hoạt động đúng
- [ ] Mobile responsive
- [ ] Response time < 3s
- [ ] Production deployment thành công

---

## Commands Reference

```bash
# === Development ===

# First time setup (Windows WSL2)
./scripts/setup-windows.sh
docker-compose up -d

# First time setup (macOS)
./scripts/setup-macos.sh
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f whisper

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Database migrations
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma studio

# === Production ===

# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# === Testing ===

# Backend tests
docker-compose exec backend npm test

# Frontend tests
docker-compose exec frontend npm test

# E2E tests
npm run test:e2e

# === Troubleshooting ===

# Reset database (when password changed)
docker-compose down -v
docker-compose up -d

# Create database tables
docker exec learnjoy-backend npx prisma db push

# Regenerate Prisma client
docker exec learnjoy-backend npx prisma generate

# Check backend logs
docker logs learnjoy-backend --tail 50

# Check all services
docker ps -a
```

---

## Troubleshooting Guide

### 1. Database Authentication Failed (P1000)

**Error:**
```
PrismaClientInitializationError: Authentication failed against database server
```

**Nguyên nhân:** Password trong `.env` khác với password database volume đã tạo.

**Giải pháp:**
```bash
docker-compose down -v  # Xóa volumes
docker-compose up -d    # Tạo lại với password mới
```

### 2. Table does not exist

**Error:**
```
The table `public.audio` does not exist in the current database
```

**Nguyên nhân:** Database mới tạo, chưa có tables.

**Giải pháp:**
```bash
docker exec learnjoy-backend npx prisma db push
```

### 3. Prisma Engine Error (Alpine Linux)

**Error:**
```
Unable to require libquery_engine-linux-musl.so.node
```

**Nguyên nhân:** Thiếu binary target cho Alpine Linux với OpenSSL 3.x.

**Giải pháp:** Cập nhật `prisma/schema.prisma`:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

Sau đó:
```bash
docker exec learnjoy-backend npx prisma generate
docker-compose restart backend
```

### 4. R2 Storage SSL Error

**Error:**
```
write EPROTO...sslv3 alert handshake failure
```

**Nguyên nhân:** R2 credentials là placeholder values hoặc không hợp lệ.

**Giải pháp:**
- Cập nhật credentials thật từ Cloudflare Dashboard
- Hoặc xóa R2 credentials để dùng local storage fallback

### 5. Full Reset

Khi gặp nhiều lỗi, reset toàn bộ:
```bash
docker-compose down -v --remove-orphans
docker-compose up -d
sleep 30
docker exec learnjoy-backend npx prisma db push
```

---

## Lessons Learned (2026-01-17)

### Docker & Prisma trên Alpine Linux

1. **Prisma cần binary target chính xác** cho Alpine:
   - Node.js 20 trên Alpine dùng OpenSSL 3.x
   - Cần `linux-musl-openssl-3.0.x` thay vì `linux-musl`

2. **Database password sync:**
   - Password trong `.env` phải match với lúc tạo DB volume
   - Nếu đổi password, phải `docker-compose down -v`

3. **Prisma migrations vs db push:**
   - Development: Dùng `prisma db push` (nhanh, không cần migration files)
   - Production: Dùng `prisma migrate deploy`

### R2 Storage Fallback

1. **Auto-detect invalid credentials:**
   - Check `R2_ACCOUNT_ID` không chứa "your_" 
   - Check độ dài credentials > 10 chars
   - Tự động fallback sang local storage nếu invalid

2. **Local storage path:** `/app/uploads` (mounted từ host)

---

## Post-MVP Features (Backlog)

1. **User Authentication** - Supabase Auth integration
2. **Progress Tracking** - Save user quiz results
3. **Spaced Repetition** - Review wrong answers
4. **Leaderboard** - Gamification
5. **More Quiz Types** - Shadowing, dictation
6. ~~**Admin Dashboard** - Content management~~ ✅ Implemented
7. **Analytics** - User performance tracking
8. **PWA Offline Mode** - Service worker caching

---

## Phase 4: Maintenance & Enhancements (2026-01-18)

### 4.1 Admin Audio Management Dashboard

**Route:** `/admin`

**Features:**
| Feature | Description | Status |
|---------|-------------|--------|
| Audio List | Table view with pagination, search, filter | ✅ |
| Upload Audio | Upload form integrated in admin page | ✅ |
| Edit Audio | Update title, topic, JLPT level, description | ✅ |
| Delete Audio | Soft delete with confirmation | ✅ |
| Publish/Unpublish | Toggle `isPublished` status | ✅ |
| Transcript Management | View/Edit transcript | ✅ |
| Quiz Management | Regenerate quizzes | ✅ |

**UI Components:**
```text
/admin
├── AudioTable.tsx          # Sortable table with actions
├── AudioUploadForm.tsx     # Upload with metadata
├── AudioEditModal.tsx      # Edit audio details
├── PublishToggle.tsx       # Toggle publish status
└── TranscriptViewer.tsx    # View/edit transcript
```

**API Endpoints (Admin):**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/audio?includeUnpublished=true` | List all audio (admin) |
| `PUT` | `/api/audio/:id` | Update audio metadata |
| `PATCH` | `/api/audio/:id/publish` | Toggle publish status |
| `DELETE` | `/api/audio/:id` | Delete audio |

### 4.2 Transcript Section Toggle

**Location:** Audio Detail Page (`/audio/[id]`)

**Behavior:**
- Default: Transcript section is **hidden**
- Toggle button: 「📝 トランスクリプトを表示」/ 「📝 トランスクリプトを隠す」
- Animation: Smooth expand/collapse

**Implementation:**
```tsx
const [showTranscript, setShowTranscript] = useState(false);

<button onClick={() => setShowTranscript(!showTranscript)}>
  {showTranscript ? '📝 トランスクリプトを隠す' : '📝 トランスクリプトを表示'}
</button>

{showTranscript && (
  <ClayCard className="mb-8">
    <p>{audio.transcript}</p>
  </ClayCard>
)}
```

### 4.3 Remove Reorder Quiz Type

**Reason:** Complexity vs user value - focus on MCQ and Fill-in-blank

**Changes:**
| File | Change |
|------|--------|
| `QuizContainer.tsx` | Remove reorder tab |
| `ReorderQuiz.tsx` | Mark as deprecated (keep for future) |
| `groq.service.ts` | Remove reorder prompt |
| `quiz-generator.service.ts` | Remove reorder from batch generation |
| Database | Keep existing reorder quizzes (backward compatible) |

**Quiz Types (Updated):**
```typescript
type QuizType = 'mcq' | 'fill'; // Removed 'reorder'
```

### 4.4 Mobile Responsive Enhancements

**Breakpoints:**
| Breakpoint | Width | Target |
|------------|-------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |

**Mobile Optimizations:**
| Component | Mobile Enhancement |
|-----------|-------------------|
| Navbar | Hamburger menu, sticky header |
| AudioList | Single column grid, larger touch targets |
| AudioPlayer | Full-width, larger controls |
| QuizContainer | Stacked layout, larger buttons |
| Admin Table | Horizontal scroll, card view on mobile |
| Filters | Bottom sheet on mobile |

**CSS Utilities:**
```css
/* Mobile-first responsive classes */
.clay-card-mobile {
  @apply w-full p-4 md:p-6;
}

.quiz-btn-mobile {
  @apply min-h-[48px] text-base md:text-lg;
}

.touch-target {
  @apply min-w-[44px] min-h-[44px];
}
```

### 4.5 Bug Fixes (2026-01-18)

| Issue | Root Cause | Fix |
|-------|------------|-----|
| Quiz submit 400 error | Missing `@IsDefined()` decorator | Added to `SubmitAnswerDto` |
| Audio list empty | `isPublished = false` by default | Auto-publish on upload |
| Frontend SSR fetch error | Wrong API URL for docker network | `NEXT_PUBLIC_API_URL=http://backend:3001` |
| Groq model deprecated | `llama-3.1-70b-versatile` decommissioned | Updated to `llama-3.3-70b-versatile` |
| Whisper binary path | Old path `/app/whisper.cpp/main` | Updated to `/app/whisper.cpp/build/bin/whisper-cli` |

---

## Updated Success Criteria

### MVP (Completed ✅)
- [x] Docker Compose chạy được trên cả Windows và macOS
- [x] Upload audio và tự động tạo transcript
- [x] Generate được quiz từ transcript (MCQ, Fill-in-blank)
- [x] UI LearnJoy với Claymorphism design
- [x] Audio streaming mượt
- [x] Quiz interaction hoạt động đúng
- [x] Response time < 3s

### Phase 4 (Completed ✅)
- [x] Admin dashboard với CRUD audio
- [x] Publish/Unpublish functionality
- [x] Transcript toggle (default hidden)
- [x] Remove reorder quiz type
- [x] Mobile responsive (full optimization)
- [x] E2E tests for new features

---

**Created**: 2026-01-17  
**Last Updated**: 2026-01-18  
**Status**: Phase 4 - Completed ✅
