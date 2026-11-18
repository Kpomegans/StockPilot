import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  PackagePlus,
  ScanBarcode,
  ClipboardList,
  Store,
  Moon,
  Sun,
  Eye,
  EyeOff,
  AlertTriangle,
  Receipt,
  User,
  Plus,
  Minus,
  CheckCircle2,
  Search,
  ChevronRight,
  TrendingUp,
  Download,
  Share2,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Bell,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Check,
  X,
  Briefcase,
  Crown,
  ChevronDown,
  ArrowRightLeft,
  Database,
  LogOut
} from 'lucide-react';
import './App.css';
import { supabase } from './lib/supabase';
import AuthPage from './pages/AuthPage';
import './pages/AuthPage.css';

// --- UTILITAIRES DE FORMATAGE ---
const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');

const ROLES = {
  caissier: { label: 'Caissier', badge: 'Vente uniquement' },
  gestionnaire: { label: 'Gestionnaire', badge: 'Opérations & Stocks' },
  proprietaire: { label: 'Administrateur', badge: 'Accès Total & Délégation' }
};

// Matrice des autorisations par défaut (Le STOCK est strictement masqué au caissier)
const DEFAULT_PERMISSIONS = {
  caissier: {
    canViewStock: false,     // <-- STOCK MASQUÉ AU CAISSIER
    canEditStock: false,     // Pas d'ajout ni réassort
    canViewReports: false,   // Pas de rapports financiers
    canViewBuy: false,       // Pas de prix d'achat ni marges
    canEditPrice: false,     // Pas de changement de prix
    canClose: false          // Pas de clôture journalière
  },
  gestionnaire: {
    canViewStock: true,
    canEditStock: true,
    canViewReports: true,
    canViewBuy: false,
    canEditPrice: false,
    canClose: true
  },
  proprietaire: {
    canViewStock: true,
    canEditStock: true,
    canViewReports: true,
    canViewBuy: true,
    canEditPrice: true,
    canClose: true
  }
};

const PERMISSION_DEFINITIONS = [
  { key: 'canViewStock', label: 'Voir les Stocks & Niveaux', desc: 'Affiche l\'onglet Stock, les unités en rayon et les alertes d\'inventaire.' },
  { key: 'canEditStock', label: 'Ajouter & Réapprovisionner Articles', desc: 'Permet de créer de nouveaux produits et d\'enregistrer les entrées de stock (+10).' },
  { key: 'canViewReports', label: 'Consulter les Rapports & Statistiques', desc: 'Accès aux graphiques des ventes, bilans financiers et historiques de clôture.' },
  { key: 'canClose', label: 'Clôturer la Caisse Journalière', desc: 'Autorise la clôture de fin de journée et l\'archivage des encaissements.' },
  { key: 'canViewBuy', label: 'Voir les Prix d\'Achat & Marges', desc: 'Affiche le coût d\'achat unitaire et les marges bénéficiaires des produits.' },
  { key: 'canEditPrice', label: 'Modifier les Prix de Vente', desc: 'Autorise la modification libre des prix de vente affichés.' }
];

const INITIAL_PRODUCTS = [
  { id: 1, n: 'Sucre 1 kg', p: 800, s: 8, buy: 650, min: 10 },
  { id: 2, n: 'Huile végétale 1 L', p: 1500, s: 5, buy: 1250, min: 10 },
  { id: 3, n: 'Riz parfumé 5 kg', p: 2500, s: 12, buy: 2000, min: 15 },
  { id: 4, n: 'Eau minérale 1,5 L', p: 600, s: 140, buy: 450, min: 20 },
  { id: 5, n: 'Savon de ménage', p: 250, s: 60, buy: 180, min: 20 },
  { id: 6, n: 'Lait en poudre 400 g', p: 2200, s: 20, buy: 1850, min: 10 }
];

// Montant initial fixe de la journée (ex: 184 500 FCFA issu des ventes matinales du magasin)
const INITIAL_BASELINE_SALES = 184500;
const INITIAL_BASELINE_COUNT = 18;

// --- GÉNÉRATEUR PDF TICKET DE CAISSE ---
function generateReceiptPdf(sale) {
  const f = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const C = 34;
  const R = [];
  const c = (t, b) => R.push([t.padStart(Math.floor((C + t.length) / 2)), b]);
  const lr = (l, r, b) => R.push([l.slice(0, C - r.length - 1).padEnd(C - r.length) + r, b]);
  const hr = () => R.push(['-'.repeat(C)]);
  const esc = (t) => String(t || '').replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');

  c('STOCKPILOT', 1);
  c('Boutique Centrale · Magasin Principal');
  hr();
  c('REÇU DE VENTE OFFICIEL', 1);
  hr();
  lr('Ticket N° ' + (sale.no || ''), sale.t || '');
  lr('Date', sale.date || '');
  lr('Client', sale.cl || 'Client de passage');
  hr();
  (sale.items || []).forEach((i) => lr(i.q + ' x ' + i.n, f(i.p * i.q) + ' F'));
  hr();
  lr('Sous-total', f(sale.sub) + ' FCFA');
  if (sale.d) lr('Remise accordée', '-' + f(sale.d) + ' FCFA');
  lr('TOTAL ENCAISSÉ', f(sale.tot) + ' FCFA', 1);
  hr();
  lr('Mode de règlement', sale.pay);
  if (sale.pay === 'Espèces') {
    lr('Montant remis', f(sale.rcv) + ' FCFA');
    lr('Monnaie rendue', f(sale.chg) + ' FCFA');
  }
  hr();
  c('Merci de votre confiance !');
  c('Propulsé par StockPilot v2.1');

  const H = R.length * 13 + 44;
  let ct = '';
  R.forEach((r, i) => {
    ct += 'BT /F' + (r[1] ? 2 : 1) + ' 9 Tf 21 ' + (H - 30 - i * 13) + ' Td (' + esc(r[0]) + ') Tj ET\n';
  });

  const o = [];
  o[1] = '<</Type/Catalog/Pages 2 0 R>>';
  o[2] = '<</Type/Pages/Kids[3 0 R]/Count 1>>';
  o[3] = '<</Type/Page/Parent 2 0 R/MediaBox[0 0 226 ' + H + ']/Resources<</Font<</F1 4 0 R/F2 5 0 R>>>>/Contents 6 0 R>>';
  o[4] = '<</Type/Font/Subtype/Type1/BaseFont/Courier/Encoding/WinAnsiEncoding>>';
  o[5] = '<</Type/Font/Subtype/Type1/BaseFont/Courier-Bold/Encoding/WinAnsiEncoding>>';
  o[6] = '<</Length ' + ct.length + '>>\nstream\n' + ct + 'endstream';

  let p = '%PDF-1.4\n';
  const off = [];
  for (let i = 1; i <= 6; i++) {
    off[i] = p.length;
    p += i + ' 0 obj\n' + o[i] + '\nendobj\n';
  }
  const x = p.length;
  p += 'xref\n0 7\n0000000000 65535 f \n' + off.slice(1).map((v) => String(v).padStart(10, '0') + ' 00000 n \n').join('') + 'trailer\n<</Size 7/Root 1 0 R>>\nstartxref\n' + x + '\n%%EOF';
  return Uint8Array.from(p, (ch) => ch.charCodeAt(0) & 255);
}

function downloadReceipt(sale, notify) {
  try {
    const bytes = generateReceiptPdf(sale);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recu-${sale.no}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (notify) notify(`Reçu ${sale.no} téléchargé ✓`);
  } catch (err) {
    if (notify) notify('Erreur lors du téléchargement du reçu');
  }
}

