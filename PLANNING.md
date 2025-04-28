# Neiji - Project Planning

## Project Overview
This project is a AI meditation web application for everyone to generate personalized meditations.

## Architecture
- **Frontend**: React with Next.js
- **Backend**: Next.js with TRPC
- **Database**: Drizzle ORM (Supabase PostgreSQL)
- **AI**: OpenAI
- **Authentication**: Supabase

## Components
1. **Next.js**
   - The main application
   - Deliver the frontend
   - Expose trpc endpoints

2. **Supabase**
   - Handles authentication with Supabase
   - Store the data in PostgreSQL

3. **Drizzle ORM**
   - Handles database schema and operations
   - Handles database migrations
   - Handles database queries

4. **OpenAI**
   - Handles AI operations
   - Handles AI queries

## Environment Configuration
- `OPENAI_API_KEY`: OpenAI API key
- `NEXT_PUBLIC_SUPABASE_URL`: URL of the Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key for Supabase authentication
- `DATABASE_URL`: URL of the database

## File Structure
```
app/
├── src/
│   ├── app/               # Next.js file based routing
│   ├── components/        
│   │   └── ui/            # Shadcn UI components
│   └── server/
│       ├── api/           # TRPC API endpoints
│       └── db/            # Drizzle client and schemas
├── package.json           # JavaScript dependencies
├── .env.example           # Example environment variables
├── README.md              # Project documentation
├── PLANNING.md            # Project planning (this file)
└── TASK.md                # Task tracking
```

## Style Guidelines
- Follow Biome linting standards
- Use TypeScript for all functions
- Document functions with JSDoc comments
- Format code with Biome trough `pnpm run check:write`

## Dependencies
- openai
- supabase
- vercel
