# LearnJoy - Japanese Listening Platform

🎧 **LearnJoy** is a web-based Japanese listening practice platform for JLPT N2/N3 level learners.

## Features

- 🎵 **Audio Streaming** - High-quality Japanese audio lessons
- 🤖 **AI Transcription** - Automatic transcription using Whisper
- 📝 **Interactive Quizzes** - MCQ, Fill-in-blank, and Reorder exercises
- 🎨 **Modern UI** - Claymorphism design with LearnJoy theme
- 🐳 **Docker-based** - Easy setup on Windows & macOS

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, React 18, TailwindCSS |
| Backend | NestJS 10, Prisma |
| Database | PostgreSQL 15 |
| Storage | Cloudflare R2 |
| AI/ML | Whisper.cpp, Groq API (Llama 3.1) |
| Container | Docker Compose |
| Package Manager | Yarn (faster, better caching) |

## Quick Start

### Prerequisites

- Docker Desktop 4.x
- For Windows: WSL2 enabled
- 16GB RAM recommended

### Setup

**Windows (WSL2):**
```bash
# Clone the repository
git clone <repo-url>
cd learnjoy

# Run setup script in WSL2
bash setup-windows.sh

# Edit environment variables
nano .env  # Add your GROQ_API_KEY

# Start services
docker-compose up -d
```

**macOS:**
```bash
# Clone the repository
git clone <repo-url>
cd learnjoy

# Run setup script
bash setup-macos.sh

# Edit environment variables
nano .env  # Add your GROQ_API_KEY

# Start services
docker-compose up -d
```

### Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Database**: localhost:5432

## Project Structure

```
learnjoy/
├── docker-compose.yml       # Main Docker orchestration
├── docker-compose.override.yml  # Dev overrides
├── env.example              # Environment template
├── setup-windows.sh         # Windows setup script
├── setup-macos.sh           # macOS setup script
│
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── audio/          # Audio management
│   │   ├── quiz/           # Quiz generation
│   │   ├── transcript/     # Whisper integration
│   │   ├── ai/             # Groq LLM service
│   │   └── storage/        # R2 storage
│   └── prisma/             # Database schema
│
├── frontend/               # Next.js Frontend
│   └── src/
│       ├── app/            # App router pages
│       ├── components/     # UI components
│       └── styles/         # Claymorphism CSS
│
└── whisper/                # Whisper.cpp container
    ├── Dockerfile          # CPU version
    └── Dockerfile.apple-silicon  # Apple Silicon
```

## Environment Variables

Copy `env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `DB_PASSWORD` | PostgreSQL password |
| `GROQ_API_KEY` | Groq API key for quiz generation |
| `R2_*` | Cloudflare R2 credentials |
| `WHISPER_MODEL` | Whisper model (tiny/small/medium/large) |

## Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f whisper

# Stop services
docker-compose down

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Run database migrations
docker-compose exec backend yarn prisma migrate dev

# Open Prisma Studio
docker-compose exec backend yarn prisma studio

# Seed database
docker-compose exec backend yarn prisma:seed

# === Local Development (without Docker) ===

# Install dependencies
cd backend && yarn install
cd frontend && yarn install

# Generate Prisma client
cd backend && yarn prisma generate

# === E2E Testing ===

cd frontend

# Install Playwright browsers (first time)
npx playwright install

# Run E2E tests
yarn test:e2e

# Run tests with UI
yarn test:e2e:ui

# View test report
yarn test:e2e:report
```

## Production Deployment

```bash
# Build and run production containers
docker-compose -f docker-compose.prod.yml up -d

# With nginx reverse proxy
docker-compose -f docker-compose.prod.yml --profile with-nginx up -d
```

## Performance Optimizations

- ✅ HTTP Range Requests for audio streaming
- ✅ Gzip/Deflate compression for API responses
- ✅ In-memory caching for frequent queries
- ✅ Helmet security headers
- ✅ Static asset caching (1 year)
- ✅ Next.js optimizations (image optimization, CSS minification)
- ✅ Loading skeletons for better UX

## API Endpoints

### Audio
- `GET /api/audio` - List audio files
- `GET /api/audio/:id` - Get audio details
- `GET /api/audio/:id/stream` - Stream audio with Range support
- `POST /api/audio/upload` - Upload audio file
- `PUT /api/audio/:id` - Update audio
- `DELETE /api/audio/:id` - Delete audio

### Quiz
- `GET /api/audio/:id/quiz` - Get quizzes for audio
- `POST /api/quiz/generate` - Generate single quiz
- `POST /api/quiz/generate-batch` - Generate multiple quizzes
- `POST /api/quiz/:id/submit` - Submit answer

### Health
- `GET /api/health` - Full health check
- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe

## Troubleshooting

### 🔧 Common Issues & Solutions

#### 1. Database Authentication Failed (P1000)
```
PrismaClientInitializationError: Authentication failed against database server
```
**Nguyên nhân:** Password trong `.env` khác với password đã dùng khi tạo database volume.

**Giải pháp:**
```bash
# Reset database với password mới
docker compose down -v
docker compose up -d
```

#### 2. Table does not exist
```
The table `public.audio` does not exist in the current database
```
**Nguyên nhân:** Database mới tạo nhưng chưa có tables.

**Giải pháp:**
```bash
docker exec learnjoy-backend npx prisma db push
```

#### 3. Prisma Engine Error trên Alpine Linux
```
PrismaClientInitializationError: Unable to require(`/app/node_modules/.prisma/client/libquery_engine-linux-musl.so.node`)
```
**Nguyên nhân:** Thiếu binary target cho Alpine Linux.

**Giải pháp:** Đảm bảo `prisma/schema.prisma` có:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```
Sau đó rebuild:
```bash
docker exec learnjoy-backend npx prisma generate
docker compose restart backend
```

#### 4. R2 Upload SSL Handshake Error
```
write EPROTO...sslv3 alert handshake failure
```
**Nguyên nhân:** R2 credentials trong `.env` là placeholder values.

**Giải pháp:** 
- Cập nhật R2 credentials thật từ Cloudflare Dashboard
- Hoặc để trống để dùng local storage fallback

#### 5. 502 Bad Gateway qua Ngrok
**Nguyên nhân:** Backend crash hoặc không running.

**Giải pháp:**
```bash
# Check backend status
docker logs learnjoy-backend --tail 50

# Restart nếu cần
docker compose restart backend
```

### 📦 Reset Everything
Nếu gặp nhiều lỗi, reset toàn bộ:
```bash
cd learnjoy
docker compose down -v --remove-orphans
docker compose up -d
sleep 20
docker exec learnjoy-backend npx prisma db push
```

## Public Access với Ngrok

Xem hướng dẫn chi tiết tại [ngrok-tools/README.md](ngrok-tools/README.md)

```bash
# Windows
cd ngrok-tools
start-learnjoy.bat

# macOS
cd ngrok-tools
./ngrok-manager-mac.sh
```

## License

MIT License

---

**LearnJoy** - 日本語学習を楽しく。
