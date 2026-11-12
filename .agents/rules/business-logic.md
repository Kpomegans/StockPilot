# RÈGLES DE LOGIQUE MÉTIER - STOCKPILOT

Ce document consigne les règles de gestion financière, logistique, commerciale, facturation et paiements pour StockPilot.

---

## 1. Monnaie et Calculs Financiers
* **Devise :** Franc CFA (XOF / FCFA). Affichage systématique : `15 000 FCFA` ou `15 000 XOF`.
* **Calculs exclusivement côté serveur :** Les montants totaux, remises, sous-totaux et taxes ne doivent **jamais** être calculés uniquement par le navigateur du client.
* **Typage monétaire :** Utiliser des entiers ou le type PostgreSQL `NUMERIC(15, 2)` pour éviter les imprécisions de calcul en virgule flottante.
* **Historisation des prix :** Conserver un historique complet des prix d'achat et de vente. Tout changement de tarif catalogue ne doit **jamais** altérer rétroactivement les prix des ventes et factures passées.

---

## 2. Gestion Atomique des Stocks
* **Transactions SQL obligatoires :** Les décrémentations et incrémentations de stocks doivent s'exécuter dans une transaction atomique (`BEGIN ... COMMIT`) ou via des fonctions RPC PostgreSQL.
* **Validation avant décompte :** Le stock n'est décrémenté qu'après validation effective de l'opération (encaissement ou bon de livraison signé).
* **Interdiction stricte du stock négatif :** Aucun article ne peut voir sa quantité descendre sous zéro. Valider la disponibilité en amont avec verrouillage optimiste ou pessimiste (`SELECT ... FOR UPDATE`).
* **Multi-magasins :** Associer chaque mouvement de stock à un magasin/dépôt spécifique de l'entreprise.

---

## 3. Ventes, Commandes et Règlements
* **Transactions atomiques :** Une vente inclut de façon insécable la commande, les lignes d'articles, le règlement et la mise à jour des stocks.
* **Paiements partiels supportés :** Permettre le suivi des acomptes, des soldes dus et des échéances de règlement pour chaque vente/facture.
* **Statuts de paiement clairs :** `en_attente`, `partiellement_payee`, `payee`, `en_retard`, `annulee`.
* **Numérotation unique par entreprise :** Les factures doivent respecter une séquence incrémentale continue, unique au sein de chaque entreprise (ex: `FACT-2026-0001`).

---

## 4. Facturation et Documents PDF
* **Génération de véritables PDF :** Générer de véritables fichiers PDF professionnels téléchargeables et imprimables.
* **Immuabilité et Avoirs :** Une facture émise ne peut être modifiée silencieusement. Toute correction comptable passe par un **avoir**.
* **Séparation étanche :** Séparer strictement les factures commerciales (clients finaux) des factures d'abonnement SaaS StockPilot.
* **Conservation :** Conserver l'historique et l'intégrité de toutes les anciennes factures émises.

---

## 5. Abonnements SaaS et Paiements (PayGate Flooz / T-Money)
* **Essai gratuit :** 30 jours d'essai offert sans obligation de saisie de moyen de paiement.
* **Formules d'abonnement :** Découverte, Professionnel, Business et Enterprise (mensuel et annuel en FCFA).
* **Intégration PayGate :** Prise en charge des paiements mobiles incontournables au Togo :
  * **Flooz** (Moov Africa Togo)
  * **T-Money** (Togocom)
* **Validation sécurisée :** Traitement des paiements et webhooks exclusivement côté serveur. Ne jamais activer un abonnement sur une confirmation frontend.

---

## 6. Intégrité et Auditabilité
* **Audit trail :** Chaque opération financière (encaissement, avoir, remise, annulation) doit enregistrer l'utilisateur responsable, la date, l'heure et l'empreinte de la transaction.
* **Aucune falsification de données :** Ne jamais générer de fausses statistiques ou de transactions fictives dans un environnement de travail réel.
