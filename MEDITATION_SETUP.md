# Meditation AI Integration Setup

## Required Environment Variables

To enable the meditation generation feature, add the following environment variables to your `.env.local` file:

```bash
# ElevenLabs API Key for text-to-speech generation
ELEVENLABS_API_KEY="sk_..."

# OpenRouter API Key for AI text generation
OPENROUTER_API_KEY="sk-..."
```


## Features

The meditation integration adds:
- **Meditation Mode Toggle**: Switch between regular chat and meditation generation
- **Personalized Meditation Generation**: Generate custom meditations based on user prompts
- **Audio Playback**: Play generated meditation audio directly in the chat
- **Download Option**: Download meditation files for offline use

## Usage

1. Click the brain icon (🧠) in the chat input to switch to meditation mode
2. Describe what kind of meditation you need (e.g., "I need help with anxiety and stress")
3. The system will generate a personalized meditation audio file
4. Play the meditation directly in the chat or download it for later use 