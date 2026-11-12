"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  MoreHorizontal,
  FileText,
  Plus,
  Minus,
  Trash2,
  Search,
  Scan,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Smartphone,
  CreditCard,
  Download,
  Building2,
  ShieldCheck,
  X,
  ChevronRight,
  Tag,
  ArrowRight,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Sparkles,
  Store,
  ArrowLeft
} from "lucide-react";
import { formatFCFA } from "@/lib/utils";

// --- TYPES DE DONNÉES CONFORMES AU CAHIER DES CHARGES ---
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Invoice {
  id: string;
  date: string;
  client: string;
  phone: string;
  items: { name: string; qty: number; unitPrice: number; total: number }[];
  subtotal: number;
  tax: number;
  total: number;
  paid: number;
  status: "Payée" | "Partielle" | "Émise";
  paymentMethod: string;
}

// --- PHRASES DE CONCENTRATION & MINDSET (Renouvelées à chaque connexion) ---
const FOCUS_QUOTES = [
  "Chaque vente compte. Restez concentré sur vos objectifs du jour.",
  "La rigueur dans les stocks est le secret d'un commerce prospère.",
  "Focalisez-vous sur la valeur apportée à vos clients et la qualité du service.",
  "Une gestion claire transforme chaque opportunité en réussite durable.",
  "La précision et la constance sont les clés de l'excellence commerciale.",
  "Maîtrisez vos marges et votre trésorerie avec discipline et lucidité.",
  "L'effort d'aujourd'hui construit la solidité de votre entreprise de demain.",
];

