# 🔧 SOLUTIONS POUR L'ERREUR DE CACHE

## 🚨 PROBLÈME IDENTIFIÉ
```
PostgresError: Tenant or user not found
Code: XX000 (INTERNAL_ERROR)
```

## 🎯 SOLUTIONS PAR PRIORITÉ

### **SOLUTION 1: Reconfigurer le Pooler Supabase**
```bash
# 1. Obtenir nouvelle URL de connexion depuis Supabase Dashboard
# Aller sur: https://supabase.com/dashboard/project/gqofawkftiaasxbhalha/settings/database
# Section: Connection Pooling -> Connection string

# 2. Remplacer dans .env.local:
DATABASE_URL="postgresql://postgres:[NEW_PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

### **SOLUTION 2: Utiliser Connection String Directe**
```bash
# Utiliser la connexion directe (non-pooled)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.gqofawkftiaasxbhalha.supabase.co:5432/postgres"
```

### **SOLUTION 3: Configuration Pooler Alternative**
```typescript
// Dans src/server/db/index.ts
const conn = postgres(env.DATABASE_URL, { 
  prepare: false,
  ssl: "require",
  connection: {
    application_name: "neiji-app",
  },
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30
});
```

### **SOLUTION 4: Désactiver Cache Temporairement**
```typescript
// Dans src/lib/meditation/audio-cache.ts
// Ajouter en haut de chaque fonction:
if (true) { // Force disable cache
  console.log("🚫 Cache temporairement désactivé");
  return null;
}
```

## 🔍 DIAGNOSTIC STEPS

1. **Vérifier Credentials Supabase:**
   - Dashboard → Settings → Database
   - Régénérer password si nécessaire

2. **Tester Connexion:**
   ```bash
   npx drizzle-kit push
   ```

3. **Logs Supabase:**
   - Dashboard → Logs → Database
   - Chercher erreurs de connexion

## ⚡ ACTION IMMÉDIATE
Utiliser la **SOLUTION 4** pour restaurer le service immédiatement.