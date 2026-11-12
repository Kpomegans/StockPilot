# RÈGLES PERMANENTES DU PROJET STOCKPILOT

## 1. IDENTITÉ DU PROJET
Le projet s'appelle StockPilot.  
C'est un SaaS professionnel de gestion de stock, ventes, achats et facturation destiné au Togo et à l'Afrique francophone.

La devise principale est le franc CFA (XOF).

L'application doit être professionnelle, moderne, rapide, sécurisée et évolutive.

---

## 2. COMPORTEMENT DE L'AGENT
- Toujours analyser avant de modifier le code.
- Ne jamais modifier une fonctionnalité existante sans comprendre son fonctionnement.
- Ne jamais supprimer un fichier important sans autorisation.
- Ne jamais remplacer une fonctionnalité fonctionnelle par une maquette.
- Ne jamais inventer des fonctionnalités non demandées.
- Toujours proposer un plan avant les modifications importantes.
- Travailler progressivement, module par module.
- Demander confirmation avant toute opération destructive.
- Expliquer les modifications effectuées.
- Ne jamais déclarer une fonctionnalité terminée sans l'avoir testée.
- Toujours communiquer, documenter et commenter le code en français.

---

## 3. TECHNOLOGIES OBLIGATOIRES
- **Framework :** Next.js avec App Router
- **Langage :** TypeScript strict
- **Styles :** Tailwind CSS
- **Composants UI :** shadcn/ui
- **Backend & Base de données :** Supabase (PostgreSQL)
- **Authentification :** Supabase Auth
- **Stockage de fichiers :** Supabase Storage
- **Graphiques :** Recharts
- **Icônes :** Lucide React
- **Application :** Progressive Web App (PWA)

Ne pas introduire une nouvelle technologie majeure sans justification et validation.

---

## 4. RÈGLES DE DESIGN
Respecter la maquette officielle StockPilot.  
*(Détails complémentaires dans [.agents/rules/design.md](./.agents/rules/design.md))*

**Palette principale :**
- Bleu électrique : `#1717F5`
- Jaune : `#FFD400`
- Blanc : `#FFFFFF`
- Fond clair : `#EEF2FC`
- Texte principal : `#17213D`
- Gris secondaire : `#667085`

**Style :**
- Interface premium et minimaliste.
- Cartes avec coins arrondis.
- Ombres légères.
- Boutons modernes.
- Icônes Lucide.
- Tableaux lisibles.
- Espacements cohérents.
- Navigation intuitive.

Ne jamais changer la palette sans autorisation.

---

## 5. RESPONSIVE DESIGN
- Développer en **Mobile First**.
- Compatibilité smartphone, tablette et ordinateur.
- Navigation adaptée à chaque écran.
- Aucun débordement horizontal non souhaité.
- Boutons adaptés aux écrans tactiles (zones de clic suffisantes).
- Formulaires faciles à utiliser sur mobile.

---

## 6. ARCHITECTURE ET CODE
- Utiliser des composants réutilisables.
- Séparer les composants, pages, services et logique métier.
- Éviter les fichiers trop volumineux.
- Respecter TypeScript strict (aucun type `any` injustifié).
- Éviter le code dupliqué (DRY).
- Centraliser les fonctions communes et utilitaires.
- Utiliser des noms explicites et signifiants.
- Gérer les erreurs proprement à chaque niveau.
- Documenter les fonctions complexes.

---

## 7. BASE DE DONNÉES
Supabase PostgreSQL est la source principale des données.  
*(Détails complémentaires dans [.agents/rules/database-security.md](./.agents/rules/database-security.md))*

- Concevoir des relations cohérentes.
- Utiliser des clés étrangères sur toutes les liaisons.
- Ajouter les index nécessaires pour les performances.
- Créer des migrations SQL versionnées et reproductibles.
- Utiliser `company_id` pour isoler strictement les données par entreprise.
- Ne jamais supprimer les données importantes sans autorisation.
- Ne jamais modifier directement la production pour tester.

