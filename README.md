# Neiji
 
A meditation application to help everyone access meditation anytime and anywhere power by AI.

## Features

- 🚀 Fast and responsive Next.js application
- 🎨 Modern and beautiful UI design
- 📱 Mobile-friendly responsive layout
- 🔒 Secure authentication system
- 🔄 Real-time data updates
- 🌐 SEO optimized

## Getting Started

### Prerequisites

- Node.js 23.10.0 or later
- pnpm package manager

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:NeijiApp/app.git
   cd app
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run supabase localy:
   ```bash
   pnpm run supabase:local
   ```

4. Set up environment variables:
   ```bash
   # Check the file .env.example for the required environment variables
   cp .env.example .env 
   ```

5. Setup database:
   ```bash
   pnpm run db:push
   ```

6. Run the development server:
   ```bash
   pnpm run dev
   # or
   yarn dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development

The application will automatically update as you edit the source files. You can start editing the page by modifying `pages/index.js`.
