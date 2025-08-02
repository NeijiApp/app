# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Package Management
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start Next.js development server with Turbo
- `pnpm run dev:full` - Start both Next.js and assembly service together
- `pnpm run build` - Build the Next.js application
- `pnpm run start` - Start production server
- `pnpm run preview` - Build and start production server

### Code Quality
- `pnpm run check` - Run Biome linter/formatter
- `pnpm run check:write` - Run Biome with auto-fix
- `pnpm run check:unsafe` - Run Biome with unsafe fixes
- `pnpm run typecheck` - Run TypeScript type checking (no emit)

### Database Operations
- `pnpm run db:generate` - Generate Drizzle migrations
- `pnpm run db:migrate` - Run database migrations
- `pnpm run db:push` - Push schema changes to database
- `pnpm run db:pull` - Pull schema from database
- `pnpm run db:studio` - Open Drizzle Studio for database management

### Supabase Local Development
- `pnpm run supabase:local` - Start local Supabase instance
- `pnpm run supabase:local:stop` - Stop local Supabase instance

### Assembly Service (Audio Processing)
- `pnpm run assembly:start` - Start assembly service for audio processing
- `pnpm run assembly:health` - Check assembly service health
- Assembly service must be running for meditation generation to work

## High-Level Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL via Supabase with Drizzle ORM
- **Authentication**: Supabase Auth
- **AI/ML**: OpenAI GPT-4, OpenRouter integration
- **Audio Processing**: FFmpeg via assembly-service
- **Real-time**: tRPC for type-safe API calls
- **UI**: Tailwind CSS, Radix UI components
- **State Management**: TanStack Query for server state

### Project Structure

#### Main Application (`src/`)
- **`app/`** - Next.js App Router structure
  - **`(landing)/`** - Public landing pages (home, auth, contact)
  - **`protected/`** - Authenticated user pages (chat, profile, questionnaire)
  - **`api/`** - API routes for chat, meditation, tRPC
- **`components/ui/`** - Reusable UI components (buttons, dialogs, inputs)
- **`lib/`** - Core business logic
  - **`meditation/`** - AI-powered meditation generation system
  - **`assembly/`** - Audio assembly client for external service
  - **`services/`** - External service integrations
- **`server/`** - Backend logic
  - **`api/`** - tRPC routers and procedures
  - **`db/`** - Database schema and configuration
- **`utils/`** - Utility functions and Supabase client setup

#### Assembly Service (`assembly-service/`)
Separate Node.js/Express microservice for audio processing:
- **`serveur-assemblage.js`** - Main server handling audio segment assembly
- **`lib/ffmpeg-wrapper.js`** - FFmpeg operations wrapper
- **`lib/file-manager.js`** - File operations utilities
- Runs on port 3001, provides REST API for audio assembly

### Key Systems

#### AI-Powered Meditation Generation
The core meditation system (`src/lib/meditation/`) uses a sophisticated AI agent:
- **`ai-agent.ts`** - Main orchestrator with optimization decisions
- **`audio-cache.ts`** - Smart caching system with semantic search
- **`embeddings-service.ts`** - OpenAI embeddings for content similarity
- **`generate-concatenated-meditation.ts`** - High-level generation pipeline
- Implements cost optimization through segment reuse and semantic matching

#### Database Schema
Key tables in `src/server/db/schema.ts`:
- **`usersTable`** - User profiles with memory levels (L0-L2 for personalization)
- **`conversationHistory`** - Chat history between users and AI
- **`meditationHistory`** - Generated meditation sessions
- **`audioSegmentsCache`** - Cached audio segments with embeddings for reuse
- **`meditationAnalytics`** - Usage metrics and analytics

#### Authentication Flow
- Supabase Auth integration with email/password
- Protected routes use middleware for session validation
- User memory system stores personalization data across levels

#### Chat System
- tRPC-based real-time streaming chat
- System prompt configures "Neiji" as a life sparring partner
- Integration with meditation generation pipeline

### Environment Setup
1. **For Local Development**: Run `./restore-dev-files.sh` to restore package files
2. Copy `.env.example` to `.env` and configure:
   - Supabase credentials (DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY)
   - OpenAI API keys for AI generation
   - OpenRouter credentials for alternative AI providers
   - Assembly service settings (ASSEMBLY_SERVICE_URL, ASSEMBLY_API_KEY, ASSEMBLY_TIMEOUT)
3. Start Supabase locally: `pnpm run supabase:local`
4. Push database schema: `pnpm run db:push`
5. Start both services: `pnpm run dev:full` OR start individually:
   - Main app: `pnpm run dev`
   - Assembly service: `pnpm run assembly:start`

### Deployment Setup
- **Vercel**: Deploy main Next.js application (uses root project files when restored)
- **Railway**: Deploy assembly-service only (uses Docker with assembly-service/)
- **Deployment Scripts**:
  - `./prepare-railway-deploy.sh` - Hide root package files for Railway deployment  
  - `./restore-dev-files.sh` - Restore root package files for local development

### Development Workflow
- Use Biome for code formatting and linting (replaces ESLint/Prettier)
- TypeScript strict mode enabled
- Database changes should go through Drizzle migrations
- Audio processing requires assembly-service to be running
- Test meditation generation through `/protected/chat` interface

### Important Notes
- Assembly service must be running for audio generation to work
- User memory system (L0-L2) enables personalized meditation experiences
- AI agent optimizes costs through intelligent segment reuse
- Semantic search in audio cache prevents redundant TTS generation
- All audio processing happens in the separate assembly-service microservice