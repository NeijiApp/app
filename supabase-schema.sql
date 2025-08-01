-- Neiji App - Complete Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Users table
CREATE TABLE users_table (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    questionnaire JSONB DEFAULT '{}',
    memory_L0 TEXT, -- Level 0 memory - basic personality
    memory_L1 TEXT, -- Level 1 memory - preferences and habits
    memory_L2 TEXT  -- Level 2 memory - extended context and history
);

-- Meditation history
CREATE TABLE meditation_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users_table(id),
    prompt TEXT NOT NULL,
    duration INTEGER NOT NULL,
    voice_gender VARCHAR(10) NOT NULL,
    guidance_level VARCHAR(20) NOT NULL,
    background_sound VARCHAR(20) NOT NULL,
    goal VARCHAR(20) NOT NULL,
    audio_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Meditation favorites
CREATE TABLE meditation_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users_table(id),
    meditation_id INTEGER REFERENCES meditation_history(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, meditation_id)
);

-- Meditation analytics
CREATE TABLE meditation_analytics (
    id SERIAL PRIMARY KEY,
    meditation_id INTEGER REFERENCES meditation_history(id),
    play_count INTEGER DEFAULT 0,
    total_play_time INTEGER DEFAULT 0, -- in seconds
    last_played_at TIMESTAMP
);

-- Conversation history
CREATE TABLE conversation_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users_table(id),
    message_content TEXT NOT NULL,
    message_role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
    audio_url TEXT, -- for meditations (nullable)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audio segments cache (THIS IS CAUSING YOUR CURRENT ERRORS)
CREATE TABLE audio_segments_cache (
    id SERIAL PRIMARY KEY,
    text_content TEXT NOT NULL,
    text_hash VARCHAR(64) NOT NULL,
    voice_id VARCHAR(50) NOT NULL,
    voice_gender VARCHAR(10) NOT NULL,
    voice_style VARCHAR(20) NOT NULL,
    audio_url TEXT NOT NULL,
    audio_duration INTEGER,
    file_size INTEGER,
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW(),
    embedding TEXT, -- OpenAI embedding (stored as JSON string)
    language VARCHAR(10) DEFAULT 'en-US', -- ISO language code
    similarity_threshold REAL DEFAULT 0.92, -- Similarity threshold
    UNIQUE(text_hash, voice_id, voice_style)
);

-- Create indexes for better performance
CREATE INDEX idx_meditation_history_user_id ON meditation_history(user_id);
CREATE INDEX idx_meditation_favorites_user_id ON meditation_favorites(user_id);
CREATE INDEX idx_meditation_analytics_meditation_id ON meditation_analytics(meditation_id);
CREATE INDEX idx_conversation_history_user_id ON conversation_history(user_id);
CREATE INDEX idx_conversation_history_created_at ON conversation_history(created_at);
CREATE INDEX idx_audio_segments_cache_language ON audio_segments_cache(language);
CREATE INDEX idx_audio_segments_cache_last_used ON audio_segments_cache(last_used_at);
CREATE INDEX idx_audio_segments_cache_text_hash ON audio_segments_cache(text_hash);
CREATE INDEX idx_audio_segments_cache_usage_count ON audio_segments_cache(usage_count);
CREATE INDEX idx_audio_segments_cache_voice_id ON audio_segments_cache(voice_id);

-- Enable Row Level Security (RLS) for better security
ALTER TABLE users_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_segments_cache ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you can customize these later)
CREATE POLICY "Users can view own data" ON users_table FOR ALL USING (auth.uid()::text = email);
CREATE POLICY "Users can view own meditations" ON meditation_history FOR ALL USING (user_id IN (SELECT id FROM users_table WHERE email = auth.uid()::text));
CREATE POLICY "Users can view own favorites" ON meditation_favorites FOR ALL USING (user_id IN (SELECT id FROM users_table WHERE email = auth.uid()::text));
CREATE POLICY "Users can view own analytics" ON meditation_analytics FOR ALL USING (meditation_id IN (SELECT id FROM meditation_history WHERE user_id IN (SELECT id FROM users_table WHERE email = auth.uid()::text)));
CREATE POLICY "Users can view own conversations" ON conversation_history FOR ALL USING (user_id IN (SELECT id FROM users_table WHERE email = auth.uid()::text));
CREATE POLICY "Allow all access to audio cache" ON audio_segments_cache FOR ALL USING (true);
