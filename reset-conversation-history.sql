-- Script de réinitialisation complète de l'historique des conversations
-- ATTENTION: Ceci supprime TOUS les messages de conversation !

-- Supprimer complètement la table conversation_history
DROP TABLE IF EXISTS "conversation_history" CASCADE;

-- Recréer la table avec la structure complète
CREATE TABLE "conversation_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" serial NOT NULL,
	"message_role" text NOT NULL,
	"message_content" text NOT NULL,
	"audio_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Créer les index
CREATE INDEX IF NOT EXISTS "idx_conversation_history_user_id" ON "conversation_history" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_conversation_history_created_at" ON "conversation_history" USING btree ("created_at");

-- Créer la contrainte de clé étrangère
DO $$ BEGIN
 ALTER TABLE "conversation_history" ADD CONSTRAINT "conversation_history_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "users_table"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Vérifier que la table est créée
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'conversation_history' 
ORDER BY ordinal_position;

-- Afficher le nombre de lignes (devrait être 0)
SELECT COUNT(*) as total_messages FROM conversation_history;
