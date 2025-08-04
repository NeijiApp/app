#!/bin/bash

# Script de diagnostic et fix Supabase pooler
echo "🔍 DIAGNOSTIC SUPABASE POOLER"
echo "================================"

# 1. Test connexion pooler
echo "📡 Test connexion pooler..."
nc -z aws-0-us-west-1.pooler.supabase.com 6543
if [ $? -eq 0 ]; then
    echo "✅ Pooler accessible"
else
    echo "❌ Pooler inaccessible"
    exit 1
fi

# 2. Test authentification (avec timeout)
echo "🔐 Test authentification pooler..."
timeout 10s psql "postgresql://postgres:11mnJnUK2BILSscu@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require" -c "SELECT version();" 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Authentification réussie"
else
    echo "❌ Authentification échouée - XX000 error"
    echo "🔧 Solutions possibles:"
    echo "   1. Régénérer password Supabase Dashboard"
    echo "   2. Utiliser connexion directe (port 5432)"
    echo "   3. Vérifier tenant ID/project ID"
fi

# 3. Test connexion directe en fallback
echo "🔄 Test connexion directe..."
timeout 10s psql "postgresql://postgres:11mnJnUK2BILSscu@db.gqofawkftiaasxbhalha.supabase.co:5432/postgres?sslmode=require" -c "SELECT version();" 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Connexion directe fonctionne - utilisez celle-ci en fallback"
    echo "DATABASE_URL=\"postgresql://postgres:11mnJnUK2BILSscu@db.gqofawkftiaasxbhalha.supabase.co:5432/postgres\""
else
    echo "❌ Connexion directe aussi en échec"
fi

echo ""
echo "🎯 ACTIONS RECOMMANDÉES:"
echo "1. Dashboard Supabase → Settings → Database → Reset Connection"
echo "2. Copier nouvelle connection string" 
echo "3. Mettre à jour .env.local"
echo "4. Redémarrer application"