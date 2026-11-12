# RÈGLES DE DESIGN ET CHARTE GRAPHIQUE - STOCKPILOT

Ce document consigne les directives graphiques immuables de l'application StockPilot.

---

## 1. Palette Officielle (Ne jamais modifier sans accord explicite)

* **Bleu électrique (Primaire) :** `#1717F5` — Identité de marque, actions principales, boutons primaires.
* **Jaune (Accent / Mise en valeur) :** `#FFD400` — Alertes positives, badges spéciaux, touches visuelles dynamiques.
* **Blanc :** `#FFFFFF` — Fonds des cartes, conteneurs, contrastes.
* **Fond clair (Arrière-plan général) :** `#EEF2FC` — Fond des vues et de l'application pour un confort visuel optimal.
* **Texte principal :** `#17213D` — Titres, libellés et textes à fort contraste.
* **Gris secondaire :** `#667085` — Textes secondaires, bordures subtiles, icônes désactivées.

---

## 2. Style & Composants UI
* **Design Minimaliste & Premium :** Clarté absolue, éviter toute surcharge visuelle.
* **Cartes :** Coins arrondis (`rounded-lg` / `rounded-xl`), ombres légères et subtiles (`shadow-sm`).
* **Boutons :** Modernes, états `:hover`, `:active`, et `:disabled` soigneusement gérés avec transition fluide.
* **Bibliothèques UI :** Utiliser exclusivement les composants de **shadcn/ui** personnalisés avec la palette officielle.
* **Icônes :** Utiliser **Lucide React** de façon cohérente (tailles uniformes : 16px, 20px, 24px).
* **Graphiques :** Tableaux de bord propulsés par **Recharts**, reprenant la palette de la marque.
* **Tableaux :** Données aérées, en-têtes distincts, alignement rigoureux des colonnes numériques à droite.

---

## 3. Responsive & Mobile-First
* **Approche Mobile-First :** Concevoir chaque écran pour smartphone en priorité, puis adapter pour tablette et desktop.
* **Zéro débordement horizontal :** Aucune vue ne doit déborder horizontalement (`overflow-x: hidden` / structure flex/grid maîtrisée).
* **Zones tactiles (Touch Targets) :** Tous les boutons et éléments interactifs doivent respecter une taille minimale de 44x44px sur mobile.
* **Formulaires optimisés :** Dispositions verticales sur mobile, claviers adaptés (`inputmode="numeric"` pour les prix/quantités), validation claire et accessible.
