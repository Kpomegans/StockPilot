# FEUILLE DE ROUTE ET MÉTHODE DE TRAVAIL - STOCKPILOT

Ce document régit le comportement de l'assistant IA et le séquençage obligatoire du développement de StockPilot.

---

## 1. Protocole de Conduite de l'Agent
* **Analyser avant de coder :** Lire et comprendre l'architecture et les composants existants avant toute modification.
* **Non-régression :** Ne jamais altérer une fonctionnalité existante sans validation préalable.
* **Aucun fichier supprimé sans confirmation :** Les opérations de suppression de code ou de schémas nécessitent l'autorisation explicite de l'utilisateur.
* **Pas de maquettes trompeuses :** Tous les formulaires, boutons et filtres doivent être réellement câblés à Supabase. Ne jamais remplacer du code opérationnel par du code fictif.
* **Tests et validation continue :** Chaque étape doit être vérifiée (responsive, formulaires, sécurité RLS, gestion d'erreurs) avant de considérer la tâche comme achevée.

---

## 2. Ordre Strict des 16 Phases de Développement

Le projet doit impérativement être développé dans cet ordre chronologique :

1. **Architecture générale** (Setup Next.js App Router, TypeScript strict, Tailwind, shadcn/ui, structure de dossiers).
2. **Base de données** (Schéma PostgreSQL, migrations Supabase, types TypeScript générés, RLS).
3. **Authentification** (Supabase Auth, gestion des sessions, redirection protégée).
4. **Multi-entreprises et rôles** (Table `companies`, rattachement utilisateur, isolation `company_id`, gestion RBAC).
5. **Gestion des produits** (Catalogue, catégories, codes-barres, unités de mesure).
6. **Prix des produits** (Prix d'achat, prix de vente HT/TTC, marge, historisation tarifaire).
7. **Stocks et magasins** (Entrepôts/magasins, mouvements atomiques de stock, alertes de réapprovisionnement).
8. **Clients et fournisseurs** (Répertoire, soldes de compte, conditions de règlement).
9. **Achats et ventes** (Prise de commande, encaissement, acomptes, validation transactionnelle).
10. **Facturation PDF** (Génération de factures conformes, avoirs, téléchargement et impression).
11. **Abonnements SaaS** (Formules Découverte/Pro/Business/Enterprise, 30 jours d'essai gratuit).
12. **PayGate** (Intégration Flooz et T-Money, sécurisation des webhooks côté serveur).
13. **Statistiques et Tableaux de bord** (Graphiques Recharts, chiffre d'affaires, marges réelles, rotation de stock).
14. **Administration SaaS** (Super-admin plateforme, gestion globale des entreprises et abonnements).
15. **Intelligence Artificielle** (Prévisions de réapprovisionnement, détection des tendances de vente, suggestions intelligentes).
16. **Module pharmacie** (Spécificités : péremptions, numéros de lots, ordonnances, conformité sectorielle).

> [!IMPORTANT]
> **Règle d'or :** Une phase ne doit pas être entamée tant que la phase précédente n'a pas été pleinement développée, testée et formellement validée.
