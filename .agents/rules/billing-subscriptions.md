# RÈGLES DE FACTURATION ET ABONNEMENTS SAAS - STOCKPILOT

Ce document régit l'émission des documents comptables (PDF) et la monétisation SaaS via PayGate.

---

## 1. Génération de Factures PDF
* **Véritables fichiers PDF :** Générer des fichiers PDF authentiques (via des bibliothèques fiables comme `@react-pdf/renderer`, `pdf-lib` ou moteur de rendu headless côté serveur).
* **Téléchargement et impression :** Proposer un bouton de téléchargement direct et une fonction d'impression conforme aux formats standards A4 et ticket thermique (si requis pour caisse).
* **Immuabilité et Avoirs :** Une facture émise ne peut être modifiée silencieusement. Toute correction comptable doit faire l'objet d'un **avoir** (note de crédit).
* **Séparation étanche des flux comptables :**
  1. **Factures Commerciales :** Émises par l'entreprise utilisatrice à destination de ses propres clients finaux.
  2. **Factures d'Abonnement SaaS :** Émises par la plateforme StockPilot à destination des entreprises abonnées.

---

## 2. Abonnements SaaS StockPilot
* **Période d'essai :** 30 jours d'essai gratuit offert à toute nouvelle inscription d'entreprise, sans saisie préalable de moyen de paiement obligatoire.
* **Formules d'abonnement :**
  1. **Découverte** (Starter pour indépendants / micro-commerces)
  2. **Professionnel** (Boutiques établies, gestion multi-utilisateurs)
  3. **Business** (PME en croissance, multi-magasins)
  4. **Enterprise** (Grand compte, franchises, accompagnement dédié)
* **Périodicité :** Facturation mensuelle et annuelle (avec réduction incitative sur l'annuel).
* **Tarifs configurables :** Montants configurés en Francs CFA (FCFA/XOF).

---

## 3. Passerelle de Paiement PayGate (Flooz & T-Money)
* **Moyens de paiement locaux :** Intégration prioritaire de **PayGate** pour supporter les paiements mobiles incontournables au Togo :
  * **Flooz** (Moov Africa Togo)
  * **T-Money** (Togocom)
* **Vérification côté serveur :** La confirmation d'un paiement et le basculement d'un abonnement vers le statut `actif` doivent résulter **exclusivement** :
  * D'une notification webhook signée et validée par le serveur.
  * Ou d'une interrogation directe de l'API de PayGate depuis une route API sécurisée côté serveur.
* **Règle absolue :** Ne **JAMAIS** activer un abonnement ou marquer une facture comme payée sur la foi d'un appel direct ou d'une réponse frontend.
