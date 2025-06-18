-- Script de test pour vérifier la structure de la base de données

-- Vérifier que la table users_table existe
SELECT COUNT(*) as users_table_exists 
FROM information_schema.tables 
WHERE table_name = 'users_table';

-- Vérifier que la table conversation_history existe
SELECT COUNT(*) as conversation_history_exists 
FROM information_schema.tables 
WHERE table_name = 'conversation_history';

-- Vérifier la structure de conversation_history
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'conversation_history' 
ORDER BY ordinal_position;

-- Vérifier les index
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'conversation_history';

-- Vérifier les contraintes de clé étrangère
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'conversation_history';
