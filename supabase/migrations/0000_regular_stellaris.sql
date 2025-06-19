
CREATE TABLE "users_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"questionnaire" jsonb DEFAULT '{}'::jsonb,
	"memory_L0" text,
    "memory_L1" text,
    "memory_L2" text,
	CONSTRAINT "users_table_email_unique" UNIQUE("email")
);

-- Tables de méditation
CREATE TABLE "meditation_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"prompt" text NOT NULL,
	"duration" integer NOT NULL,
	"voice_gender" varchar(10) NOT NULL,
	"guidance_level" varchar(20) NOT NULL,
	"background_sound" varchar(20) NOT NULL,
	"goal" varchar(20) NOT NULL,
	"audio_url" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "meditation_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"meditation_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "meditation_favorites_user_id_meditation_id_unique" UNIQUE("user_id","meditation_id")
);

CREATE TABLE "meditation_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"meditation_id" integer,
	"play_count" integer DEFAULT 0,
	"total_play_time" integer DEFAULT 0,
	"last_played_at" timestamp
);

-- Table pour l'historique des conversations
CREATE TABLE "conversation_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"message_content" text NOT NULL,
	"message_role" varchar(20) NOT NULL,
	"audio_url" text,
	"created_at" timestamp DEFAULT now()
);

-- Table de cache pour les segments audio (phrases individuelles)
CREATE TABLE "audio_segments_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"text_content" text NOT NULL,
	"text_hash" varchar(64) NOT NULL,
	"voice_id" varchar(50) NOT NULL,
	"voice_gender" varchar(10) NOT NULL,
	"voice_style" varchar(20) NOT NULL,
	"audio_url" text NOT NULL,
	"audio_duration" integer,
	"file_size" integer,
	"usage_count" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"last_used_at" timestamp DEFAULT now(),
	CONSTRAINT "audio_segments_cache_unique_segment" UNIQUE("text_hash", "voice_id", "voice_style")
);

-- Contraintes de clé étrangère
ALTER TABLE "meditation_history" ADD CONSTRAINT "meditation_history_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "meditation_favorites" ADD CONSTRAINT "meditation_favorites_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "meditation_favorites" ADD CONSTRAINT "meditation_favorites_meditation_id_meditation_history_id_fk" FOREIGN KEY ("meditation_id") REFERENCES "public"."meditation_history"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "meditation_analytics" ADD CONSTRAINT "meditation_analytics_meditation_id_meditation_history_id_fk" FOREIGN KEY ("meditation_id") REFERENCES "public"."meditation_history"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "conversation_history" ADD CONSTRAINT "conversation_history_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE cascade ON UPDATE no action;

-- Index pour les performances
CREATE INDEX "idx_meditation_history_user_id" ON "meditation_history" USING btree ("user_id");
CREATE INDEX "idx_meditation_favorites_user_id" ON "meditation_favorites" USING btree ("user_id");
CREATE INDEX "idx_meditation_analytics_meditation_id" ON "meditation_analytics" USING btree ("meditation_id");
CREATE INDEX "idx_conversation_history_user_id" ON "conversation_history" USING btree ("user_id");
CREATE INDEX "idx_conversation_history_created_at" ON "conversation_history" USING btree ("created_at");
CREATE INDEX "idx_audio_segments_cache_text_hash" ON "audio_segments_cache" USING btree ("text_hash");
CREATE INDEX "idx_audio_segments_cache_voice_id" ON "audio_segments_cache" USING btree ("voice_id");
CREATE INDEX "idx_audio_segments_cache_usage_count" ON "audio_segments_cache" USING btree ("usage_count" DESC);
CREATE INDEX "idx_audio_segments_cache_last_used" ON "audio_segments_cache" USING btree ("last_used_at" DESC);

