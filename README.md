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
```

## API Endpoints

### Audio
- `GET /api/audio` - List audio files
- `GET /api/audio/:id` - Get audio details
- `POST /api/audio` - Create audio entry
- `PUT /api/audio/:id` - Update audio
- `DELETE /api/audio/:id` - Delete audio

### Quiz
- `GET /api/audio/:id/quiz` - Get quizzes for audio
- `POST /api/quiz` - Create quiz
- `POST /api/quiz/:id/submit` - Submit answer

## License

MIT License

---

**LearnJoy** - 日本語学習を楽しく。
