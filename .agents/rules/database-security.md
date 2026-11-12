# RÈGLES DE BASE DE DONNÉES ET SÉCURITÉ - STOCKPILOT

Ce document régit l'architecture des données PostgreSQL / Supabase et les normes de sécurité strictes du projet.

---

## 1. Multi-Tenant et Isolation par Entreprise
* **Colonne `company_id` obligatoire :** Toutes les tables métier (produits, clients, stocks, factures, transactions, logs) doivent posséder une clé étrangère `company_id` vers la table `companies`.
* **Étanchéité totale :** Aucune requête ou lecture ne doit permettre à un utilisateur d'accéder aux données d'une entreprise tierce.
* **Résolution sécurisée :** Dériver toujours `company_id` à partir de la session authentifiée (`auth.uid()`) côté serveur ou via des fonctions Postgres sécurisées. Ne jamais faire confiance à un `company_id` injecté directement par le client.

---

## 2. Row-Level Security (RLS) & Politiques
* **RLS systématiquement activé :**
  ```sql
  ALTER TABLE nom_de_table ENABLE ROW LEVEL SECURITY;
  ```
  Obligatoire sur toutes les tables contenant des données privées.
* **Politiques explicites :** Définir des politiques strictes et distinctes pour `SELECT`, `INSERT`, `UPDATE`, et `DELETE`.
* **Principe du moindre privilège :** Interdire l'accès par défaut si l'utilisateur n'a pas les droits nécessaires dans son entreprise (contrôle des rôles : administrateur, gestionnaire, caissier, etc.).

---

## 3. Gestion des Clés, Secrets et Permissions
* **Clé `SUPABASE_SERVICE_ROLE_KEY` :** Réservée exclusivement aux environnements serveur sécurisés (API Routes Next.js, Edge Functions Supabase).
  > [!CAUTION]
  > Ne **JAMAIS** préfixer cette clé par `NEXT_PUBLIC_` et ne jamais la laisser fuiter dans le bundle client.
* **Clé Publique (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) :** Utilisée côté client uniquement pour les opérations protégées par RLS et Supabase Auth.
* **Vérification côté serveur :** Vérifier les permissions côté serveur et protéger toutes les routes sensibles. Ne jamais faire confiance aux données envoyées uniquement par le navigateur.
* **Validation des entrées :** Valider et assainir toutes les données côté serveur (ex: Zod) avant tout traitement ou écriture en base.

---

## 4. Migrations, Intégrité et Environnements
* **Migrations versionnées :** Chaque modification de schéma doit être consignée dans une migration SQL versionnée et reproductible.
* **Indexation stratégique :** Indexer systématiquement les colonnes clés : `company_id`, clés étrangères, statuts, dates de transaction, champs de recherche fréquentielle.
* **Interdiction de test en production :** Ne jamais modifier directement la base de production pour faire des tests.
* **Protection des données sensibles :** Ne jamais supprimer de données importantes sans autorisation explicite. Préférer le soft-delete (`deleted_at`) pour les données critiques.
* **Journalisation d'audit :** Enregistrer toutes les actions sensibles dans une table d'audit dédiée (`audit_logs`).