---

## 8. SÉCURITÉ OBLIGATOIRE
- Activer **Row-Level Security (RLS)** sur toutes les tables contenant des données privées.
- Isoler strictement les entreprises les unes des autres.
- Vérifier les permissions et les rôles côté serveur.
- Protéger toutes les routes sensibles.
- Ne jamais exposer les clés secrètes dans le frontend.
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY`.
- Valider les données côté serveur.
- Protéger les opérations financières.
- Journaliser les actions sensibles (audit trail).
- Ne jamais faire confiance aux données envoyées uniquement par le navigateur.

---

## 9. RÈGLES MÉTIER
*(Détails complémentaires dans [.agents/rules/business-logic.md](./.agents/rules/business-logic.md))*

- Tous les montants sont affichés en FCFA (XOF).
- Les calculs financiers sont effectués exclusivement côté serveur.
- Les prix des produits sont historisés.
- Les factures émises conservent leurs prix historiques.
- Les stocks sont mis à jour après validation effective des opérations.
- Les ventes doivent être transactionnelles et atomiques.
- Les paiements partiels et acomptes doivent être pris en charge.
- Les numéros de facture doivent être uniques par entreprise et continus.
- Les opérations importantes doivent être auditables.

---

## 10. FACTURATION
- Générer de véritables fichiers PDF conformes.
- Permettre le téléchargement direct et l'impression.
- Prévoir une présentation professionnelle.
- Conserver l'intégrité de toutes les anciennes factures.
- Ne pas modifier silencieusement une facture émise.
- Prévoir les avoirs et corrections comptables.
- Séparer strictement les factures commerciales des factures d'abonnement StockPilot.

---

## 11. ABONNEMENTS ET PAIEMENTS
- Essai gratuit de 30 jours sans carte obligatoire.
- Formules d'abonnement : **Découverte**, **Professionnel**, **Business** et **Enterprise**.
- Paiements mensuels et annuels.
- Tarifs configurables en FCFA.
- Intégration prioritaire de **PayGate** pour supporter **Flooz** et **T-Money**.
- Vérifier les paiements côté serveur (webhooks sécurisés).
- Ne jamais activer un abonnement sur une simple confirmation frontend.

---

## 12. FONCTIONNALITÉS
- Tous les boutons doivent être fonctionnels.
- Tous les formulaires doivent être connectés à la base de données.
- Les recherches et filtres doivent être opérationnels.
- Ne jamais afficher de fausses statistiques comme des données réelles.
- Les données de démonstration doivent être clairement identifiées.
- Ne jamais simuler une transaction réelle.

---

## 13. TESTS ET VALIDATION
Après chaque module :
- Vérifier le fonctionnement général.
- Tester tous les formulaires et cas d'erreur.
- Tester les permissions et l'étanchéité RLS.
- Vérifier la gestion des erreurs.
- Vérifier le responsive sur différentes tailles d'écran.
- Vérifier les connexions et requêtes à Supabase.
- Corriger impérativement les problèmes avant de continuer.

---

## 14. MÉTHODE DE TRAVAIL
Développer StockPilot dans cet ordre chronologique strict :

1. Architecture générale
2. Base de données
3. Authentification
4. Multi-entreprises et rôles
5. Produits
6. Prix des produits
7. Stocks et magasins
8. Clients et fournisseurs
9. Achats et ventes
10. Facturation PDF
11. Abonnements
12. PayGate
13. Statistiques
14. Administration SaaS
15. Intelligence artificielle
16. Module pharmacie

> [!IMPORTANT]
> Ne pas commencer une nouvelle phase tant que la précédente n'est pas testée et validée.

---

## 15. OBJECTIF FINAL
Construire un véritable SaaS commercialisable, et non une simple démonstration.

La priorité absolue est :
* La fiabilité
* La sécurité
* La simplicité d'utilisation
* La cohérence du design
* La qualité du code

Toujours respecter les décisions du propriétaire du projet.
