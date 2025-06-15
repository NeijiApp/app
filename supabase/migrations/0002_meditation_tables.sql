-- Migration for meditation features
CREATE TABLE IF NOT EXISTS meditation_history (
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

CREATE TABLE IF NOT EXISTS meditation_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users_table(id),
  meditation_id INTEGER REFERENCES meditation_history(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, meditation_id)
);

CREATE TABLE IF NOT EXISTS meditation_analytics (
  id SERIAL PRIMARY KEY,
  meditation_id INTEGER REFERENCES meditation_history(id),
  play_count INTEGER DEFAULT 0,
  total_play_time INTEGER DEFAULT 0, -- in seconds
  last_played_at TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_meditation_history_user_id ON meditation_history(user_id);
CREATE INDEX idx_meditation_favorites_user_id ON meditation_favorites(user_id);
CREATE INDEX idx_meditation_analytics_meditation_id ON meditation_analytics(meditation_id); 