export default function App() {
  // --- AUTHENTIFICATION SUPABASE ---
  // null = pas encore vérifié, false = non connecté, objet = session active
  const [supabaseSession, setSupabaseSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Récupère la session courante au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseSession(session);
      setAuthLoading(false);
    });

    // Écoute les changements d'état d'authentification (connexion, déconnexion, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Déconnexion sécurisée
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange mettra supabaseSession à null automatiquement
  };

  const [theme, setTheme] = useState(() => localStorage.getItem('sp_theme') || 'light');
  const [hideAmounts, setHideAmounts] = useState(false);
  const [currentTab, setCurrentTab] = useState('accueil');
  const [role, setRole] = useState(() => localStorage.getItem('sp_active_role') || 'caissier');
  const [toast, setToast] = useState('');

  // --- SÉCURITÉ & DÉLÉGATION DES PERMISSIONS ---
  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('sp_role_permissions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_PERMISSIONS;
  });

  const [adminPin, setAdminPin] = useState(() => {
    return localStorage.getItem('sp_admin_pin') || '1234';
  });

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [targetRoleToUnlock, setTargetRoleToUnlock] = useState(null);

  // Modal sélecteur de rôle responsive / mobile
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [dbStatus, setDbStatus] = useState('connecting'); // 'connected' | 'offline' | 'connecting'

  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [changePinError, setChangePinError] = useState('');

  // 1. MONTANT INITIAL DU DASHBOARD (Initialisé à 184 500 FCFA ou sauvegardé)
  const [initialBaseAmount, setInitialBaseAmount] = useState(() => {
    const saved = localStorage.getItem('sp_base_amount');
    return saved !== null ? Number(saved) : INITIAL_BASELINE_SALES;
  });

  const [initialBaseCount, setInitialBaseCount] = useState(() => {
    const saved = localStorage.getItem('sp_base_count');
    return saved !== null ? Number(saved) : INITIAL_BASELINE_COUNT;
  });

  // 2. LISTE DES PRODUITS
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('sp_react_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  // 3. NOUVELLES VENTES RÉALISÉES
  const [newSales, setNewSales] = useState(() => {
    const saved = localStorage.getItem('sp_new_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('sp_react_clients');
    return saved ? JSON.parse(saved) : [
      { n: 'Client de passage', tel: '' },
      { n: 'Mme Amavi', tel: '90 12 34 56' },
      { n: 'Ets Kokou', tel: '91 22 33 44' }
    ];
  });

  const [closedDays, setClosedDays] = useState(() => {
    const saved = localStorage.getItem('sp_react_closed');
    return saved ? JSON.parse(saved) : [
      { date: '11/11/2026', tot: 159000, n: 16, by: 'Propriétaire' }
    ];
  });

  // Panier & Vente
  const [cart, setCart] = useState({});
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [client, setClient] = useState('Client de passage');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState(7);

  // Formulaires
  const [showNewProd, setShowNewProd] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBuy, setNewProdBuy] = useState('');
  const [newProdSell, setNewProdSell] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdMin, setNewProdMin] = useState('10');

  const [newClientName, setNewClientName] = useState('');
  const [newClientTel, setNewClientTel] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);

  // --- BOUTIQUES & MULTI-MAGASINS ---
  const [shops, setShops] = useState(() => {
    const saved = localStorage.getItem('sp_shops');
    return saved ? JSON.parse(saved) : [
      { co: 'Boutique Centrale', st: ['Magasin principal', 'Dépôt Lomé'] },
      { co: 'Épicerie Mawuli', st: ['Magasin Kara', 'Magasin Atakpamé'] }
    ];
  });

  const [currentShop, setCurrentShop] = useState(() => {
    const saved = localStorage.getItem('sp_current_shop');
    return saved ? JSON.parse(saved) : { co: 'Boutique Centrale', st: 'Magasin principal' };
  });

  const [showShopModal, setShowShopModal] = useState(false);
  const [showAddShopForm, setShowAddShopForm] = useState(false);
  const [newShopType, setNewShopType] = useState('Magasin');
  const [newShopName, setNewShopName] = useState('');
  const [newShopCompany, setNewShopCompany] = useState('Boutique Centrale');

  // --- RÉCEPTION LIBRE DE STOCK (NON LIMITÉE À 10) ---
  const [restockQtyInputs, setRestockQtyInputs] = useState({});
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [modalRestockProduct, setModalRestockProduct] = useState(1);
  const [modalRestockQty, setModalRestockQty] = useState('');

  // Sauvegardes persistantes
  useEffect(() => {
    localStorage.setItem('sp_shops', JSON.stringify(shops));
  }, [shops]);

  useEffect(() => {
    localStorage.setItem('sp_current_shop', JSON.stringify(currentShop));
  }, [currentShop]);

  // Sauvegardes persistantes
  useEffect(() => {
    localStorage.setItem('sp_base_amount', String(initialBaseAmount));
  }, [initialBaseAmount]);

  useEffect(() => {
    localStorage.setItem('sp_base_count', String(initialBaseCount));
  }, [initialBaseCount]);

  useEffect(() => {
    localStorage.setItem('sp_react_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('sp_new_sales', JSON.stringify(newSales));
  }, [newSales]);

  useEffect(() => {
    localStorage.setItem('sp_react_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('sp_react_closed', JSON.stringify(closedDays));
  }, [closedDays]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('sp_theme', theme);
  }, [theme]);

  // --- SYNCHRONISATION SUPABASE (DONNÉES EN DIRECT + FALLBACK LOCAL) ---
  useEffect(() => {
    let isMounted = true;

    async function syncWithSupabase() {
      try {
        // 1. Charger les produits depuis Supabase
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: true });

        if (!prodErr && prodData && prodData.length > 0 && isMounted) {
          setProducts(prodData);
          setDbStatus('connected');
        } else if (prodErr) {
          if (isMounted) setDbStatus('offline');
        }

        // 2. Charger les clients
        const { data: clientData, error: clientErr } = await supabase
          .from('clients')
          .select('*');

        if (!clientErr && clientData && clientData.length > 0 && isMounted) {
          setClients(clientData);
        }

        // 3. Charger les ventes récentes
        const { data: salesData, error: salesErr } = await supabase
          .from('sales')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!salesErr && salesData && salesData.length > 0 && isMounted) {
          const formatted = salesData.map((s) => ({
            no: s.ticket_no,
            cl: s.client_name,
            t: s.time,
            date: s.date,
            pay: s.payment_method,
            tot: Number(s.total),
            sub: Number(s.subtotal),
            d: Number(s.discount),
            rcv: Number(s.amount_received),
            chg: Number(s.change_returned),
            items: s.items || [],
            dashboardTotalAfter: Number(s.dashboard_total_after)
          }));
          setNewSales(formatted);
          if (isMounted) setDbStatus('connected');
        }
      } catch (e) {
        if (isMounted) setDbStatus('offline');
      }
    }

    syncWithSupabase();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sauvegardes de sécurité
  useEffect(() => {
    localStorage.setItem('sp_active_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('sp_role_permissions', JSON.stringify(permissions));
  }, [permissions]);

  useEffect(() => {
    localStorage.setItem('sp_admin_pin', adminPin);
  }, [adminPin]);

  // Permissions actives pour le rôle courant
  const currentPermissions = permissions[role] || DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.caissier;

  // Redirection automatique si un rôle sans droit se trouve sur l'onglet Stock ou Rapports
  useEffect(() => {
    if (!currentPermissions.canViewStock && currentTab === 'stock') {
      setCurrentTab('vente');
      showToast('Accès restreint : le stock n\'est pas accessible aux caissiers.');
    }
    if (!currentPermissions.canViewReports && currentTab === 'reports') {
      setCurrentTab('vente');
      showToast('Accès restreint : les rapports ne sont pas accessibles aux caissiers.');
    }
  }, [role, permissions, currentTab]);

  // Gestion du basculement sécurisé de rôle
  const handleSelectRole = (targetRole) => {
    if (targetRole === role) return;
    if (targetRole === 'proprietaire') {
      // Déverrouillage Administrateur requis par code PIN
      setTargetRoleToUnlock('proprietaire');
      setPinInput('');
      setPinError('');
      setShowPinModal(true);
    } else {
      setRole(targetRole);
      showToast(`Profil activé : ${ROLES[targetRole].label}`);
    }
  };

  const handleVerifyPin = () => {
    if (pinInput === adminPin) {
      setRole(targetRoleToUnlock || 'proprietaire');
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      showToast('Session Administrateur déverrouillée ✓');
    } else {
      setPinError('Code PIN incorrect (Code par défaut : 1234)');
    }
  };

  // Délégation de permission : SEUL l'Administrateur peut déléguer !
  const handleTogglePermission = (targetRole, permKey) => {
    if (role !== 'proprietaire') {
      showToast('Accès refusé : Seul l\'Administrateur peut déléguer les droits.');
      return;
    }
    if (targetRole === 'proprietaire') {
      showToast('Les privilèges Administrateur sont permanents.');
      return;
    }
    setPermissions((prev) => ({
      ...prev,
      [targetRole]: {
        ...prev[targetRole],
        [permKey]: !prev[targetRole]?.[permKey]
      }
    }));
    showToast(`Délégation modifiée pour ${ROLES[targetRole].label}`);
  };

  const handleResetPermissions = () => {
    if (role !== 'proprietaire') return;
    setPermissions(DEFAULT_PERMISSIONS);
    showToast('Permissions rétablies aux valeurs par défaut ✓');
  };

  const handleChangePin = () => {
    if (oldPinInput !== adminPin) {
      setChangePinError('L\'ancien code PIN est incorrect.');
      return;
    }
    if (newPinInput.length < 4) {
      setChangePinError('Le nouveau code PIN doit comporter au moins 4 chiffres.');
      return;
    }
    setAdminPin(newPinInput);
    setShowChangePinModal(false);
    setOldPinInput('');
    setNewPinInput('');
    setChangePinError('');
    showToast('Code PIN Administrateur mis à jour ✓');
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // --- CUMUL TOTAL EN DIRECT : PRIX INITIAL DU DASHBOARD + TOUTES LES VENTES RÉCENTES ---
  const newSalesSum = useMemo(() => newSales.reduce((acc, s) => acc + s.tot, 0), [newSales]);
  const totalDashboardToday = initialBaseAmount + newSalesSum;
  const totalSalesCountToday = initialBaseCount + newSales.length;
  const avgBasket = totalSalesCountToday ? Math.round(totalDashboardToday / totalSalesCountToday) : 0;

  // Répartition par mode de règlement
  const paymentBreakdown = useMemo(() => {
    // Répartition de base proportionnelle
    const res = {
      'Espèces': Math.round(initialBaseAmount * 0.52),
      'Flooz': Math.round(initialBaseAmount * 0.30),
      'T-Money': Math.round(initialBaseAmount * 0.18)
    };
    newSales.forEach((s) => {
      res[s.pay] = (res[s.pay] || 0) + s.tot;
    });
    return res;
  }, [initialBaseAmount, newSales]);

  // Graphique d'évolution réactif
  const chartPoints = useMemo(() => {
    const data7 = [98000, 121000, 87000, 142000, 133000, 159000, totalDashboardToday];
    const data30 = Array.from({ length: 30 }, (_, i) => (i === 29 ? totalDashboardToday : Math.round(90000 + Math.sin(i / 3) * 28000 + i * 2200)));
    const d = period === 7 ? data7 : data30;
    const max = Math.max(...d, 1000) * 1.15;
    const W = 460;
    const H = 130;
    const step = (W - 20) / (d.length - 1);
    const pts = d.map((v, i) => [10 + i * step, H - (v / max) * (H - 20)]);
    const path = pts.map((pt, i) => (i === 0 ? 'M' : 'L') + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1)).join(' ');
    const last = pts[pts.length - 1];
    const totalP = d.reduce((a, b) => a + b, 0);
    return { pts, path, last, W, H, totalP, d };
  }, [period, totalDashboardToday]);

  // Panier en cours
  const cartLines = useMemo(() => {
    return Object.keys(cart).map((id) => {
      const prod = products.find((p) => p.id === Number(id));
      return prod ? { ...prod, qty: cart[id] } : null;
    }).filter(Boolean);
  }, [cart, products]);

  const totalCartCount = useMemo(() => cartLines.reduce((acc, l) => acc + l.qty, 0), [cartLines]);
  const subtotal = useMemo(() => cartLines.reduce((acc, l) => acc + l.p * l.qty, 0), [cartLines]);
  const discountVal = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const totalToPay = subtotal - discountVal;

  const handleAddToCart = (prod) => {
    const currentQty = cart[prod.id] || 0;
    if (currentQty + 1 > prod.s) {
      showToast(`Stock insuffisant : ${prod.s} max`);
      return;
    }
    setCart((prev) => ({ ...prev, [prod.id]: currentQty + 1 }));
  };

  const handleRemoveFromCart = (id) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[id] > 1) next[id] -= 1;
      else delete next[id];
      return next;
    });
  };

  // --- ENCAISSEMENT : AJOUT AUTOMATIQUE AU PRIX DU DASHBOARD ---
  const handleValidateSale = () => {
    if (!cartLines.length) return;
    const rcv = Number(receivedAmount) || 0;
    if (paymentMethod === 'Espèces' && rcv < totalToPay) {
      showToast(`Montant reçu insuffisant (${fmt(rcv)} FCFA vs ${fmt(totalToPay)} FCFA)`);
      return;
    }
    if (paymentMethod !== 'Espèces' && String(receivedAmount).replace(/\D/g, '').length < 8) {
      showToast(`Entrez le numéro ${paymentMethod} valide (8 chiffres)`);
      return;
    }

    // Décrémenter l'inventaire
    setProducts((prev) =>
      prev.map((p) => {
        const inCart = cart[p.id];
        return inCart ? { ...p, s: p.s - inCart } : p;
      })
    );

    const now = new Date();
    const no = `FAC-${String(initialBaseCount + newSales.length + 1).padStart(4, '0')}`;
    const newSale = {
      no,
      cl: client,
      t: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString('fr-FR'),
      pay: paymentMethod,
      tot: totalToPay,
      sub: subtotal,
      d: discountVal,
      rcv: paymentMethod === 'Espèces' ? rcv : totalToPay,
      chg: paymentMethod === 'Espèces' ? Math.max(0, rcv - totalToPay) : 0,
      items: cartLines.map((l) => ({ n: l.n, p: l.p, q: l.qty })),
      dashboardTotalAfter: totalDashboardToday + totalToPay // Enregistre le nouveau cumul exact
    };

    // Ajout en tête de liste : incrémente immédiatement le dashboard
    setNewSales((prev) => [newSale, ...prev]);
    setLastCompletedSale(newSale);
    setShowSaleModal(true);
    setCart({});
    setDiscount('');
    setReceivedAmount('');
    showToast(`Vente validée ! +${fmt(totalToPay)} FCFA ajoutés aux ventes du jour ✓`);

    // Synchronisation automatique de la vente dans Supabase
    supabase.from('sales').insert({
      ticket_no: no,
      client_name: client,
      time: newSale.t,
      date: newSale.date,
      payment_method: paymentMethod,
      total: totalToPay,
      subtotal: subtotal,
      discount: discountVal,
      amount_received: newSale.rcv,
      change_returned: newSale.chg,
      dashboard_total_after: newSale.dashboardTotalAfter,
      cashier: ROLES[role]?.label || role,
      items: newSale.items
    }).then(({ error }) => {
      if (!error) setDbStatus('connected');
    });

    // Mise à jour des stocks décrémentés dans Supabase
    cartLines.forEach((l) => {
      const prod = products.find((p) => p.id === l.id);
      if (prod) {
        const remaining = Math.max(0, prod.s - l.qty);
        supabase.from('products').update({ s: remaining }).eq('id', l.id).then();
      }
    });
  };

  const handleAddProduct = () => {
    const pSell = Number(newProdSell);
    const pBuy = Number(newProdBuy) || 0;
    const pStock = Number(newProdStock) || 0;
    const pMin = Number(newProdMin) || 5;

    if (!newProdName.trim()) {
      showToast('Le nom du produit est requis');
      return;
    }
    if (!pSell || pSell <= 0) {
      showToast('Le prix de vente doit être supérieur à 0');
      return;
    }

    const newId = Math.max(0, ...products.map((p) => p.id)) + 1;
    setProducts((prev) => [
      ...prev,
      { id: newId, n: newProdName.trim(), p: pSell, buy: pBuy, s: pStock, min: pMin }
    ]);

    // Enregistrement du produit dans Supabase
    supabase.from('products').insert({
      id: newId,
      n: newProdName.trim(),
      p: pSell,
      buy: pBuy,
      s: pStock,
      min: pMin
    }).then(({ error }) => {
      if (!error) setDbStatus('connected');
    });

    setNewProdName('');
    setNewProdBuy('');
    setNewProdSell('');
    setNewProdStock('');
    setShowNewProd(false);
    showToast('Produit ajouté à l\'inventaire ✓');
  };

  const handleAddClient = () => {
    if (!newClientName.trim()) {
      showToast('Le nom du client est requis');
      return;
    }
    const newClientObj = { n: newClientName.trim(), tel: newClientTel.trim() };
    setClients((prev) => [...prev, newClientObj]);
    setClient(newClientName.trim());

    // Enregistrement du client dans Supabase
    supabase.from('clients').insert(newClientObj).then(({ error }) => {
      if (!error) setDbStatus('connected');
    });

    setNewClientName('');
    setNewClientTel('');
    setShowNewClientForm(false);
    showToast('Client enregistré ✓');
  };

  const handleSelectShop = (co, st) => {
    setCurrentShop({ co, st });
    setShowShopModal(false);
    showToast(`Magasin actif : ${st} (${co}) ✓`);
  };

  const handleAddShop = (e) => {
    if (e) e.preventDefault();
    let name = newShopName.trim();
    if (!name) {
      showToast('Saisissez le nom du magasin ou de la boutique');
      return;
    }
    if (name.toLowerCase().startsWith(newShopType.toLowerCase() + ' ')) {
      name = name.slice(newShopType.length + 1).trim();
    }
    const fullName = `${newShopType} ${name}`;

    setShops((prev) => {
      const exists = prev.find((s) => s.co === newShopCompany);
      if (exists) {
        if (exists.st.some((item) => item.toLowerCase() === fullName.toLowerCase())) {
          showToast('Ce point de vente existe déjà');
          return prev;
        }
        return prev.map((s) => s.co === newShopCompany ? { ...s, st: [...s.st, fullName] } : s);
      } else {
        return [...prev, { co: newShopCompany, st: [fullName] }];
      }
    });

    setCurrentShop({ co: newShopCompany, st: fullName });
    setNewShopName('');
    setShowAddShopForm(false);
    setShowShopModal(false);
    showToast(`${fullName} ajouté à ${newShopCompany} ✓`);
  };

  const handleReceiveStock = (productId, qtyToReceive) => {
    const qty = parseInt(qtyToReceive, 10);
    if (!qty || isNaN(qty) || qty <= 0) {
      showToast('Veuillez saisir une quantité valide à réceptionner (ex: 20, 50)');
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newQty = product.s + qty;
    setProducts((prev) => prev.map((x) => x.id === productId ? { ...x, s: newQty } : x));
    supabase.from('products').update({ s: newQty }).eq('id', productId).then();

    setRestockQtyInputs((prev) => ({ ...prev, [productId]: '' }));
    showToast(`+${qty} ${product.n} réceptionné(s) en stock ✓`);
  };

  const lowStockProducts = products.filter((p) => p.s <= p.min);

  // --- RENDU CONDITIONNEL : AUTH ou APP ---
  // Pendant la vérification de session, on affiche un écran de chargement
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0d1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: 48, height: 48,
          background: 'linear-gradient(135deg, #4ddc17, #3ab510)',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="7" width="20" height="14" rx="2" fill="white" opacity="0.3"/>
            <path d="M8 7V5a4 4 0 0 1 8 0v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 12v4m-2-2h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', margin: 0 }}>
          Chargement de StockPilot…
        </p>
      </div>
    );
  }

  // Si pas de session active → afficher la page d'authentification
  if (!supabaseSession) {
    return <AuthPage onAuthSuccess={(session) => setSupabaseSession(session)} />;
  }

  return (
    <div className="app">
      {/* HEADER PRINCIPAL : STYLE FIDÈLE À LA MAQUETTE */}
      <header id="dh">
        <div className="top">
          <div
            className="logo"
            onClick={() => setCurrentTab('accueil')}
            style={{ cursor: 'pointer' }}
            title="Retour à l'accueil"
          >
            <i>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 8 12 3 3 8v8l9 5 9-5z"/>
                <path d="m3 8 9 5 9-5M12 13v8"/>
              </svg>
            </i>
            <span>StockPilot</span>
          </div>

          <div className="header-actions">
            <button className="ib" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Changer de thème">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="ib" onClick={() => setHideAmounts(!hideAmounts)} aria-label="Masquer montants">
              {hideAmounts ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button className="ib" onClick={() => showToast('Aucune nouvelle notification')} aria-label="Notifications">
              <Bell size={18} />
              <span className="dot"></span>
            </button>
            {/* Bouton de déconnexion */}
            <button
              className="ib"
              onClick={handleSignOut}
              aria-label="Se déconnecter"
              title={`Déconnecter (${supabaseSession?.user?.email || ''})`}
              style={{ color: 'rgba(239,68,68,0.8)' }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* LIGNE BOUTIQUE & ADMIN (CHANGER OU AJOUTER UNE BOUTIQUE) */}
        <div id="modeWrap" style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            className="shop"
            id="shop"
            onClick={() => {
              setShowAddShopForm(false);
              setShowShopModal(true);
            }}
            title="Changer de boutique ou ajouter un magasin"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Store size={16} />
              <span>{currentShop.co} · {currentShop.st}</span>
            </div>
            <span style={{ opacity: 0.8 }}>▾</span>
          </button>
          <button className="shop" id="modeB" onClick={() => setShowRoleModal(true)} title="Changer de profil ou code PIN">
            <Shield size={16} />
            <span>{role === 'proprietaire' ? 'Admin' : role === 'gestionnaire' ? 'Gest.' : 'Caissier'}</span>
          </button>
        </div>

        {/* PRIX DU DASHBOARD (VENTES DU JOUR) */}
        <div className="lbl" id="dl">Ventes du jour · {new Date().toLocaleDateString('fr-FR')}</div>
        <div>
          <span className="big" id="hT">{hideAmounts ? '••••••' : fmt(totalDashboardToday)}</span>{' '}
          <small className="big"><small>FCFA</small></small>
          <span className="trend" id="trd">▲ 12 % vs hier</span>
        </div>

        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <span className="trial">Essai gratuit · 14 jours restants</span>
          {currentPermissions.canClose && (
            <button
              className="trial"
              id="closeDay"
              style={{
                border: 0,
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#fff'
              }}
              onClick={() => setShowCloseModal(true)}
              title="Clôturer la journée de caisse"
            >
              Clôturer la journée
            </button>
          )}
        </div>
      </header>

      {/* =========================================================
          VUE 1 : ACCUEIL / TABLEAU DE BORD
          ========================================================= */}
      {currentTab === 'accueil' && (
        <main className="dashboard-grid">
          {/* Ligne 1 : KPI */}
          <div className="grid2">
            <div className="card kpi">
              <div className="t">Ventes réalisées</div>
              <div className="v">{totalSalesCountToday} <small>aujourd’hui</small></div>
            </div>
            <div className="card kpi">
              <div className="t">Panier moyen</div>
              <div className="v">{hideAmounts ? '••••' : fmt(avgBasket)} <small>FCFA</small></div>
            </div>
          </div>

          {/* RACCOURCIS EXACTEMENT COMME SUR L'IMAGE (4 BOUTONS CARRES) */}
          <div className="card short">
            <button className="main" onClick={() => setCurrentTab('vente')} title="Vente / Caisse">
              <span><ShoppingCart size={22} strokeWidth={2.4} /></span>
              Vente
            </button>

            <button
              onClick={() => {
                setModalRestockQty('');
                setShowRestockModal(true);
              }}
              title="Entrée en stock (saisir au clavier sans limitation)"
            >
              <span><ArrowDown size={22} strokeWidth={2.4} /></span>
              Entrée
            </button>

            <button onClick={() => setShowScannerModal(true)} title="Scanner code-barres">
              <span><ScanBarcode size={22} strokeWidth={2.4} /></span>
              Scanner
            </button>

            <button onClick={() => setCurrentTab('stock')} title="Inventaire">
              <span><ClipboardList size={22} strokeWidth={2.4} /></span>
              Inventaire
            </button>
          </div>

          {/* Carte Évolution des ventes */}
          <div className="card">
            <div className="row">
              <h2>Évolution des ventes</h2>
              <div className="seg" role="group" aria-label="Période">
                <button aria-pressed={period === 7} onClick={() => setPeriod(7)}>7 j</button>
                <button aria-pressed={period === 30} onClick={() => setPeriod(30)}>30 j</button>
              </div>
            </div>
            <div style={{ color: 'var(--mute)', fontSize: 13, marginTop: 4 }}>
              Total sur {period} jours : <b>{hideAmounts ? '••••••' : `${fmt(period === 7 ? 924500 : 3850000)} FCFA`}</b>
            </div>

            <div className="chart-container" style={{ marginTop: 8 }}>
              <svg className="chart" viewBox="0 0 320 160">
                <defs>
                  <linearGradient id="chartGradV2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0bb35f" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0bb35f" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Lignes repères avec labels */}
                <line x1="40" x2="306" y1="20" y2="20" stroke="var(--line)" strokeDasharray="3 4" />
                <text x="34" y="24" fontSize="10" fill="var(--mute)" textAnchor="end">{hideAmounts ? '' : '250 k'}</text>
                <line x1="40" x2="306" y1="60" y2="60" stroke="var(--line)" strokeDasharray="3 4" />
                <text x="34" y="64" fontSize="10" fill="var(--mute)" textAnchor="end">{hideAmounts ? '' : '150 k'}</text>
                <line x1="40" x2="306" y1="100" y2="100" stroke="var(--line)" strokeDasharray="3 4" />
                <text x="34" y="104" fontSize="10" fill="var(--mute)" textAnchor="end">{hideAmounts ? '' : '50 k'}</text>

                {/* Courbe remplie et trait */}
                <path
                  d="M40 110 L84 94 L128 116 L172 72 L216 78 L260 58 L304 40 L304 136 L40 136 Z"
                  fill="url(#chartGradV2)"
                />
                <path
                  d="M40 110 L84 94 L128 116 L172 72 L216 78 L260 58 L304 40"
                  fill="none"
                  stroke="#0bb35f"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Point final jaune/vert */}
                <circle cx="304" cy="40" r="5" fill="#4ddc17" stroke="#054a29" strokeWidth="2.5" />
                {!hideAmounts && (
                  <text x="304" y="28" fontSize="11" fontWeight="700" fill="var(--ink)" textAnchor="end">
                    {fmt(totalDashboardToday)}
                  </text>
                )}

                {/* Labels des jours */}
                <text x="40" y="152" fontSize="10" fill="var(--mute)" textAnchor="start">Lun</text>
                <text x="84" y="152" fontSize="10" fill="var(--mute)" textAnchor="middle">Mar</text>
                <text x="128" y="152" fontSize="10" fill="var(--mute)" textAnchor="middle">Mer</text>
                <text x="172" y="152" fontSize="10" fill="var(--mute)" textAnchor="middle">Jeu</text>
                <text x="216" y="152" fontSize="10" fill="var(--mute)" textAnchor="middle">Ven</text>
                <text x="260" y="152" fontSize="10" fill="var(--mute)" textAnchor="middle">Sam</text>
                <text x="304" y="152" fontSize="10" fill="var(--mute)" textAnchor="end">Dim</text>
              </svg>
            </div>
          </div>

          {/* Alerte Produits sous le seuil */}
          <button
            className="alert"
            onClick={() => setCurrentTab('stock')}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: 16,
              background: 'var(--warnbg)',
              color: 'var(--warn)',
              border: '1px solid rgba(180, 83, 9, 0.25)',
              textAlign: 'left',
              width: '100%',
              margin: '12px 0'
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>⚠️</span>
            <span className="grow">
              <b style={{ display: 'block', fontSize: 14 }}>3 produits sous le seuil</b>
              <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.9 }}>
                Sucre 1 kg, Huile végétale 1 L, Riz parfumé 5 kg · touchez pour réapprovisionner
              </span>
            </span>
            <span style={{ fontSize: 18, opacity: 0.8 }}>›</span>
          </button>

          {/* Modes de paiement du jour (Design avec barres individuelles détaillées) */}
          <div className="card">
            <div className="row">
              <h2>Modes de paiement du jour</h2>
            </div>
            <div style={{ marginTop: 10 }}>
              {/* Espèces */}
              <div style={{ padding: '8px 0' }}>
                <div className="row" style={{ marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <i className="sw" style={{ background: '#054a29', width: 9, height: 9, borderRadius: '50%' }}></i>
                    Espèces
                  </span>
                  <span>
                    <b style={{ fontWeight: 800 }}>{hideAmounts ? '••••••' : '95 940'}</b>{' '}
                    <small style={{ color: 'var(--mute)' }}>FCFA</small>{' '}
                    <span style={{ color: 'var(--mute)', fontSize: 12, marginLeft: 6, fontWeight: 600 }}>52 %</span>
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: 'var(--bg)', overflow: 'hidden' }}>
                  <div style={{ width: '52%', height: '100%', background: '#047857', borderRadius: 99 }}></div>
                </div>
              </div>

              {/* Mobile Money */}
              <div style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
                <div className="row" style={{ marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <i className="sw" style={{ background: '#4ddc17', width: 9, height: 9, borderRadius: '50%' }}></i>
                    Mobile Money
                  </span>
                  <span>
                    <b style={{ fontWeight: 800 }}>{hideAmounts ? '••••••' : '88 560'}</b>{' '}
                    <small style={{ color: 'var(--mute)' }}>FCFA</small>{' '}
                    <span style={{ color: 'var(--mute)', fontSize: 12, marginLeft: 6, fontWeight: 600 }}>48 %</span>
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: 'var(--bg)', overflow: 'hidden' }}>
                  <div style={{ width: '48%', height: '100%', background: '#4ddc17', borderRadius: 99 }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Produits les plus vendus */}
          <div className="card">
            <div className="row">
              <h2>Produits les plus vendus</h2>
              <button
                onClick={() => setCurrentTab('stock')}
                style={{
                  color: '#34d399',
                  fontWeight: 700,
                  fontSize: 13,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Voir tout
              </button>
            </div>
            <ul className="list">
              <li>
                <span className="av">S</span>
                <div className="grow">
                  <b>Sucre 1 kg</b>
                  <span>42 vendus · reste 8</span>
                </div>
                <span className="tag bad" style={{ background: '#e11010', color: '#fff', padding: '3px 9px', borderRadius: 99, fontWeight: 700 }}>
                  Stock bas
                </span>
              </li>
              <li>
                <span className="av">H</span>
                <div className="grow">
                  <b>Huile végétale 1 L</b>
                  <span>31 vendus · reste 5</span>
                </div>
                <span className="tag bad" style={{ background: '#e11010', color: '#fff', padding: '3px 9px', borderRadius: 99, fontWeight: 700 }}>
                  Stock bas
                </span>
              </li>
              <li>
                <span className="av">E</span>
                <div className="grow">
                  <b>Eau minérale 1,5 L</b>
                  <span>27 vendus · reste 140</span>
                </div>
                <span className="tag ok" style={{ background: '#4ddc17', color: '#0a2e12', padding: '3px 9px', borderRadius: 99, fontWeight: 700 }}>
                  OK
                </span>
              </li>
            </ul>
          </div>
        </main>
      )}

      {/* =========================================================
          VUE 2 : CAISSE & VENTE
          ========================================================= */}
      {currentTab === 'vente' && (
        <main className="pos-layout">
          {/* Catalogue */}
          <div className="card pos-catalog">
            <div className="row">
              <h2>Catalogue Produits</h2>
              <span className="tag ok">{products.length} articles</span>
            </div>

            <div className="search-bar-wrap" style={{ marginTop: 12, marginBottom: 14, display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} className="search-icon-inside" />
                <input
                  className="fld fld-with-icon"
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                className="qb"
                onClick={() => setShowScannerModal(true)}
                title="Biper un article avec le scanner"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0 12px',
                  background: 'var(--yellow)',
                  color: '#111',
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}
              >
                <ScanBarcode size={18} />
                <span className="hide-mobile-sm">Scanner</span>
              </button>
            </div>

            <div className="product-grid">
              {products
                .filter((p) => p.n.toLowerCase().includes(search.toLowerCase()))
                .map((p) => (
                  <button
                    key={p.id}
                    className="product-card-btn"
                    onClick={() => handleAddToCart(p)}
                    disabled={p.s <= 0}
                  >
                    <div className="prod-badge-circle">{p.n[0]}</div>
                    <div className="prod-info">
                      <b>{p.n}</b>
                      <div className="prod-price">{fmt(p.p)} FCFA</div>
                      <div className="prod-stock" style={{ color: p.s <= p.min ? 'var(--bad)' : 'var(--mute)' }}>
                        {p.s <= 0
                          ? 'Rupture'
                          : currentPermissions.canViewStock
                            ? `Stock : ${p.s}${cart[p.id] ? ` (${cart[p.id]})` : ''}`
                            : cart[p.id] ? `Dans panier (${cart[p.id]})` : 'En rayon'}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Panier & Checkout */}
          <div className="card pos-checkout">
            <div className="row">
              <h2>Panier en cours</h2>
              {totalCartCount > 0 && (
                <span className="tag ok">{totalCartCount} article{totalCartCount > 1 ? 's' : ''}</span>
              )}
            </div>

            <div className="cart-scroll-area">
              {cartLines.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--mute)' }}>
                  <ShoppingCart size={36} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <p>Panier vide.<br />Touchez un produit pour l'ajouter.</p>
                </div>
              ) : (
                cartLines.map((l) => (
                  <div className="ln" key={l.id}>
                    <div className="grow">
                      <b>{l.n}</b>
                      <span>{fmt(l.p)} × {l.qty} = {fmt(l.p * l.qty)} FCFA</span>
                    </div>
                    <div className="qty">
                      <button onClick={() => handleRemoveFromCart(l.id)}><Minus size={14} /></button>
                      <b>{l.qty}</b>
                      <button className="pl" onClick={() => handleAddToCart(l)}><Plus size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="tr" style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
              <span>Sous-total</span>
              <b>{fmt(subtotal)} FCFA</b>
            </div>
            {discountVal > 0 && (
              <div className="tr" style={{ color: 'var(--bad)' }}>
                <span>Remise</span>
                <b>− {fmt(discountVal)} FCFA</b>
              </div>
            )}
            <div className="tr t" style={{ fontSize: 18, marginTop: 4 }}>
              <span>Total à payer</span>
              <span style={{ color: 'var(--blue)' }}>{fmt(totalToPay)} FCFA</span>
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="fl">Client</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <select className="fld" value={client} onChange={(e) => setClient(e.target.value)}>
                  {clients.map((c, i) => (
                    <option key={i} value={c.n}>{c.n}</option>
                  ))}
                </select>
                <button
                  className="qb"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  + Nouveau
                </button>
              </div>

              {showNewClientForm && (
                <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 12, marginTop: 8 }}>
                  <input
                    className="fld"
                    placeholder="Nom du client"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                  />
                  <input
                    className="fld"
                    placeholder="Numéro de téléphone"
                    value={newClientTel}
                    onChange={(e) => setNewClientTel(e.target.value)}
                    style={{ marginTop: 6 }}
                  />
                  <button className="cta" onClick={handleAddClient} style={{ padding: 10, fontSize: 13 }}>
                    Enregistrer ce client
                  </button>
                </div>
              )}

              <label className="fl">Remise en FCFA (facultatif)</label>
              <input
                className="fld"
                type="number"
                min="0"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />

              <div className="fl">Mode de règlement</div>
              <div className="pm">
                {['Espèces', 'Flooz', 'T-Money'].map((m) => (
                  <button
                    key={m}
                    aria-pressed={paymentMethod === m}
                    onClick={() => { setPaymentMethod(m); setReceivedAmount(''); }}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <label className="fl">
                {paymentMethod === 'Espèces' ? 'Montant reçu en espèces (FCFA)' : `Numéro ${paymentMethod} du client`}
              </label>
              <input
                className="fld"
                type={paymentMethod === 'Espèces' ? 'number' : 'tel'}
                placeholder={paymentMethod === 'Espèces' ? String(totalToPay) : 'Ex: 90123456'}
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
              />

              {paymentMethod === 'Espèces' && Number(receivedAmount) >= totalToPay && totalToPay > 0 && (
                <div style={{ marginTop: 8, fontWeight: 700, color: 'var(--ok)' }}>
                  Monnaie à rendre : {fmt(Number(receivedAmount) - totalToPay)} FCFA
                </div>
              )}

              <button
                className="cta"
                disabled={cartLines.length === 0}
                onClick={handleValidateSale}
              >
                Valider l'encaissement de {fmt(totalToPay)} FCFA →
              </button>
            </div>
          </div>
        </main>
      )}

      {/* =========================================================
          VUE 3 : INVENTAIRE & STOCKS PLEINE LARGEUR (Masqué pour le Caissier)
          ========================================================= */}
      {currentTab === 'stock' && currentPermissions.canViewStock && (
        <main className="fullwidth-layout">
          <div className="card">
            <div className="row">
              <div>
                <h2>Inventaire des Produits</h2>
                <span style={{ fontSize: 13, color: 'var(--mute)' }}>{products.length} articles en gestion</span>
              </div>
              {currentPermissions.canEditStock && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="qb"
                    style={{ borderColor: 'var(--pri)', color: 'var(--pri)', fontWeight: 600 }}
                    onClick={() => {
                      setModalRestockQty('');
                      setShowRestockModal(true);
                    }}
                  >
                    + Entrée de stock
                  </button>
                  <button className="qb" onClick={() => setShowNewProd(!showNewProd)}>
                    {showNewProd ? 'Fermer' : '+ Nouveau produit'}
                  </button>
                </div>
              )}
            </div>

            {showNewProd && (
              <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 14, marginTop: 14 }}>
                <input
                  className="fld"
                  placeholder="Nom de l'article"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                />
                <div className="input-grid-2" style={{ marginTop: 8 }}>
                  <input
                    className="fld"
                    type="number"
                    placeholder="Prix d'achat FCFA"
                    value={newProdBuy}
                    onChange={(e) => setNewProdBuy(e.target.value)}
                  />
                  <input
                    className="fld"
                    type="number"
                    placeholder="Prix de vente FCFA"
                    value={newProdSell}
                    onChange={(e) => setNewProdSell(e.target.value)}
                  />
                </div>
                <div className="input-grid-2" style={{ marginTop: 8 }}>
                  <input
                    className="fld"
                    type="number"
                    placeholder="Quantité en stock initial"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                  />
                  <input
                    className="fld"
                    type="number"
                    placeholder="Seuil minimum d'alerte"
                    value={newProdMin}
                    onChange={(e) => setNewProdMin(e.target.value)}
                  />
                </div>
                <button className="cta" onClick={handleAddProduct} style={{ padding: 12, fontSize: 14 }}>
                  Enregistrer l'article dans l'inventaire
                </button>
              </div>
            )}

            {/* GRILLE D'INVENTAIRE */}
            <div className="stock-full-grid">
              {products.map((p) => {
                const isLow = p.s <= p.min;
                return (
                  <div className="stock-card-item" key={p.id}>
                    <div className="stock-item-header">
                      <span className="av">{p.n[0]}</span>
                      <div className="grow">
                        <b>{p.n}</b>
                        <span className="stock-price-tag">Vente : {fmt(p.p)} FCFA</span>
                      </div>
                      <span className={`tag ${isLow ? 'bad' : 'ok'}`}>
                        {p.s} en stock
                      </span>
                    </div>

                    <div className="stock-item-body">
                      {currentPermissions.canViewBuy && (
                        <div className="stock-meta-row">
                          <span>Achat fournisseur :</span>
                          <b>{fmt(p.buy)} FCFA</b>
                        </div>
                      )}
                      <div className="stock-meta-row">
                        <span>Seuil d'alerte :</span>
                        <span>{p.min} unités</span>
                      </div>

                      <div className="bar" style={{ height: 8, margin: '10px 0 12px' }}>
                        <i style={{ width: `${Math.min(100, (p.s / (p.min * 3)) * 100)}%`, background: isLow ? 'var(--bad)' : 'var(--blue)' }}></i>
                      </div>

                      {currentPermissions.canEditStock && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                          <input
                            type="number"
                            min="1"
                            className="fld"
                            style={{ width: '85px', padding: '8px 6px', textAlign: 'center', fontSize: 13 }}
                            placeholder="Qté"
                            value={restockQtyInputs[p.id] !== undefined ? restockQtyInputs[p.id] : ''}
                            onChange={(e) => setRestockQtyInputs({ ...restockQtyInputs, [p.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleReceiveStock(p.id, restockQtyInputs[p.id]);
                              }
                            }}
                          />
                          <button
                            className="qb"
                            style={{ flex: 1, padding: '8px 10px', fontSize: 13, fontWeight: 700 }}
                            onClick={() => handleReceiveStock(p.id, restockQtyInputs[p.id])}
                          >
                            + Réceptionner
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* =========================================================
          VUE 4 : RAPPORTS ET CLÔTURES (Masqué si non autorisé)
          ========================================================= */}
      {currentTab === 'reports' && currentPermissions.canViewReports && (
        <main className="fullwidth-layout">
          <div className="card">
            <h2>Synthèse Financière du Jour</h2>
            <div className="grid2" style={{ marginTop: 12 }}>
              <div className="card kpi" style={{ margin: 0 }}>
                <div className="t">Chiffre d'affaires encaissé total</div>
                <div className="v">{fmt(totalDashboardToday)} <small>FCFA</small></div>
              </div>
              <div className="card kpi" style={{ margin: 0 }}>
                <div className="t">Transactions réalisées</div>
                <div className="v">{totalSalesCountToday} <small>tickets</small></div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <h2>Historique Complet des Ventes Récentes</h2>
            {newSales.length === 0 ? (
              <p style={{ color: 'var(--mute)', margin: '14px 0', fontSize: 13 }}>
                Aucune vente récente enregistrée. Total initial de départ : <b>{fmt(initialBaseAmount)} FCFA</b>.
              </p>
            ) : (
              <ul className="list">
                {newSales.map((s, idx) => (
                  <li key={idx}>
                    <span className="av"><Receipt size={18} /></span>
                    <div className="grow">
                      <b>{s.no} · {s.cl}</b>
                      <span>{s.date} à {s.t} · {s.pay}</span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <b style={{ whiteSpace: 'nowrap', fontSize: 16 }}>{fmt(s.tot)} FCFA</b>
                      <button
                        className="btn-icon-receipt"
                        onClick={() => downloadReceipt(s, showToast)}
                        title={`Télécharger le reçu PDF ${s.no}`}
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <h2>Clôtures de Caisse Archivées</h2>
            <ul className="list">
              {closedDays.map((c, idx) => (
                <li key={idx}>
                  <div className="grow">
                    <b>Journée du {c.date}</b>
                    <span>{c.n} ventes · clôturé par {c.by}</span>
                  </div>
                  <b>{fmt(c.tot)} FCFA</b>
                </li>
              ))}
            </ul>
          </div>
        </main>
      )}

      {/* =========================================================
          VUE 5 : PLUS / CLIENTS ET PARAMÈTRES
          ========================================================= */}
      {currentTab === 'plus' && (
        <main className="fullwidth-layout">
          <div className="card">
            <h2>Carnet d'Adresses Clients</h2>
            <ul className="list">
              {clients.map((c, idx) => (
                <li key={idx}>
                  <span className="av"><User size={18} /></span>
                  <div className="grow">
                    <b>{c.n}</b>
                    <span>{c.tel || 'Aucun numéro de téléphone enregistré'}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* SÉLECTEUR DE PROFIL */}
          <div className="card" style={{ marginTop: 14 }}>
            <h2>Changer de Profil Utilisateur</h2>
            <p style={{ fontSize: 13, color: 'var(--mute)', margin: '8px 0 14px' }}>
              Profil actif : <b>{ROLES[role].label}</b> ({ROLES[role].badge})
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {Object.keys(ROLES).map((k) => (
                <button
                  key={k}
                  className="qb"
                  style={{
                    padding: 12,
                    background: role === k ? 'var(--blue)' : 'var(--bg)',
                    color: role === k ? '#fff' : 'var(--ink)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onClick={() => handleSelectRole(k)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {k === 'proprietaire' && role !== 'proprietaire' && <Lock size={12} />}
                    {k === 'proprietaire' && role === 'proprietaire' && <ShieldCheck size={12} />}
                    <b>{ROLES[k].label}</b>
                  </div>
                  <span style={{ fontSize: 10, opacity: 0.8 }}>
                    {k === 'caissier' ? 'Vente seule' : k === 'gestionnaire' ? 'Stock & Caisse' : 'Accès Total'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* CENTRE DE DÉLÉGATION DES DROITS : RÉSERVÉ À L'ADMINISTRATEUR */}
          {role === 'proprietaire' ? (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="av" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669' }}>
                    <ShieldCheck size={20} />
                  </span>
                  <div>
                    <h2 style={{ margin: 0 }}>Centre de Délégation des Droits</h2>
                    <span style={{ fontSize: 13, color: 'var(--mute)' }}>
                      En tant qu'Administrateur, vous décidez qui peut voir quoi dans l'application.
                    </span>
                  </div>
                </div>
                <button
                  className="qb"
                  onClick={() => setShowChangePinModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                >
                  <KeyRound size={14} />
                  <span>Changer PIN Admin</span>
                </button>
              </div>

              {/* SECTION RÔLE CAISSIER */}
              <div className="perm-role-box">
                <div className="perm-role-header">
                  <div>
                    <b style={{ fontSize: 15 }}>Rôle : {ROLES.caissier.label}</b>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--mute)' }}>
                      Le <b>STOCK</b> est masqué au caissier par défaut. Activez uniquement les droits délégués.
                    </p>
                  </div>
                  <span className="tag" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--blue)' }}>
                    {Object.values(permissions.caissier || {}).filter(Boolean).length} droit(s) accordé(s)
                  </span>
                </div>

                {PERMISSION_DEFINITIONS.map((perm) => {
                  const isActive = !!permissions.caissier?.[perm.key];
                  return (
                    <div className="perm-row" key={perm.key}>
                      <div className="perm-label-wrap">
                        <b>{perm.label}</b>
                        <span>{perm.desc}</span>
                      </div>
                      <button
                        className={`perm-toggle-btn ${isActive ? 'active' : 'inactive'}`}
                        onClick={() => handleTogglePermission('caissier', perm.key)}
                        title="Cliquer pour autoriser ou révoquer"
                      >
                        {isActive ? <Check size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
                        <span>{isActive ? 'Autorisé' : 'Masqué / Bloqué'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* SECTION RÔLE GESTIONNAIRE */}
              <div className="perm-role-box" style={{ marginTop: 14 }}>
                <div className="perm-role-header">
                  <div>
                    <b style={{ fontSize: 15 }}>Rôle : {ROLES.gestionnaire.label}</b>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--mute)' }}>
                      Gestion courante de boutique : stocks, inventaires, clôtures de caisse.
                    </p>
                  </div>
                  <span className="tag ok">
                    {Object.values(permissions.gestionnaire || {}).filter(Boolean).length} droit(s) accordé(s)
                  </span>
                </div>

                {PERMISSION_DEFINITIONS.map((perm) => {
                  const isActive = !!permissions.gestionnaire?.[perm.key];
                  return (
                    <div className="perm-row" key={perm.key}>
                      <div className="perm-label-wrap">
                        <b>{perm.label}</b>
                        <span>{perm.desc}</span>
                      </div>
                      <button
                        className={`perm-toggle-btn ${isActive ? 'active' : 'inactive'}`}
                        onClick={() => handleTogglePermission('gestionnaire', perm.key)}
                        title="Cliquer pour autoriser ou révoquer"
                      >
                        {isActive ? <Check size={14} strokeWidth={2.5} /> : <X size={14} strokeWidth={2.5} />}
                        <span>{isActive ? 'Autorisé' : 'Masqué / Bloqué'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  className="qb"
                  onClick={handleResetPermissions}
                  style={{ color: 'var(--mute)', fontSize: 12 }}
                >
                  Rétablir les permissions d'origine
                </button>
              </div>
            </div>
          ) : (
            /* PANNEAU VERROUILLÉ POUR NON-ADMIN (CAISSIER OU GESTIONNAIRE) */
            <div className="card" style={{ marginTop: 14 }}>
              <div className="admin-lock-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d97706', fontWeight: 700 }}>
                  <Lock size={18} />
                  <span>Délégation des Droits & Contrôle d'Accès Sécurisé</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
                  <b>Seul l'Administrateur peut déléguer qui peut voir quoi dans l'application.</b><br />
                  Vous êtes actuellement connecté avec le profil : <b>{ROLES[role].label}</b>.
                </p>
              </div>

              <h3 style={{ fontSize: 14, margin: '14px 0 8px' }}>Autorisations actives pour votre profil :</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PERMISSION_DEFINITIONS.map((perm) => {
                  const isGranted = !!currentPermissions[perm.key];
                  return (
                    <div
                      key={perm.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--bg)',
                        borderRadius: 10
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <b style={{ fontSize: 13, color: 'var(--ink)' }}>{perm.label}</b>
                        <span style={{ fontSize: 11, color: 'var(--mute)' }}>{perm.desc}</span>
                      </div>
                      <span
                        className={`tag ${isGranted ? 'ok' : 'bad'}`}
                        style={{ fontSize: 11, padding: '4px 9px' }}
                      >
                        {isGranted ? '✓ Autorisé' : '✗ Masqué / Refusé'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                className="cta"
                onClick={() => handleSelectRole('proprietaire')}
                style={{
                  marginTop: 16,
                  padding: 12,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <KeyRound size={16} />
                <span>Déverrouiller Administrateur avec le Code PIN</span>
              </button>
            </div>
          )}
        </main>
      )}

      {/* MODAL CLÔTURE DE JOURNÉE */}
      {showCloseModal && (
        <div className="ov">
          <div className="card modal-content-wrap">
            <h2>Clôturer la journée ?</h2>
            <p style={{ margin: '14px 0', color: 'var(--mute)', fontSize: 14, lineHeight: 1.6 }}>
              Total encaissé aujourd'hui : <b>{fmt(totalDashboardToday)} FCFA</b> ({totalSalesCountToday} ventes).<br />
              Toutes les transactions seront archivées dans l'historique et la caisse repartira à 0 FCFA.
            </p>
            <button
              className="cta"
              onClick={() => {
                const now = new Date();
                const closureObj = {
                  date: now.toLocaleDateString('fr-FR'),
                  tot: totalDashboardToday,
                  n: totalSalesCountToday,
                  by: ROLES[role].label
                };
                setClosedDays((prev) => [closureObj, ...prev]);
                supabase.from('cash_closures').insert({
                  date: closureObj.date,
                  tot: closureObj.tot,
                  n: closureObj.n,
                  closed_by: closureObj.by
                }).then();
                setInitialBaseAmount(0);
                setInitialBaseCount(0);
                setNewSales([]);
                setShowCloseModal(false);
                showToast('Journée clôturée et archivée avec succès ✓ Caisse remise à 0 FCFA');
              }}
            >
              Confirmer la clôture
            </button>
            <button
              className="cta"
              style={{ background: 'var(--bg)', color: 'var(--ink)', marginTop: 8 }}
              onClick={() => setShowCloseModal(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL SUCCÈS VENTE — AVEC PRIX TOTAL DU DASHBOARD & REÇU DIRECT
          ========================================================= */}
      {showSaleModal && lastCompletedSale && (
        <div className="ov">
          <div className="card modal-content-wrap">
            <div className="chk"><CheckCircle2 size={36} /></div>
            <h2>Paiement validé !</h2>
            
            {/* RÉCAPITULATIF PRÉCIS DE LA VENTE */}
            <div style={{ margin: '14px 0', background: 'var(--bg)', padding: 14, borderRadius: 14, textAlign: 'left', fontSize: 13, lineHeight: 1.8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--mute)' }}>Référence :</span>
                <b>{lastCompletedSale.no}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--mute)' }}>Client :</span>
                <b>{lastCompletedSale.cl}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--mute)' }}>Règlement :</span>
                <b>{lastCompletedSale.pay}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 6 }}>
                <span style={{ fontWeight: 700 }}>Montant de cette vente :</span>
                <b style={{ color: 'var(--blue)', fontSize: 16 }}>+{fmt(lastCompletedSale.tot)} FCFA</b>
              </div>
              {lastCompletedSale.pay === 'Espèces' && lastCompletedSale.chg > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ok)' }}>
                  <span>Monnaie rendue :</span>
                  <b>{fmt(lastCompletedSale.chg)} FCFA</b>
                </div>
              )}
            </div>

            {/* ENCART SPÉCIAL : NOUVEAU TOTAL DU DASHBOARD EN DIRECT */}
            <div style={{ background: 'var(--okbg)', color: 'var(--ok)', padding: 12, borderRadius: 14, marginBottom: 12, textAlign: 'center' }}>
              <span style={{ fontSize: 12, display: 'block', fontWeight: 600 }}>Nouveau total des ventes du jour sur le dashboard :</span>
              <b style={{ fontSize: 20 }}>{fmt(totalDashboardToday)} FCFA</b>
              <small style={{ display: 'block', fontSize: 11, marginTop: 2 }}>
                ({fmt(initialBaseAmount)} initial + {fmt(newSalesSum)} nouvelles ventes)
              </small>
            </div>

            {/* BOUTON 1 : TÉLÉCHARGER LE REÇU CLIENT DIRECTEMENT */}
            <button
              className="cta"
              style={{ background: 'var(--blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}
              onClick={() => downloadReceipt(lastCompletedSale, showToast)}
            >
              <Download size={18} />
              <span>Télécharger le reçu client (PDF)</span>
            </button>

            {/* BOUTON 2 : VOIR SUR LE DASHBOARD & NOUVELLE VENTE */}
            <button
              className="cta"
              style={{ background: 'var(--yellow)', color: '#111', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => {
                setShowSaleModal(false);
                setCurrentTab('accueil'); // Bascule immédiatement vers l'accueil où le total est déjà actualisé !
                showToast(`Dashboard actualisé : ${fmt(totalDashboardToday)} FCFA (${totalSalesCountToday} ventes)`);
              }}
            >
              <span>Voir sur le Dashboard (+{fmt(lastCompletedSale.tot)} FCFA)</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* NAVIGATION PRINCIPALE (BOTTOM BAR SUR MOBILE & SIDEBAR ELEGANTE SUR DESKTOP) */}
      <nav aria-label="Navigation principale">
        {/* LOGO DE MARQUE (EN TÊTE DE LA SIDEBAR SUR DESKTOP) */}
        <div className="nav-brand" onClick={() => setCurrentTab('accueil')} title="StockPilot - Retour à l'accueil">
          <div className="nav-brand-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8 12 3 3 8v8l9 5 9-5z"/>
              <path d="m3 8 9 5 9-5M12 13v8"/>
            </svg>
          </div>
          <div className="nav-brand-text">
            <span className="nav-brand-title">StockPilot</span>
            <span className="nav-brand-sub">SaaS v2.1</span>
          </div>
        </div>

        <button
          className="nav-btn-accueil"
          aria-current={currentTab === 'accueil' ? 'page' : undefined}
          onClick={() => setCurrentTab('accueil')}
          title="Accueil"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 10.5 12 3l9 7.5"/>
            <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>
          </svg>
          <span>Accueil</span>
        </button>

        <button
          className="nav-btn-stock"
          aria-current={currentTab === 'stock' ? 'page' : undefined}
          onClick={() => setCurrentTab('stock')}
          title="Gestion du Stock"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 8 12 3 3 8v8l9 5 9-5z"/>
            <path d="m3 8 9 5 9-5M12 13v8"/>
          </svg>
          <span>Stock</span>
        </button>

        <button
          className="sell nav-btn-sell"
          aria-current={currentTab === 'vente' ? 'page' : undefined}
          onClick={() => setCurrentTab('vente')}
          aria-label="Nouvelle vente"
          title="Nouvelle vente / Caisse"
        >
          <em>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="20" r="1.4"/>
              <circle cx="18" cy="20" r="1.4"/>
              <path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6"/>
            </svg>
          </em>
          <span>Vente</span>
        </button>

        <button
          className="nav-btn-reports"
          aria-current={currentTab === 'reports' ? 'page' : undefined}
          onClick={() => setCurrentTab('reports')}
          title="Rapports financiers et statistiques"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 3v18h18"/>
            <path d="M18 17V9M13 17V5M8 17v-3"/>
          </svg>
          <span>Rapports</span>
        </button>

        <button
          className="nav-btn-plus"
          aria-current={currentTab === 'plus' ? 'page' : undefined}
          onClick={() => setCurrentTab('plus')}
          title="Plus d'options et paramètres"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
          <span>Plus</span>
        </button>
      </nav>

      {/* MODAL SÉLECTEUR DE PROFIL RESPONSIVE & MOBILE-FIRST */}
      {showRoleModal && (
        <div className="ov">
          <div className="card modal-content-wrap role-modal-mobile">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="av" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--blue)' }}>
                  <ArrowRightLeft size={20} />
                </span>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>Changer de Profil</h2>
                  <span style={{ fontSize: 12, color: 'var(--mute)' }}>Basculez entre Gestionnaire, Admin et Caissier</span>
                </div>
              </div>
              <button
                className="ib"
                style={{ background: 'var(--bg)', color: 'var(--ink)' }}
                onClick={() => setShowRoleModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="role-options-list">
              {/* CARTE GESTIONNAIRE */}
              <button
                className={`role-option-card ${role === 'gestionnaire' ? 'selected' : ''}`}
                onClick={() => {
                  setRole('gestionnaire');
                  setShowRoleModal(false);
                  showToast('Profil activé : Gestionnaire (Accès Stocks, Réassorts & Clôtures) ✓');
                }}
              >
                <div className="role-opt-icon gestionnaire-icon">
                  <Briefcase size={22} />
                </div>
                <div className="role-opt-info">
                  <div className="role-opt-header">
                    <b>Gestionnaire</b>
                    {role === 'gestionnaire' && <span className="tag ok">Actif</span>}
                  </div>
                  <p>Accès complet aux Stocks, Réassorts, Inventaire, Rapports et Clôtures de caisse.</p>
                </div>
              </button>

              {/* CARTE ADMINISTRATEUR */}
              <button
                className={`role-option-card ${role === 'proprietaire' ? 'selected' : ''}`}
                onClick={() => {
                  setShowRoleModal(false);
                  handleSelectRole('proprietaire');
                }}
              >
                <div className="role-opt-icon admin-icon">
                  <Crown size={22} />
                </div>
                <div className="role-opt-info">
                  <div className="role-opt-header">
                    <b>Administrateur</b>
                    {role === 'proprietaire' ? (
                      <span className="tag ok">Actif</span>
                    ) : (
                      <span className="tag" style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#d97706' }}>
                        <Lock size={10} style={{ marginRight: 3 }} /> PIN Requis
                      </span>
                    )}
                  </div>
                  <p>Contrôle total, délégation exclusive des droits, marges et configuration du magasin.</p>
                </div>
              </button>

              {/* CARTE CAISSIER */}
              <button
                className={`role-option-card ${role === 'caissier' ? 'selected' : ''}`}
                onClick={() => {
                  setRole('caissier');
                  setShowRoleModal(false);
                  showToast('Profil activé : Caissier (Ventes & Caisse, Stock masqué)');
                }}
              >
                <div className="role-opt-icon caissier-icon">
                  <User size={22} />
                </div>
                <div className="role-opt-info">
                  <div className="role-opt-header">
                    <b>Caissier</b>
                    {role === 'caissier' && <span className="tag ok">Actif</span>}
                  </div>
                  <p>Vente au comptoir et encaissement. Le Stock et les Rapports restent masqués.</p>
                </div>
              </button>
            </div>

            <button
              className="qb"
              style={{ width: '100%', marginTop: 14, padding: 12, textAlign: 'center' }}
              onClick={() => setShowRoleModal(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* MODAL SCANNER CODE-BARRES / QR INTERACTIF (MOBILE-FACE) */}
      {showScannerModal && (
        <div className="ov">
          <div className="card modal-content-wrap" style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="av" style={{ background: 'var(--blue)', color: '#fff' }}>
                  <ScanBarcode size={20} />
                </span>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>Scanner Code-Barres / QR</h2>
                  <span style={{ fontSize: 12, color: 'var(--mute)' }}>Lecteur optique & bipeur de caisse</span>
                </div>
              </div>
              <button
                className="ib"
                style={{ background: 'var(--bg)', color: 'var(--ink)' }}
                onClick={() => setShowScannerModal(false)}
              >
                ✕
              </button>
            </div>

            {/* VISEUR DE CAMÉRA OPTIQUE ANIMÉ */}
            <div className="scanner-viewfinder">
              <div className="scanner-laser"></div>
              <div className="scanner-reticle">
                <ScanBarcode size={44} strokeWidth={1.5} style={{ opacity: 0.35, color: '#fff' }} />
                <span style={{ color: '#10b981', fontSize: 12, fontWeight: 700, marginTop: 8 }}>
                  Viseur actif · Pointez le code-barres
                </span>
              </div>
            </div>

            {/* BISEUR DIRECT D'ARTICLES (SIMULATION RAPIDE DE DOUCHETTE) */}
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--mute)', display: 'block', marginBottom: 6 }}>
                Biper instantanément un article au panier :
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {products.map((p) => (
                  <button
                    key={p.id}
                    className="qb"
                    disabled={p.s <= 0}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: 'var(--bg)',
                      border: '1px solid var(--line)'
                    }}
                    onClick={() => {
                      handleAddToCart(p);
                      showToast(`Bip ! +1 ${p.n} ajouté au panier ✓`);
                    }}
                  >
                    <b style={{ fontSize: 13, color: 'var(--ink)' }}>{p.n}</b>
                    <span style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700 }}>{fmt(p.p)} FCFA</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                className="qb"
                style={{ flex: 1, padding: 12 }}
                onClick={() => setShowScannerModal(false)}
              >
                Fermer
              </button>
              <button
                className="cta"
                style={{ flex: 1.5, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => {
                  setShowScannerModal(false);
                  setCurrentTab('vente');
                }}
              >
                <ShoppingCart size={16} />
                <span>Voir le Panier ({totalCartCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SÉCURISÉ : SAISIE DU CODE PIN ADMINISTRATEUR */}
      {showPinModal && (
        <div className="ov">
          <div className="card modal-content-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span className="av" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--blue)' }}>
                <KeyRound size={22} />
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>Accès Administrateur</h2>
                <span style={{ fontSize: 12, color: 'var(--mute)' }}>Authentification requise pour gérer les délégations</span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--mute)', margin: '8px 0 16px', lineHeight: 1.5 }}>
              Entrez le code PIN Administrateur pour modifier les autorisations et déléguer les droits d'accès.<br />
              <small style={{ color: 'var(--blue)', fontWeight: 600 }}>Code PIN par défaut : 1234</small>
            </p>

            <input
              type="password"
              className="fld pin-input-large"
              placeholder="••••"
              maxLength={8}
              autoFocus
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerifyPin();
              }}
            />

            {pinError && (
              <div style={{ color: 'var(--bad)', fontSize: 12, marginTop: 8, fontWeight: 600, textAlign: 'center' }}>
                {pinError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                className="qb"
                style={{ flex: 1, padding: 12 }}
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput('');
                  setPinError('');
                }}
              >
                Annuler
              </button>
              <button
                className="cta"
                style={{ flex: 1.5, padding: 12 }}
                onClick={handleVerifyPin}
              >
                Déverrouiller
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFIER LE CODE PIN ADMINISTRATEUR */}
      {showChangePinModal && (
        <div className="ov">
          <div className="card modal-content-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span className="av" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669' }}>
                <ShieldCheck size={22} />
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>Modifier le PIN Admin</h2>
                <span style={{ fontSize: 12, color: 'var(--mute)' }}>Sécurisation du profil Administrateur</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--mute)', display: 'block', marginBottom: 4 }}>
                  Ancien Code PIN (Actuel : {adminPin})
                </label>
                <input
                  type="password"
                  className="fld"
                  placeholder="Ancien code PIN..."
                  value={oldPinInput}
                  onChange={(e) => setOldPinInput(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--mute)', display: 'block', marginBottom: 4 }}>
                  Nouveau Code PIN (4 chiffres ou plus)
                </label>
                <input
                  type="password"
                  className="fld"
                  placeholder="Nouveau code PIN..."
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                />
              </div>

              {changePinError && (
                <div style={{ color: 'var(--bad)', fontSize: 12, fontWeight: 600 }}>
                  {changePinError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                className="qb"
                style={{ flex: 1, padding: 12 }}
                onClick={() => {
                  setShowChangePinModal(false);
                  setOldPinInput('');
                  setNewPinInput('');
                  setChangePinError('');
                }}
              >
                Annuler
              </button>
              <button
                className="cta"
                style={{ flex: 1.5, padding: 12 }}
                onClick={handleChangePin}
              >
                Enregistrer le PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MULTI-BOUTIQUES ET MAGASINS */}
      {showShopModal && (
        <div className="ov" onClick={() => setShowShopModal(false)}>
          <div className="card modal-content-wrap" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="av" style={{ background: 'rgba(77, 220, 23, 0.15)', color: '#4ddc17' }}>
                  <Store size={22} />
                </span>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>Entreprise & Magasins</h2>
                  <span style={{ fontSize: 12, color: 'var(--mute)' }}>Changez de magasin ou ajoutez-en un</span>
                </div>
              </div>
              <button
                className="qb"
                style={{ width: 32, height: 32, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setShowShopModal(false)}
              >
                ✕
              </button>
            </div>

            {/* LISTE DES BOUTIQUES & MAGASINS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '14px 0', maxHeight: '55vh', overflowY: 'auto' }}>
              {shops.map((s, idx) => (
                <div key={idx} style={{ background: 'var(--bg)', borderRadius: 12, padding: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Briefcase size={14} />
                    <span>{s.co}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {s.st.map((store, sIdx) => {
                      const isActive = currentShop.co === s.co && currentShop.st === store;
                      return (
                        <button
                          key={sIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: isActive ? '1.5px solid #4ddc17' : '1px solid var(--border)',
                            background: isActive ? 'rgba(77, 220, 23, 0.12)' : 'var(--card-bg, #fff)',
                            color: 'var(--text)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontWeight: isActive ? 700 : 500,
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => handleSelectShop(s.co, store)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Store size={16} color={isActive ? '#4ddc17' : 'var(--mute)'} />
                            <span>{store}</span>
                          </div>
                          {isActive ? (
                            <span style={{ fontSize: 11, background: '#4ddc17', color: '#052e0a', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>
                              Actif
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--mute)' }}>Choisir</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* FORMULAIRE D'AJOUT D'UN NOUVEAU POINT DE VENTE */}
            {!showAddShopForm ? (
              <button
                className="qb"
                style={{ width: '100%', padding: 12, fontWeight: 700, borderColor: '#4ddc17', color: 'var(--text)' }}
                onClick={() => setShowAddShopForm(true)}
              >
                + Ajouter une boutique ou un magasin
              </button>
            ) : (
              <form onSubmit={handleAddShop} style={{ background: 'var(--bg)', padding: 12, borderRadius: 12, border: '1px dashed #4ddc17', marginTop: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--text)' }}>
                  Nouveau point de vente
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--mute)', display: 'block', marginBottom: 3 }}>
                      Entreprise / Enseigne parente
                    </label>
                    <select
                      className="fld"
                      value={newShopCompany}
                      onChange={(e) => setNewShopCompany(e.target.value)}
                    >
                      {shops.map((s, i) => (
                        <option key={i} value={s.co}>{s.co}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 6 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--mute)', display: 'block', marginBottom: 3 }}>
                        Type
                      </label>
                      <select
                        className="fld"
                        value={newShopType}
                        onChange={(e) => setNewShopType(e.target.value)}
                      >
                        <option value="Magasin">Magasin</option>
                        <option value="Boutique">Boutique</option>
                        <option value="Dépôt">Dépôt</option>
                        <option value="Rayon">Rayon</option>
                        <option value="Point de vente">Point</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--mute)', display: 'block', marginBottom: 3 }}>
                        Nom (ex: Rayon Express, Dépôt Nord)
                      </label>
                      <input
                        className="fld"
                        placeholder="Ex: Rayon Express..."
                        value={newShopName}
                        onChange={(e) => setNewShopName(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button
                      type="button"
                      className="qb"
                      style={{ flex: 1, padding: 8 }}
                      onClick={() => setShowAddShopForm(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="cta"
                      style={{ flex: 1.5, padding: 8 }}
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div style={{ marginTop: 14 }}>
              <button
                className="qb"
                style={{ width: '100%', padding: 10 }}
                onClick={() => setShowShopModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ENTRÉE DE STOCK / RÉCEPTION (SAISIE LIBRE AU CLAVIER SANS LIMITE DE 10) */}
      {showRestockModal && (
        <div className="ov" onClick={() => setShowRestockModal(false)}>
          <div className="card modal-content-wrap" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="av" style={{ background: 'rgba(77, 220, 23, 0.15)', color: '#4ddc17' }}>
                  <PackagePlus size={22} />
                </span>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18 }}>Entrée en stock</h2>
                  <span style={{ fontSize: 12, color: 'var(--mute)' }}>Réception libre de marchandise</span>
                </div>
              </div>
              <button
                className="qb"
                style={{ width: 32, height: 32, padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setShowRestockModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '14px 0' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--mute)', display: 'block', marginBottom: 4 }}>
                  Sélectionner l'article
                </label>
                <select
                  className="fld"
                  value={modalRestockProduct}
                  onChange={(e) => setModalRestockProduct(Number(e.target.value))}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.n} (Stock actuel : {p.s} unités)
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const selectedProd = products.find((p) => p.id === modalRestockProduct) || products[0];
                const inputNum = parseInt(modalRestockQty, 10) || 0;
                const projectedStock = selectedProd ? selectedProd.s + inputNum : 0;
                return (
                  <>
                    <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--mute)' }}>Stock actuel</div>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{selectedProd?.s || 0} unités</div>
                      </div>
                      <div style={{ fontSize: 20, color: 'var(--mute)' }}>➔</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: '#4ddc17', fontWeight: 600 }}>Nouveau stock estimé</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#4ddc17' }}>
                          {projectedStock} unités
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 4 }}>
                        Quantité reçue (saisie libre au clavier)
                      </label>
                      <input
                        type="number"
                        min="1"
                        autoFocus
                        className="fld"
                        style={{ fontSize: 18, fontWeight: 700, padding: 12, textAlign: 'center' }}
                        placeholder="Ex: 25, 50, 100..."
                        value={modalRestockQty}
                        onChange={(e) => setModalRestockQty(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleReceiveStock(selectedProd.id, modalRestockQty);
                            setShowRestockModal(false);
                          }
                        }}
                      />
                    </div>

                    {/* BOUTONS RAPIDES D'AJOUT POUR LE CONFORT */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[5, 10, 20, 50, 100].map((step) => (
                        <button
                          key={step}
                          type="button"
                          className="qb"
                          style={{ flex: 1, padding: '6px 0', fontSize: 12, fontWeight: 700 }}
                          onClick={() => {
                            const currentVal = parseInt(modalRestockQty, 10) || 0;
                            setModalRestockQty(String(currentVal + step));
                          }}
                        >
                          +{step}
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                className="qb"
                style={{ flex: 1, padding: 12 }}
                onClick={() => setShowRestockModal(false)}
              >
                Annuler
              </button>
              <button
                className="cta"
                style={{ flex: 1.5, padding: 12 }}
                onClick={() => {
                  handleReceiveStock(modalRestockProduct, modalRestockQty);
                  setShowRestockModal(false);
                }}
              >
                Enregistrer la réception
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast ${toast ? 'on' : ''}`}>{toast}</div>
    </div>
  );
}
