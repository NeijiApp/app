# 🧘 Neiji Meditation Mode - Complete Guide

## Overview
The meditation mode in Neiji provides personalized, AI-generated meditation sessions with high-quality voice synthesis. Users can customize their meditation experience with various parameters and enjoy a beautiful, intuitive interface.

## 🚀 Quick Start

### 1. Access Meditation Mode
- Navigate to `/chat`
- Click the brain icon (🧠) in the chat input area
- The interface will switch to meditation mode with an orange theme

### 2. Generate a Meditation
**Option A: Use the Meditation Panel**
- Customize your meditation with:
  - Duration (2-10 minutes)
  - Voice gender
  - Guidance level
  - Background sounds
  - Meditation goal
- Click "Generate Meditation"

**Option B: Type a Custom Request**
- Simply describe what you need
- Example: "I need a 5-minute meditation for anxiety relief"

## 🎛️ Customization Options

### Duration
- 2, 3, 5, 7, or 10 minutes
- Affects the depth and pacing of the meditation

### Voice Options
- **Female Voice**: Calm and soothing (ID: g6xIsTj2HwM6VR4iXFCw)
- **Male Voice**: Deep and relaxing (ID: GUDYcgRAONiI1nXDcNQQ)

### Guidance Levels
- **Beginner**: Detailed instructions, short pauses (3-5 seconds)
- **Confirmed**: Balanced guidance, medium pauses (5-8 seconds)
- **Expert**: Minimal guidance, long pauses (10-20 seconds)

### Background Sounds
- Silence
- Ocean Waves
- Rain
- Focus sounds
- Relaxation sounds

### Meditation Goals
- **Morning Energy**: Energizing start to your day
- **Focus & Clarity**: Improve concentration
- **Calm & Peace**: Stress relief and relaxation
- **Sleep & Rest**: Prepare for restful sleep

## 🎵 Audio Player Features
- Play/Pause with large central button
- Seek bar for navigation
- Volume control with mute option
- Skip forward/backward (10 seconds)
- Restart meditation
- Download as MP3 file

## 🔧 Technical Setup

### Required Environment Variables
```bash
# ElevenLabs for voice synthesis
ELEVENLABS_API_KEY="your_api_key_here"

# OpenRouter for AI text generation
OPENROUTER_API_KEY="your_api_key_here"
```

### API Configuration
- **Text Generation**: OpenRouter API with Qwen model
- **Voice Synthesis**: ElevenLabs API with multilingual v2 model
- **Audio Format**: MP3 at 44.1kHz, 128kbps

## 🗄️ Database (Optional)

Currently, meditations are generated on-demand without database storage. To add persistence, run the migration:

```bash
bun supabase migration up
```

This creates tables for:
- `meditation_history`: Store generated meditations
- `meditation_favorites`: User's favorite meditations
- `meditation_analytics`: Usage statistics

## 🐛 Troubleshooting

### Meditation not generating?
1. Check API keys in `.env.local`
2. Verify internet connection
3. Check browser console for errors
4. Ensure you're in meditation mode (brain icon should be orange)

### Audio not playing?
1. Check browser audio permissions
2. Ensure volume is not muted
3. Try downloading the file instead
4. Check if audio blob URL is valid

### Slow generation?
- Normal generation time: 30-60 seconds
- Longer meditations take more time
- API rate limits may apply

## 📈 Future Enhancements

### Planned Features
- [ ] Save meditation history
- [ ] Create meditation playlists
- [ ] Share meditations
- [ ] Offline mode with cached meditations
- [ ] Background sound mixing
- [ ] Multiple language support
- [ ] Voice customization (pitch, speed)
- [ ] Binaural beats integration

### API Improvements
- [ ] Streaming audio generation
- [ ] Progress indicators
- [ ] Cancellation support
- [ ] Retry logic for failed requests

## 🎨 UI/UX Details

### Color Scheme
- Primary: Orange gradient (#f97316 to #fed7aa)
- Meditation mode indicator: Orange badge
- Audio player: Orange-themed controls

### Responsive Design
- Mobile-optimized meditation panel
- Touch-friendly audio controls
- Adaptive layout for all screen sizes

## 📝 Example Prompts

### Stress Relief
"Create a calming meditation to help me release work stress and tension"

### Better Sleep
"I need a gentle meditation to help me fall asleep peacefully"

### Morning Routine
"Generate an energizing morning meditation to start my day with clarity"

### Focus Session
"Help me with a concentration meditation for deep work"

## 🔐 Security Notes
- API keys are server-side only
- Audio files are generated per-session
- No personal data is stored by default
- Blob URLs expire with the session

## 📞 Support
For issues or questions:
1. Check this guide first
2. Review browser console logs
3. Contact support with error details 