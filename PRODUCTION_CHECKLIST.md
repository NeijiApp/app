# 🚀 Neiji Production Deployment Checklist

## ✅ Day 1: Cleanup (COMPLETED)
- [x] Remove test files and audio samples
- [x] Organize documentation
- [x] Archive debug scripts

## 🔐 Day 2: Security & Environment
### Critical Security Tasks:
- [ ] Update middleware.ts with proper auth checks
- [ ] Add rate limiting to API routes
- [ ] Validate all environment variables
- [ ] Add CORS configuration
- [ ] Implement API key rotation strategy

### Environment Setup:
```bash
# Required Environment Variables (verify all are set)
DATABASE_URL=            # Supabase connection string
DIRECT_URL=             # Direct connection (for migrations)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # Keep secret!
ELEVENLABS_API_KEY=           # TTS service
OPENAI_API_KEY=              # Embeddings & fallback TTS
SECOND_ME_API_KEY=           # LLM for meditation
ASSEMBLY_SERVICE_URL=        # Audio assembly service
```

## 🏗️ Day 3: Architecture Improvements
### Modular Structure for React Native:
- [ ] Create `/src/lib/core/` for shared business logic
- [ ] Move meditation logic to platform-agnostic modules
- [ ] Separate API routes from UI components
- [ ] Create typed interfaces for all services

### File Structure:
```
src/
├── lib/
│   ├── core/           # Shared between web & mobile
│   │   ├── meditation/ # Core meditation logic
│   │   ├── auth/      # Auth utilities
│   │   └── types/     # Shared TypeScript types
│   ├── web/           # Next.js specific
│   └── mobile/        # Future React Native
├── app/               # Next.js app router
└── server/           # Backend services
```

## 💰 Day 4: Cost Optimization
### Meditation Pipeline Optimization:
- [ ] Implement semantic caching (85% similarity threshold)
- [ ] Add usage tracking and quotas
- [ ] Create fallback chain: Cache → OpenAI → ElevenLabs
- [ ] Implement request batching

### Cache Strategy:
```typescript
// Priority order for audio generation:
1. Exact match cache (instant, free)
2. Semantic similarity >85% (instant, free)
3. OpenAI TTS (fast, $0.015/1K chars)
4. ElevenLabs (best quality, $0.18/1K chars)
```

## 🧪 Day 5: Testing & Monitoring
### Essential Tests:
- [ ] Auth flow (login/logout/refresh)
- [ ] Meditation generation pipeline
- [ ] Rate limiting
- [ ] Error handling
- [ ] Database connections

### Monitoring Setup:
- [ ] Add error tracking (Sentry/LogRocket)
- [ ] Set up performance monitoring
- [ ] Create health check endpoints
- [ ] Add usage analytics

## 🚢 Day 6-7: Deployment
### Pre-deployment:
- [ ] Review all console.logs (remove sensitive data)
- [ ] Check for hardcoded secrets
- [ ] Test build locally: `npm run build`
- [ ] Run type checking: `npm run type-check`
- [ ] Test in production mode: `npm run start`

### Deployment Platforms:
- **Vercel** (recommended for Next.js)
  - [ ] Connect GitHub repo
  - [ ] Add environment variables
  - [ ] Configure custom domain
  - [ ] Enable preview deployments

- **Railway** (for assembly service)
  - [ ] Deploy assembly-service
  - [ ] Update ASSEMBLY_SERVICE_URL
  - [ ] Configure health checks

### Post-deployment:
- [ ] Test all critical paths
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify costs are within budget

## 🎯 Success Metrics
- [ ] Page load < 3 seconds
- [ ] Meditation generation < 10 seconds
- [ ] Zero critical security vulnerabilities
- [ ] Cost per meditation < $0.05
- [ ] 99.9% uptime

## 🔥 Quick Wins for Today:
1. Set up environment variables properly
2. Test meditation generation end-to-end
3. Deploy to Vercel (free tier)
4. Add basic monitoring

## 📱 React Native Preparation:
- Keep all business logic in `/src/lib/core/`
- Use TypeScript interfaces for all data
- Avoid Next.js specific features in core logic
- Document API endpoints for mobile consumption

---

**Remember**: Ship working code first, optimize later. Your app already works - now make it production-ready!
