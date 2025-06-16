# Conversational Authentication System

## Overview

This system implements a conversational authentication flow where users interact with the AI in a natural chat format to login or signup, rather than using traditional forms.

## Architecture

### File Structure
```
src/app/
├── (landing)/
│   ├── chat/page.tsx           # Landing chat with "Se connecter" button
│   └── auth/
│       ├── page.tsx            # Auth page container
│       └── _components/
│           └── auth-chat.tsx   # Conversational auth component
└── protected/
    └── layout.tsx              # Protected layout with auth verification
```

## Flow

### 1. Landing Chat → Auth Chat
- Users start in the main chat (`/chat`)
- Discrete "Se connecter" button in top-right corner
- Clicking redirects to `/auth` for conversational authentication

### 2. Conversational Authentication Steps
1. **Welcome**: AI asks if user wants to connect
2. **Email**: User provides email, system checks if user exists
3. **Password**: Existing user enters password
4. **Signup**: New user creates password with validation
5. **Redirect**: Successful auth redirects to `/protected/chat`

### 3. Protected Pages
- All `/protected/*` pages require authentication
- Non-authenticated users redirect to `/auth`
- Developer bypass available in development mode

## Components

### AuthChat Component
**Location**: `src/app/(landing)/auth/_components/auth-chat.tsx`

**Props**:
```typescript
interface AuthChatProps {
  authStep: 'welcome' | 'email' | 'password' | 'signup';
  setAuthStep: (step) => void;
  authData: { email: string; password: string; isExistingUser: boolean; };
  setAuthData: React.Dispatch<React.SetStateAction<AuthData>>;
  authMessages: AuthMessage[];
  setAuthMessages: React.Dispatch<React.SetStateAction<AuthMessage[]>>;
}
```

**Features**:
- Email validation (regex pattern)
- Password strength validation (8+ chars, letters + numbers)
- User existence checking via Supabase
- Secure password input (masked)
- Error handling with user-friendly messages

### Protected Layout
**Location**: `src/app/protected/layout.tsx`

**Features**:
- Automatic authentication verification
- Developer mode bypass (localStorage: `neiji_dev_mode=true`)
- Redirects to conversational auth instead of traditional login
- User session management

## Database Integration

### Users Table
```sql
CREATE TABLE users_table (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  memory_L0 TEXT DEFAULT '',
  memory_L1 TEXT DEFAULT '',
  memory_L2 TEXT DEFAULT '',
  questionnaire JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Authentication Flow
1. **Signup**: `supabase.auth.signUp()` creates auth user + user profile
2. **Login**: `supabase.auth.signInWithPassword()` validates credentials
3. **Session**: `supabase.auth.getUser()` checks current session

## Developer Features

### Dev Mode Toggle
**Location**: `src/components/dev-mode-toggle.tsx`

- Only visible in development (`NODE_ENV=development`)
- Bottom-left toggle button
- Bypasses authentication for protected pages
- Persisted in localStorage

**Usage**:
1. Click "🛠️ Dev Mode: OFF" to enable
2. Page reloads and auth is bypassed
3. Access protected pages without signup/login

### Testing Authentication
```bash
# Enable dev mode
localStorage.setItem('neiji_dev_mode', 'true')
window.location.reload()

# Disable dev mode  
localStorage.setItem('neiji_dev_mode', 'false')
window.location.reload()
```

## Security Features

### Input Validation
- **Email**: RFC-compliant regex validation
- **Password**: Minimum 8 characters, alphanumeric requirement
- **Sanitization**: Input trimming and XSS prevention

### Authentication Security
- Supabase handles password hashing and session management
- Secure HTTP-only cookies for session tokens
- CSRF protection via Supabase client

### Route Protection
- Server-side authentication verification
- Automatic redirects for unauthorized access
- Developer-only bypasses in development

## Usage Examples

### Basic Auth Flow
```typescript
// User clicks "Se connecter" button
<Link href="/auth">
  <button>Se connecter</button>
</Link>

// Auth conversation
User: "oui"
AI: "Parfait ! Quelle est votre adresse email ?"
User: "user@example.com"
AI: "Je ne vous connais pas encore ! Créons votre compte..."
User: "mypassword123"
AI: "Excellent ! Votre compte a été créé. Bienvenue ! 🌟"
// Redirects to /protected/chat
```

### Developer Bypass
```typescript
// In browser console (development only)
localStorage.setItem('neiji_dev_mode', 'true');
location.reload();

// Now can access /protected/* without auth
```

## Error Handling

### Common Scenarios
1. **Invalid Email**: "Hmm, cet email ne semble pas valide..."
2. **Weak Password**: "Votre mot de passe doit contenir à la fois des lettres et des chiffres..."
3. **Wrong Password**: "Oups ! Ce mot de passe ne correspond pas..."
4. **Network Error**: "Oups ! Il y a eu un petit problème technique..."

### Recovery
- Users can retry any step
- Clear error messages in natural language
- Graceful fallback to previous state

## Customization

### Adding New Auth Steps
1. Add step to `authStep` type
2. Update conversation logic in `handleUserInput`
3. Add appropriate placeholder text
4. Handle new step in UI

### Styling
- Uses Tailwind CSS classes
- Consistent with main app theme (orange accent)
- Responsive design for mobile/desktop

## Best Practices

### Security
- Never log passwords or sensitive data
- Use environment variables for sensitive config
- Regular security audits of auth flow

### UX
- Keep conversation natural and friendly
- Provide clear feedback on each step
- Handle errors gracefully with helpful messages

### Development
- Use dev mode for testing
- Test all auth scenarios (signup, login, errors)
- Verify protected routes work correctly