export default function StockPilotApp() {
  // Utilisateur, Boutique & Salutation horaire dynamique
  const userName = "Simon";
  const storeName = "ETS Sainte-Marie";
  const [greeting, setGreeting] = useState("Bonjour");
  const [focusQuote, setFocusQuote] = useState("Chaque vente compte. Restez concentré sur vos objectifs du jour.");

  useEffect(() => {
    // Calcul selon l'heure locale : 5h-17h59 -> "Bonjour", 18h-4h59 -> "Salut"
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 18) {
      setGreeting("Bonjour");
    } else {
      setGreeting("Salut");
    }

    // Sélection aléatoire d'une phrase de concentration à chaque session
    const randomQuote = FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)];
    setFocusQuote(randomQuote);
  }, []);

  // Navigation active : dashboard | pos | products | invoices | subscription
  const [activeTab, setActiveTab] = useState<"dashboard" | "pos" | "products" | "invoices" | "subscription">("dashboard");

  // --- CATALOGUE PRODUITS ---
  const [products, setProducts] = useState<Product[]>([
    { id: "p1", name: "Riz Parfumé 25kg (Thaïlande)", sku: "ALIM-RIZ-01", category: "Alimentation", buyPrice: 16500, sellPrice: 20000, stock: 45, minStock: 10, unit: "sacs" },
    { id: "p2", name: "Huile de Table Dinor 5L", sku: "ALIM-HUI-02", category: "Alimentation", buyPrice: 5200, sellPrice: 6500, stock: 28, minStock: 8, unit: "bidons" },
    { id: "p3", name: "Lait Bonnet Rouge 400g", sku: "ALIM-LAI-03", category: "Alimentation", buyPrice: 1800, sellPrice: 2300, stock: 4, minStock: 15, unit: "boîtes" },
    { id: "p4", name: "Sucre en Poudre Béghin Say 1kg", sku: "ALIM-SUC-04", category: "Alimentation", buyPrice: 750, sellPrice: 950, stock: 3, minStock: 20, unit: "paquets" },
    { id: "p5", name: "Ciment CPJ35 Diamond Cement", sku: "QUINC-CIM-01", category: "Quincaillerie", buyPrice: 72000, sellPrice: 82000, stock: 120, minStock: 30, unit: "tonnes" },
    { id: "p6", name: "Fer à béton 10mm (Barre 12m)", sku: "QUINC-FER-02", category: "Quincaillerie", buyPrice: 3800, sellPrice: 4600, stock: 85, minStock: 25, unit: "barres" },
    { id: "p7", name: "Carton Savon Omo 500g (x24)", sku: "HYG-SAV-01", category: "Hygiène", buyPrice: 12000, sellPrice: 15500, stock: 18, minStock: 5, unit: "cartons" },
  ]);

  // --- PANIER DE VENTE (POS) ---
  const [cart, setCart] = useState<CartItem[]>([
    { product: products[0], quantity: 2 },
    { product: products[1], quantity: 3 },
  ]);
  const [selectedPayment, setSelectedPayment] = useState<"FLOOZ" | "TMONEY" | "ESPECES">("FLOOZ");
  const [customerName, setCustomerName] = useState("Client Comptoir");
  const [customerPhone, setCustomerPhone] = useState("+228 90 00 11 22");
  const [searchProduct, setSearchProduct] = useState("");
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(null);

  // --- FACTURES ---
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: "FAC-0001",
      date: "09/11/2026",
      client: "ETS Sainte-Marie (Grand Marché Lomé)",
      phone: "+228 90 23 45 67",
      items: [
        { name: "Riz Parfumé 25kg (Thaïlande)", qty: 5, unitPrice: 20000, total: 100000 },
        { name: "Huile de Table Dinor 5L", qty: 10, unitPrice: 6500, total: 65000 },
        { name: "Carton Savon Omo 500g (x24)", qty: 2, unitPrice: 15500, total: 31000 },
      ],
      subtotal: 196000,
      tax: 0,
      total: 196000,
      paid: 196000,
      status: "Payée",
      paymentMethod: "Flooz (Moov Africa)",
    },
    {
      id: "FAC-0002",
      date: "09/11/2026",
      client: "Quincaillerie Moderne de l'Union",
      phone: "+228 99 88 77 66",
      items: [
        { name: "Ciment CPJ35 Diamond Cement", qty: 3, unitPrice: 82000, total: 246000 },
        { name: "Fer à béton 10mm (Barre 12m)", qty: 20, unitPrice: 4600, total: 92000 },
      ],
      subtotal: 338000,
      tax: 0,
      total: 338000,
      paid: 150000,
      status: "Partielle",
      paymentMethod: "T-Money (Togocom)",
    },
  ]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoices[0]);
  const [mobileInvoiceView, setMobileInvoiceView] = useState<"list" | "detail">("detail");

  // --- FORMULAIRE DE CRÉATION DE REÇU ---
  // Quantités par produit sur la facture sélectionnée (clé : nom du produit)
  const [receiptQty, setReceiptQty] = useState<Record<string, number>>({});
  const [receiptClient, setReceiptClient] = useState("");
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [receiptMessage, setReceiptMessage] = useState<{ text: string; type: "success" | "pending" } | null>(null);

  // Initialise les quantités par défaut quand on change de facture sélectionnée
  const initReceiptQty = (inv: Invoice) => {
    const defaults: Record<string, number> = {};
    inv.items.forEach((item) => { defaults[item.name] = item.qty; });
    setReceiptQty(defaults);
    setReceiptClient(inv.client);
    setReceiptDate(new Date().toISOString().split("T")[0]);
    setReceiptMessage(null);
  };

  // Crée un nouveau reçu (facture) depuis le formulaire
  const createReceipt = (paymentStatus: "Payée" | "Partielle") => {
    if (!selectedInvoice) return;
    const newItems = selectedInvoice.items
      .map((item) => ({
        ...item,
        qty: receiptQty[item.name] ?? item.qty,
        total: (receiptQty[item.name] ?? item.qty) * item.unitPrice,
      }))
      .filter((item) => item.qty > 0);
    if (newItems.length === 0) return;
    const newTotal = newItems.reduce((s, i) => s + i.total, 0);
    const newInvoice: Invoice = {
      id: `FAC-${String(invoices.length + 1).padStart(4, "0")}`,
      date: new Date(receiptDate).toLocaleDateString("fr-FR"),
      client: receiptClient || selectedInvoice.client,
      phone: selectedInvoice.phone,
      items: newItems,
      subtotal: newTotal,
      tax: 0,
      total: newTotal,
      paid: paymentStatus === "Payée" ? newTotal : 0,
      status: paymentStatus,
      paymentMethod: paymentStatus === "Payée" ? "Espèces" : "En attente",
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    setSelectedInvoice(newInvoice);
    setReceiptMessage({
      text: paymentStatus === "Payée"
        ? `✅ Reçu créé et payé ! ${formatFCFA(newTotal)} encaissé. Facture ${newInvoice.id}.`
        : `⏳ Reçu ${newInvoice.id} enregistré en attente de paiement.`,
      type: paymentStatus === "Payée" ? "success" : "pending",
    });
    setTimeout(() => setReceiptMessage(null), 5000);
  };

  // --- ABONNEMENT ---
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");

  // --- CALCULS DU PANIER ---
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.sellPrice * item.quantity, 0);
  const cartTotal = cartSubtotal; // taxes / remises configurables

  // Actions panier
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Validation d'une vente (Cahier des charges : transactionnelle, stock atomique, facture PDF)
  const processSale = () => {
    if (cart.length === 0) return;

    // Décrémenter le stock
    setProducts((prev) =>
      prev.map((prod) => {
        const inCart = cart.find((c) => c.product.id === prod.id);
        if (inCart) {
          return { ...prod, stock: Math.max(0, prod.stock - inCart.quantity) };
        }
        return prod;
      })
    );

    // Créer la facture snapshot
    const newInvoice: Invoice = {
      id: `FAC-${String(invoices.length + 1).padStart(4, "0")}`,
      date: new Date().toLocaleDateString("fr-FR"),
      client: customerName || "Client Comptoir",
      phone: customerPhone,
      items: cart.map((c) => ({
        name: c.product.name,
        qty: c.quantity,
        unitPrice: c.product.sellPrice,
        total: c.quantity * c.product.sellPrice,
      })),
      subtotal: cartTotal,
      tax: 0,
      total: cartTotal,
      paid: cartTotal,
      status: "Payée",
      paymentMethod: selectedPayment === "FLOOZ" ? "Flooz (Moov Africa)" : selectedPayment === "TMONEY" ? "T-Money (Togocom)" : "Espèces",
    };

    setInvoices([newInvoice, ...invoices]);
    setSelectedInvoice(newInvoice);
    setSaleSuccessMessage(`Vente validée avec succès ! ${formatFCFA(cartTotal)} encaissé via ${selectedPayment}. Facture ${newInvoice.id} émise.`);
    setCart([]);

    setTimeout(() => {
      setSaleSuccessMessage(null);
    }, 4500);
  };

  // Formules d'abonnements officielles du cahier des charges
  const subscriptionPlans = [
    {
      id: "decouverte",
      name: "Découverte",
      target: "Micro-commerces & indépendants",
      monthlyPrice: 3000,
      yearlyPrice: 30000,
      features: ["1 utilisateur", "1 magasin", "Jusqu'à 150 produits", "Facturation PDF standard", "Support communautaire"],
    },
    {
      id: "pro",
      name: "Professionnel",
      target: "Boutiques & commerces en croissance",
      monthlyPrice: 5000,
      yearlyPrice: 50000,
      features: ["3 utilisateurs", "2 magasins", "Produits illimités", "PayGate (Flooz / T-Money)", "Historique des prix", "Support prioritaire"],
      badge: "Recommandé",
    },
    {
      id: "business",
      name: "Business",
      target: "PME & distributeurs multi-magasins",
      monthlyPrice: 9000,
      yearlyPrice: 90000,
      features: ["10 utilisateurs", "5 magasins", "Multi-caisses", "Rapports avancés & exports", "API PayGate dédiée", "Gestion des rôles fins"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      target: "Grandes structures & franchises",
      monthlyPrice: 15000,
      yearlyPrice: 150000,
      features: ["Utilisateurs illimités", "Magasins illimités", "Accompagnement & formation", "Sauvegardes dédiées", "Module pharmacie / lots"],
    },
  ];

  return (
    <div className="min-h-screen bg-[#EEF2FC] text-[#17213D] flex flex-col font-sans pb-24 lg:pb-0">

      {/* ============================================================== */}
      {/* 1. EN-TÊTE DE MARQUE (BLEU ÉLECTRIQUE OFFICIEL #1717F5)         */}
      {/* ============================================================== */}
      <header className="bg-[#1717F5] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-3 text-left hover:opacity-90 transition active:scale-95 focus:outline-none cursor-pointer"
            title="Retour à l'accueil"
          >
            <div className="w-10 h-10 rounded-xl bg-white text-[#1717F5] flex items-center justify-center font-black text-xl shadow-sm">
              SP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">StockPilot</span>
              </div>
              <p className="text-[11px] text-blue-200 hidden sm:block">
                ETS Sainte-Marie • Magasin Principal (Lomé)
              </p>
            </div>
          </button>

          {/* Navigation supérieure (Visible sur grand écran) */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/10 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "dashboard" ? "bg-white text-[#1717F5] shadow-sm" : "text-white hover:bg-white/10"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Accueil
            </button>
            <button
              onClick={() => setActiveTab("pos")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "pos" ? "bg-[#FFD400] text-[#17213D] shadow-sm font-black" : "text-white hover:bg-white/10"
              }`}
            >
              <ShoppingCart className="w-4 h-4" /> Nouvelle Vente
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "products" ? "bg-white text-[#1717F5] shadow-sm" : "text-white hover:bg-white/10"
              }`}
            >
              <Package className="w-4 h-4" /> Prix & Stocks
            </button>
            <button
              onClick={() => setActiveTab("invoices")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "invoices" ? "bg-white text-[#1717F5] shadow-sm" : "text-white hover:bg-white/10"
              }`}
            >
              <FileText className="w-4 h-4" /> Facturation PDF
            </button>
            <button
              onClick={() => setActiveTab("subscription")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "subscription" ? "bg-white text-[#1717F5] shadow-sm" : "text-white hover:bg-white/10"
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#FFD400]" /> Abonnement
            </button>
          </nav>

          {/* Profil utilisateur & Salutation horaire dynamique */}
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <p className="text-xs font-black text-white flex items-center justify-end gap-1">
                <span>{greeting} {userName}</span>
                <span className="text-xs">👋</span>
              </p>
              <p className="text-[10px] text-blue-200 font-medium hidden sm:block">
                Administrateur
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-white text-[#1717F5] font-black flex items-center justify-center text-sm shadow-sm ring-2 ring-white/30">
              {userName.charAt(0)}
            </div>
          </div>
        </div>

        {/* Sous-bandeau d'accueil : Phrase de concentration du jour */}
        <div className="bg-blue-950/40 backdrop-blur-sm border-t border-white/10 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-blue-100 text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="shrink-0 flex items-center gap-1 font-bold text-white text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-200" /> Focus :
              </span>
              <span className="font-medium italic truncate text-blue-100 text-xs">
                « {focusQuote} »
              </span>
            </div>
            <span className="shrink-0 text-[10px] bg-white/10 px-2 py-0.5 rounded text-blue-200 font-mono hidden sm:inline">
              Session active
            </span>
          </div>
        </div>
      </header>

      {/* Message de succès global (toast) */}
      {saleSuccessMessage && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 text-center flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 text-[#FFD400]" />
          <span>{saleSuccessMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. CONTENU PRINCIPAL SELON L'ONGLET ACTIF                       */}
      {/* ============================================================== */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 space-y-6">

        {/* ------------------------------------------------------------ */}
        {/* ÉCRAN 1 : TABLEAU DE BORD (DASHBOARD MOBILE & DESKTOP)       */}
        {/* ------------------------------------------------------------ */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Bannière d'en-tête bleu électrique type maquette smartphone */}
            <div className="bg-gradient-to-r from-[#1717F5] to-blue-800 text-white rounded-2xl p-5 lg:p-6 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-md bg-white text-[#1717F5] flex items-center justify-center text-[10px] shadow-sm">
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                      Ventes du jour • {storeName}
                    </span>
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-black text-white mt-1">184 500 FCFA</h1>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-300" /> +14% vs hier
                  </span>
                </div>
              </div>

              {/* Raccourcis rapides à boutons (Cahier des charges : Vente / Entrée / Scanner / Inventaire) */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/15">
                <button
                  onClick={() => setActiveTab("pos")}
                  className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition text-center"
                >
                  <div className="w-8 h-8 rounded-full bg-[#FFD400] text-[#17213D] flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold">Vente</span>
                </button>
                <button
                  onClick={() => setActiveTab("products")}
                  className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition text-center"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold">Entrée</span>
                </button>
                <button
                  onClick={() => setActiveTab("pos")}
                  className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition text-center"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold">
                    <Scan className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold">Scanner</span>
                </button>
                <button
                  onClick={() => setActiveTab("products")}
                  className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition text-center"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold">Inventaire</span>
                </button>
              </div>
            </div>

            {/* Cartes métriques secondaires (Bénéfice estimé, Valeur du stock, etc.) */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-bold text-[#667085] block">Bénéfice estimé</span>
                <p className="text-xl lg:text-2xl font-black text-emerald-600 mt-1">44 200 FCFA</p>
                <span className="text-[11px] text-[#667085] mt-1 block">Marge moyenne : 24%</span>
              </div>

              <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-bold text-[#667085] block">Valeur du stock</span>
                <p className="text-xl lg:text-2xl font-black text-[#17213D] mt-1">3 275 000 FCFA</p>
                <span className="text-[11px] text-[#667085] mt-1 block">1 240 unités actives</span>
              </div>

              <div className="col-span-2 lg:col-span-1 bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#667085] block">Factures impayées</span>
                  <p className="text-xl lg:text-2xl font-black text-red-600 mt-1">188 000 FCFA</p>
                  <span className="text-[11px] text-red-600 font-semibold block">1 client en relance</span>
                </div>
                <button
                  onClick={() => setActiveTab("invoices")}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition"
                >
                  Recouvrer
                </button>
              </div>
            </div>

            {/* Graphique d'évolution des ventes sur 7 jours (Cahier des charges 4.1) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-[#17213D]">Évolution des Ventes (7 derniers jours)</h3>
                <span className="text-xs font-bold text-[#1717F5]">Total : 1 245 000 FCFA</span>
              </div>
              <div className="h-32 flex items-end justify-between gap-2 pt-4 px-2">
                {[
                  { day: "Lun", amount: 140000, h: "60%" },
                  { day: "Mar", amount: 180000, h: "80%" },
                  { day: "Mer", amount: 120000, h: "50%" },
                  { day: "Jeu", amount: 210000, h: "90%" },
                  { day: "Ven", amount: 195000, h: "85%" },
                  { day: "Sam", amount: 240000, h: "100%", current: true },
                  { day: "Dim", amount: 160000, h: "70%" },
                ].map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#667085] hidden sm:block">
                      {Math.round(item.amount / 1000)}k
                    </span>
                    <div className="w-full bg-slate-100 rounded-t-lg h-24 flex items-end">
                      <div
                        style={{ height: item.h }}
                        className={`w-full rounded-t-lg transition-all ${
                          item.current ? "bg-[#1717F5]" : "bg-blue-300 hover:bg-[#1717F5]"
                        }`}
                      ></div>
                    </div>
                    <span className={`text-[11px] font-bold ${item.current ? "text-[#1717F5]" : "text-[#667085]"}`}>
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertes de stock critique sous le seuil minimum (Cahier des charges 4.4) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-[#17213D]">Alertes Stock Sous Seuil Minimum</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  2 articles à réapprovisionner
                </span>
              </div>

              <div className="space-y-2">
                {products
                  .filter((p) => p.stock <= p.minStock)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-red-50/50 border border-red-200/60 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-[#17213D]">{p.name}</p>
                        <p className="text-[11px] text-red-600 font-semibold">
                          Reste : {p.stock} {p.unit} (Seuil minimum : {p.minStock})
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab("products");
                        }}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-[#1717F5] text-white hover:bg-blue-700 transition"
                      >
                        Commander
                      </button>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* ÉCRAN 2 : NOUVELLE VENTE (POS / ENCAISSEMENT MOBILE-FIRST)   */}
        {/* ------------------------------------------------------------ */}
        {activeTab === "pos" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            
            {/* Colonne Gauche : Sélection des articles (7/12 sur grand écran) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Barre de recherche et scan de code-barres */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    placeholder="Rechercher produit, code-barres ou SKU..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1717F5]"
                  />
                </div>
                <button
                  onClick={() => alert("Simulation Scanner Caméra activée ! Code produit détecté : ALIM-RIZ-01")}
                  className="p-2.5 rounded-xl bg-[#1717F5] text-white hover:bg-blue-700 transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
                >
                  <Scan className="w-4 h-4" />
                  <span className="hidden sm:inline">Scanner</span>
                </button>
              </div>

              {/* Grille des produits cliquables */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {products
                  .filter((p) => p.name.toLowerCase().includes(searchProduct.toLowerCase()) || p.sku.toLowerCase().includes(searchProduct.toLowerCase()))
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm text-left flex flex-col justify-between hover:border-[#1717F5] hover:shadow-md transition active:scale-95"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-[#17213D] line-clamp-2">{p.name}</h4>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-black text-[#1717F5]">{formatFCFA(p.sellPrice)}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.stock <= p.minStock ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                          Stock: {p.stock}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Colonne Droite : Le Panier & Encaissement (5/12 sur grand écran) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 space-y-4 flex flex-col justify-between">
              
              <div className="space-y-4">
                {/* En-tête du panier avec montant à encaisser (comme sur la maquette mobile page 1) */}
                <div className="bg-[#1717F5] text-white p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Montant à Encaisser</span>
                    <h2 className="text-3xl font-black">{formatFCFA(cartTotal)}</h2>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-[#FFD400] text-[#17213D] rounded-lg">
                    {cart.reduce((a, b) => a + b.quantity, 0)} articles
                  </span>
                </div>

                {/* Client & Contact */}
                <div className="space-y-2 text-xs">
                  <label className="font-bold text-[#17213D] block">Client / Contact</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nom du client"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                    />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+228..."
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium font-mono"
                    />
                  </div>
                </div>

                {/* Lignes du panier avec ajustement des quantités (+/-) */}
                <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-[#667085] text-xs">
                      Le panier est vide. Cliquez sur un article pour l'ajouter.
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product.id} className="pt-2 flex items-center justify-between text-xs">
                        <div className="flex-1 pr-2">
                          <p className="font-bold text-[#17213D] truncate">{item.product.name}</p>
                          <span className="text-[11px] text-[#667085]">
                            {formatFCFA(item.product.sellPrice)} × {item.quantity}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="w-6 h-6 rounded-md text-red-500 hover:bg-red-50 flex items-center justify-center ml-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Modes de paiement (Cahier des charges : Espèces, Flooz, T-Money) */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-[#17213D] block">Mode de Règlement</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPayment("FLOOZ")}
                      className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition ${
                        selectedPayment === "FLOOZ"
                          ? "bg-blue-50 border-[#1717F5] text-[#1717F5] shadow-sm ring-1 ring-[#1717F5]"
                          : "border-slate-200 text-[#667085] hover:bg-slate-50"
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-[#1717F5]" />
                      <span>Moov Flooz</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPayment("TMONEY")}
                      className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition ${
                        selectedPayment === "TMONEY"
                          ? "bg-amber-50 border-amber-500 text-amber-800 shadow-sm ring-1 ring-amber-500"
                          : "border-slate-200 text-[#667085] hover:bg-slate-50"
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-amber-600" />
                      <span>T-Money</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPayment("ESPECES")}
                      className={`p-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition ${
                        selectedPayment === "ESPECES"
                          ? "bg-emerald-50 border-emerald-600 text-emerald-800 shadow-sm ring-1 ring-emerald-600"
                          : "border-slate-200 text-[#667085] hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Espèces</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* BOUTON JAUNE OFFICIEL PLEINE LARGEUR (Conforme maquette mobile page 1) */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  disabled={cart.length === 0}
                  onClick={processSale}
                  className="w-full py-3.5 rounded-xl bg-[#FFD400] hover:bg-amber-400 text-[#17213D] font-black text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Encaisser {formatFCFA(cartTotal)}</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* ÉCRAN 3 : PRIX DES PRODUITS & CATALOGUE (Module 4.3)         */}
        {/* ------------------------------------------------------------ */}
        {activeTab === "products" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div>
                <h2 className="text-xl font-black text-[#1717F5]">Gestion des Prix & Catalogue</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Calcul automatique des marges brutes, historisation et suivi des seuils minimums.
                </p>
              </div>
              <button
                onClick={() => alert("Formulaire d'ajout de nouveau produit ouvert !")}
                className="px-4 py-2 rounded-xl bg-[#1717F5] text-white font-bold text-xs hover:bg-blue-700 transition flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Produit</span>
              </button>
            </div>

            {/* Tableau complet des prix et marges */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[#667085] uppercase font-bold text-[11px] border-b border-slate-200">
                      <th className="py-3 px-4">Réf / Produit</th>
                      <th className="py-3 px-4 text-center">Marge Brute</th>
                      <th className="py-3 px-4 text-center">Stock Dispo</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => {
                      const marginAmount = p.sellPrice - p.buyPrice;
                      const marginPercent = Math.round((marginAmount / p.sellPrice) * 100);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <span className="font-mono text-[10px] text-[#1717F5] font-bold block">{p.sku}</span>
                            <span className="font-bold text-[#17213D] block">{p.name}</span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-md font-bold text-emerald-700 bg-emerald-50">
                              +{marginPercent}% ({formatFCFA(marginAmount)})
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${
                              p.stock <= p.minStock ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {p.stock} {p.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                const newPriceStr = prompt(`Modifier le prix de vente pour "${p.name}" (actuel: ${p.sellPrice} FCFA) :`, String(p.sellPrice));
                                if (newPriceStr && !isNaN(Number(newPriceStr))) {
                                  const newPrice = Number(newPriceStr);
                                  setProducts((prev) =>
                                    prev.map((item) => (item.id === p.id ? { ...item, sellPrice: newPrice } : item))
                                  );
                                  alert(`Prix mis à jour et historisé : ${formatFCFA(newPrice)}. Ce tarif s'appliquera aux futures ventes.`);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1717F5] font-bold hover:bg-blue-100 transition"
                            >
                              Modifier Prix
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* ÉCRAN 4 : FACTURATION & DOCUMENTS PDF (Cahier des charges 5) */}
        {/* ------------------------------------------------------------ */}
        {activeTab === "invoices" && (
          <div className="animate-in fade-in duration-200">
            {/* Disposition grille : sur mobile on affiche soit la liste soit le détail */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Liste des factures (5/12) — cachée sur mobile quand détail ouvert */}
            <div className={`lg:col-span-5 space-y-4 ${mobileInvoiceView === "detail" ? "hidden lg:block" : "block"}`}>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#17213D]">Factures Émises</h3>
                  <span className="text-[11px] text-[#667085]">{invoices.length} factures enregistrées</span>
                </div>
                <button
                  onClick={() => setActiveTab("pos")}
                  className="px-3 py-1.5 rounded-xl bg-[#1717F5] text-white text-xs font-bold hover:bg-blue-700 transition"
                >
                  + Nouvelle Facture
                </button>
              </div>

              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => { setSelectedInvoice(inv); initReceiptQty(inv); setMobileInvoiceView("detail"); }}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      selectedInvoice?.id === inv.id
                        ? "bg-white border-[#1717F5] shadow-md ring-2 ring-[#1717F5]/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#1717F5]">{inv.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.status === "Payée" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-[#17213D] mt-1 truncate">{inv.client}</h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-400 text-[11px]">{inv.date}</span>
                      <span className="font-black text-[#17213D]">{formatFCFA(inv.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vue Détail & Aperçu PDF de la facture (7/12) — cachée sur mobile quand liste visible */}
            <div className={`lg:col-span-7 ${mobileInvoiceView === "list" ? "hidden lg:block" : "block"}`}>
              {selectedInvoice ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-4 sm:p-6 space-y-6 print-only-invoice mb-12 lg:mb-0">
                  
                  {/* Bouton Retour : visible uniquement sur mobile */}
                  <button
                    type="button"
                    onClick={() => setMobileInvoiceView("list")}
                    className="lg:hidden flex items-center gap-2 text-xs font-bold text-[#1717F5] hover:underline mb-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour aux factures
                  </button>

                  {/* En-tête de la facture (Conforme Cahier des charges 5.4) */}
                  <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#1717F5] text-white font-bold flex items-center justify-center text-sm">
                          SP
                        </div>
                        <span className="font-black text-lg text-[#1717F5]">StockPilot</span>
                      </div>
                      <p className="text-xs text-[#667085] mt-1">
                        ETS Sainte-Marie • NIF : 1002345678<br />
                        Grand Marché de Lomé, Togo<br />
                        Tél : +228 90 11 22 33
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold uppercase text-[#667085]">Facture Pro</span>
                      <h3 className="text-xl font-black font-mono text-[#1717F5]">{selectedInvoice.id}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Date : {selectedInvoice.date}</p>
                    </div>
                  </div>

                  {/* Destinataire client */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                    <span className="font-bold text-[#667085] uppercase text-[10px] block">Facturé à :</span>
                    <p className="font-bold text-sm text-[#17213D] mt-0.5">{selectedInvoice.client}</p>
                    <p className="text-slate-500">Contact : {selectedInvoice.phone}</p>
                  </div>

                  {/* Lignes de facture */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[#667085] font-bold">
                          <th className="py-2">Désignation</th>
                          <th className="py-2 text-center">Qté</th>
                          <th className="py-2 text-right">Prix Unitaire</th>
                          <th className="py-2 text-right">Total (FCFA)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedInvoice.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 font-medium text-[#17213D]">{item.name}</td>
                            <td className="py-2.5 text-center font-bold">{item.qty}</td>
                            <td className="py-2.5 text-right">{formatFCFA(item.unitPrice)}</td>
                            <td className="py-2.5 text-right font-bold text-[#17213D]">{formatFCFA(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totaux & Règlement */}
                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs space-y-1">
                      <p className="text-[#667085]">
                        Mode de paiement : <strong>{selectedInvoice.paymentMethod}</strong>
                      </p>
                      <p className="text-[#667085]">
                        Statut : <span className="font-bold text-emerald-700">{selectedInvoice.status}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#667085] block">Montant Net à Payer</span>
                      <p className="text-2xl font-black text-[#1717F5]">{formatFCFA(selectedInvoice.total)}</p>
                    </div>
                  </div>

                  {/* ═══ FORMULAIRE DE CRÉATION DE REÇU ═══ */}
                  <div className="pt-5 border-t border-slate-100 space-y-4 no-print pb-6">

                    {/* Titre du formulaire */}
                    <h4 className="font-black text-sm text-[#17213D] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#1717F5]" />
                      Créer un reçu personnalisé
                    </h4>

                    {/* Nom du client */}
                    <div>
                      <label className="text-[11px] font-bold text-[#667085] uppercase tracking-wide block mb-1">
                        Nom du client
                      </label>
                      <input
                        type="text"
                        value={receiptClient}
                        onChange={(e) => setReceiptClient(e.target.value)}
                        placeholder="Ex: M. Kofi Agbénou..."
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1717F5]/30 focus:border-[#1717F5] text-[#17213D] bg-slate-50 transition"
                      />
                    </div>

                    {/* Date de commande */}
                    <div>
                      <label className="text-[11px] font-bold text-[#667085] uppercase tracking-wide block mb-1">
                        Date de la commande
                      </label>
                      <input
                        type="date"
                        value={receiptDate}
                        onChange={(e) => setReceiptDate(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1717F5]/30 focus:border-[#1717F5] text-[#17213D] bg-slate-50 transition"
                      />
                    </div>

                    {/* Quantités par produit */}
                    <div>
                      <label className="text-[11px] font-bold text-[#667085] uppercase tracking-wide block mb-2">
                        Produits &amp; Quantités
                      </label>
                      <div className="space-y-2">
                        {selectedInvoice.items.map((item) => {
                          const qty = receiptQty[item.name] ?? item.qty;
                          return (
                            <div key={item.name} className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                              <span className="flex-1 text-xs font-medium text-[#17213D] truncate">{item.name}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setReceiptQty((prev) => ({ ...prev, [item.name]: Math.max(0, (prev[item.name] ?? item.qty) - 1) }))}
                                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-[#17213D] font-bold flex items-center justify-center hover:bg-slate-100 active:scale-95 transition"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-sm font-black text-[#1717F5]">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => setReceiptQty((prev) => ({ ...prev, [item.name]: (prev[item.name] ?? item.qty) + 1 }))}
                                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-[#17213D] font-bold flex items-center justify-center hover:bg-slate-100 active:scale-95 transition"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-[11px] font-bold text-[#667085] w-20 text-right shrink-0">
                                {formatFCFA(qty * item.unitPrice)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Total du reçu */}
                    <div className="flex items-center justify-between bg-[#EEF2FC] px-4 py-2.5 rounded-xl border border-blue-100">
                      <span className="text-xs font-bold text-[#667085]">Total reçu</span>
                      <span className="text-base font-black text-[#1717F5]">
                        {formatFCFA(
                          selectedInvoice.items.reduce(
                            (s, item) => s + (receiptQty[item.name] ?? item.qty) * item.unitPrice,
                            0
                          )
                        )}
                      </span>
                    </div>

                    {/* Message de confirmation */}
                    {receiptMessage && (
                      <div className={`text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 ${
                        receiptMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}>
                        {receiptMessage.text}
                      </div>
                    )}

                    {/* Boutons d'action : Payer / En attente */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => createReceipt("Payée")}
                        className="py-3.5 px-4 rounded-xl bg-[#FFD400] hover:bg-amber-400 text-[#17213D] font-black text-sm transition shadow-md flex items-center justify-center gap-2 active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Payer
                      </button>
                      <button
                        type="button"
                        onClick={() => createReceipt("Partielle")}
                        className="py-3.5 px-4 rounded-xl bg-white border-2 border-slate-300 hover:border-[#1717F5] text-[#17213D] hover:text-[#1717F5] font-black text-sm transition flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Clock className="w-4 h-4 shrink-0" />
                        En attente
                      </button>
                    </div>

                    {/* Bouton Télécharger PDF (pleine largeur sur mobile) */}
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="w-full py-3 px-4 rounded-xl bg-[#1717F5] hover:bg-blue-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      Télécharger la facture PDF
                    </button>

                  </div>

                </div>
              ) : (
                <div className="bg-white p-12 rounded-2xl text-center text-[#667085] text-xs">
                  Sélectionnez une facture pour voir le détail.
                </div>
              )}
            </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* ÉCRAN 5 : TARIFICATION & ABONNEMENTS SAAS (Cahier des charges 6) */}
        {/* ------------------------------------------------------------ */}
        {activeTab === "subscription" && (
          <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
            
            {/* En-tête de l'abonnement avec l'essai gratuit */}
            <div className="text-center space-y-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFD400] text-[#17213D] inline-block shadow-sm">
                Essai Gratuit Actif • 18 jours restants sur 30
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1717F5]">
                Choisissez votre Formule StockPilot
              </h2>
              <p className="text-xs sm:text-sm text-[#667085] max-w-lg mx-auto">
                SaaS professionnel conçu pour le Togo et l'Afrique francophone. Paiements faciles par Flooz ou T-Money.
              </p>

              {/* Sélecteur Mensuel / Annuel (avec 2 mois offerts comme sur la maquette page 9) */}
              <div className="pt-3 flex items-center justify-center gap-3">
                <span className={`text-xs font-bold ${billingCycle === "monthly" ? "text-[#1717F5]" : "text-[#667085]"}`}>
                  Mensuel
                </span>
                <button
                  onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                  className="w-12 h-6 rounded-full bg-[#1717F5] p-1 flex items-center transition"
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-[#FFD400] shadow-sm transform transition ${
                      billingCycle === "yearly" ? "translate-x-6" : "translate-x-0"
                    }`}
                  ></div>
                </button>
                <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === "yearly" ? "text-[#1717F5]" : "text-[#667085]"}`}>
                  Annuel <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-black">2 mois offerts</span>
                </span>
              </div>
            </div>

            {/* Grille des 4 formules officielles (Découverte, Professionnel, Business, Enterprise) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {subscriptionPlans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
                const periodLabel = billingCycle === "yearly" ? "/ an" : "/ mois";

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`bg-white p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between relative ${
                      isSelected
                        ? "border-[#1717F5] shadow-lg ring-2 ring-[#1717F5]/20"
                        : "border-slate-200/80 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFD400] text-[#17213D] text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <h4 className="font-bold text-base text-[#17213D]">{plan.name}</h4>
                      <p className="text-[11px] text-[#667085] mt-0.5 leading-snug">{plan.target}</p>

                      <div className="mt-4 pb-4 border-b border-slate-100">
                        <span className="text-2xl font-black text-[#1717F5]">{formatFCFA(price)}</span>
                        <span className="text-[11px] text-[#667085] ml-1">{periodLabel}</span>
                      </div>

                      <ul className="mt-4 space-y-2 text-[11px] text-[#17213D]">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-100">
                      <button
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                          isSelected ? "bg-[#1717F5] text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {isSelected ? "Formule Sélectionnée" : "Choisir"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paiement Mobile Money via PayGate Togo (Flooz & T-Money) */}
            <div className="bg-gradient-to-r from-[#1717F5] to-blue-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase text-[#FFD400]">Passerelle Nationale Intégrée</span>
                <h3 className="text-lg font-bold">Payer avec PayGate Togo (Flooz & T-Money)</h3>
                <p className="text-xs text-blue-100 max-w-xl">
                  Confirmation automatique par webhook serveur. Activation immédiate de votre abonnement sans carte bancaire requise.
                </p>
              </div>
              <button
                onClick={() => alert(`Abonnement ${selectedPlan.toUpperCase()} validé avec succès via PayGate Togo !`)}
                className="px-6 py-3 rounded-xl bg-[#FFD400] hover:bg-amber-400 text-[#17213D] font-black text-xs transition shadow-md whitespace-nowrap self-start sm:self-auto"
              >
                Valider l'abonnement en FCFA
              </button>
            </div>

          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* 3. BARRE DE NAVIGATION BASSE OFFICIELLE (BOTTOM BAR MOBILE)    */}
      {/* Conforme à la section 3.2 du Cahier des charges               */}
      {/* ============================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-3 py-2 shadow-lg flex items-center justify-around">
        
        {/* 1. Accueil */}
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === "dashboard" ? "text-[#1717F5]" : "text-[#667085]"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold">Accueil</span>
        </button>

        {/* 2. Stock & Prix */}
        <button
          onClick={() => setActiveTab("products")}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === "products" ? "text-[#1717F5]" : "text-[#667085]"
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-bold">Stock/Prix</span>
        </button>

        {/* 3. BOUTON CENTRAL JAUNE SURÉLEVÉ POUR "VENTE" (Conforme maquette) */}
        <button
          onClick={() => setActiveTab("pos")}
          className="-mt-5 w-14 h-14 rounded-full bg-[#FFD400] text-[#17213D] border-4 border-[#EEF2FC] shadow-lg flex items-center justify-center font-black transition active:scale-95"
        >
          <ShoppingCart className="w-6 h-6" />
        </button>

        {/* 4. Factures */}
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === "invoices" ? "text-[#1717F5]" : "text-[#667085]"
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-bold">Factures</span>
        </button>

        {/* 5. Plus / Abonnement */}
        <button
          onClick={() => setActiveTab("subscription")}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === "subscription" ? "text-[#1717F5]" : "text-[#667085]"
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-bold">Abonnement</span>
        </button>

      </div>

    </div>
  );
}
