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
  ArrowRight
} from 'lucide-react';
import './App.css';

// --- UTILITAIRES DE FORMATAGE ---
const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');

const ROLES = {
  caissier: { label: 'Caissier', canClose: false, canEditPrice: false, canViewBuy: false },
  gestionnaire: { label: 'Gestionnaire', canClose: true, canEditPrice: false, canViewBuy: false },
  proprietaire: { label: 'Propriétaire', canClose: true, canEditPrice: true, canViewBuy: true }
};

const INITIAL_PRODUCTS = [
  { id: 1, n: 'Sucre 1 kg', p: 800, s: 8, buy: 650, min: 10 },
  { id: 2, n: 'Huile végétale 1 L', p: 1500, s: 5, buy: 1250, min: 10 },
  { id: 3, n: 'Riz parfumé 5 kg', p: 2500, s: 12, buy: 2000, min: 15 },
  { id: 4, n: 'Eau minérale 1,5 L', p: 600, s: 140, buy: 450, min: 20 },
  { id: 5, n: 'Savon de ménage', p: 250, s: 60, buy: 180, min: 20 },
  { id: 6, n: 'Lait en poudre 400 g', p: 2200, s: 20, buy: 1850, min: 10 }
];

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
  const [theme, setTheme] = useState(() => localStorage.getItem('sp_theme') || 'light');
  const [hideAmounts, setHideAmounts] = useState(false);
  const [currentTab, setCurrentTab] = useState('accueil');
  const [role, setRole] = useState('proprietaire');
  const [toast, setToast] = useState('');

  // Initialisation à 0 franc et 0 vente au départ
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('sp_react_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('sp_react_sales');
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
    return saved ? JSON.parse(saved) : [];
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

  // Sauvegardes
  useEffect(() => {
    localStorage.setItem('sp_react_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('sp_react_sales', JSON.stringify(sales));
  }, [sales]);

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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // --- CALCUL EN DIRECT DES VENTES DU JOUR (COMMENCE À 0 FCFA) ---
  const totalToday = useMemo(() => sales.reduce((sum, s) => sum + s.tot, 0), [sales]);
  const salesCount = sales.length;
  const avgBasket = salesCount ? Math.round(totalToday / salesCount) : 0;

  // Répartition des paiements du jour (commence à 0)
  const paymentBreakdown = useMemo(() => {
    const res = { 'Espèces': 0, 'Flooz': 0, 'T-Money': 0 };
    sales.forEach((s) => { res[s.pay] = (res[s.pay] || 0) + s.tot; });
    return res;
  }, [sales]);

  // Graphique d'évolution des ventes réactif
  const chartPoints = useMemo(() => {
    const data7 = [0, 0, 0, 0, 0, 0, totalToday];
    const data30 = Array.from({ length: 30 }, (_, i) => (i === 29 ? totalToday : 0));
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
  }, [period, totalToday]);

  // Panier
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

  // --- ENCAISSEMENT : AJOUT INSTANTANÉ AU TOTAL DU JOUR ---
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
    const no = `FAC-${String(sales.length + 1).padStart(4, '0')}`;
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
      items: cartLines.map((l) => ({ n: l.n, p: l.p, q: l.qty }))
    };

    // Le nouveau montant s'ajoute en direct aux Ventes du jour
    setSales((prev) => [newSale, ...prev]);
    setLastCompletedSale(newSale);
    setShowSaleModal(true);
    setCart({});
    setDiscount('');
    setReceivedAmount('');
    showToast(`Vente validée ! +${fmt(totalToPay)} FCFA ajoutés aux ventes du jour ✓`);
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
    setClients((prev) => [...prev, { n: newClientName.trim(), tel: newClientTel.trim() }]);
    setClient(newClientName.trim());
    setNewClientName('');
    setNewClientTel('');
    setShowNewClientForm(false);
    showToast('Client enregistré ✓');
  };

  const lowStockProducts = products.filter((p) => p.s <= p.min);

  return (
    <div className="app">
      {/* HEADER FIXE PARTOUT : AFFICHE TOUJOURS LES VENTES DU JOUR EN DIRECT */}
      <header>
        <div className="top">
          <div className="logo">
            <span className="logo-badge"><TrendingUp size={18} strokeWidth={2.6} /></span>
            <span>StockPilot</span>
          </div>

          <div className="user-badge">
            <User size={13} />
            <span>{ROLES[role].label}</span>
            <button
              onClick={() => {
                const next = role === 'caissier' ? 'gestionnaire' : role === 'gestionnaire' ? 'proprietaire' : 'caissier';
                setRole(next);
                showToast(`Profil : ${ROLES[next].label}`);
              }}
              title="Changer de profil"
            >
              Changer
            </button>
          </div>

          <button className="ib" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Changer de thème">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="ib" onClick={() => setHideAmounts(!hideAmounts)} aria-label="Masquer montants">
            {hideAmounts ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="shop">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Store size={15} />
            <span>Boutique Centrale · Magasin principal</span>
          </div>
          <ChevronRight size={15} />
        </div>

        {/* COMPTEUR EN DIRECT DES VENTES DU JOUR */}
        <div className="lbl">Ventes du jour (cumul en direct)</div>
        <div>
          <span className="big">{hideAmounts ? '••••••' : fmt(totalToday)}</span>
          <small className="big"><small> FCFA</small></small>
          <span className="trend">
            {salesCount === 0 ? '0 vente' : `${salesCount} vente${salesCount > 1 ? 's' : ''} réalisée${salesCount > 1 ? 's' : ''}`}
          </span>
        </div>

        <div style={{ marginTop: 10 }}>
          <span className="trial">Version v2.1 Sécurisée</span>
          {ROLES[role].canClose && (
            <button
              className="trial"
              style={{ marginLeft: 8, background: 'rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' }}
              onClick={() => setShowCloseModal(true)}
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
          {/* Ligne 1 : KPI & Raccourcis Pro */}
          <div className="dash-row-full">
            <div className="grid2">
              <div className="card kpi">
                <div className="t">Ventes réalisées aujourd'hui</div>
                <div className="v">{salesCount} <small>{salesCount > 1 ? 'ventes' : 'vente'}</small></div>
              </div>
              <div className="card kpi">
                <div className="t">Panier moyen</div>
                <div className="v">{hideAmounts ? '••••' : fmt(avgBasket)} <small>FCFA</small></div>
              </div>
            </div>

            {/* RACCOURCIS PRO */}
            <div className="card short">
              <button className="main pro-shortcut" onClick={() => setCurrentTab('vente')}>
                <span className="shortcut-icon main-icon">
                  <ShoppingCart size={22} strokeWidth={2.2} />
                </span>
                <b>Vente</b>
              </button>

              <button className="pro-shortcut" onClick={() => setCurrentTab('stock')}>
                <span className="shortcut-icon">
                  <PackagePlus size={22} strokeWidth={2.2} />
                </span>
                <b>Entrée</b>
              </button>

              <button className="pro-shortcut" onClick={() => showToast('Scanner code-barres / QR prêt')}>
                <span className="shortcut-icon">
                  <ScanBarcode size={22} strokeWidth={2.2} />
                </span>
                <b>Scanner</b>
              </button>

              <button className="pro-shortcut" onClick={() => setCurrentTab('stock')}>
                <span className="shortcut-icon">
                  <ClipboardList size={22} strokeWidth={2.2} />
                </span>
                <b>Inventaire</b>
              </button>
            </div>
          </div>

          {lowStockProducts.length > 0 && (
            <button className="alert dash-alert-full" onClick={() => setCurrentTab('stock')}>
              <AlertTriangle size={24} style={{ flexShrink: 0 }} />
              <span className="grow">
                <span>{lowStockProducts.length} produit(s) sous le seuil d'alerte</span><br />
                <span style={{ fontWeight: 400, fontSize: 13 }}>
                  {lowStockProducts.map((p) => p.n).join(', ')} — Cliquez pour réapprovisionner
                </span>
              </span>
              <ChevronRight size={18} />
            </button>
          )}

          {/* Ligne 2 : Grille à 2 colonnes */}
          <div className="dash-columns">
            {/* COLONNE GAUCHE */}
            <div className="dash-col-main">
              {/* Carte Évolution des ventes */}
              <div className="card">
                <div className="row">
                  <h2>Évolution des ventes</h2>
                  <div className="seg">
                    <button aria-pressed={period === 7} onClick={() => setPeriod(7)}>7 j</button>
                    <button aria-pressed={period === 30} onClick={() => setPeriod(30)}>30 j</button>
                  </div>
                </div>
                <div style={{ color: 'var(--mute)', fontSize: 13, marginTop: 4 }}>
                  Total cumulé : <b>{hideAmounts ? '••••••' : `${fmt(totalToday)} FCFA`}</b>
                </div>

                <div className="chart-container">
                  <svg className="chart" viewBox={`0 0 ${chartPoints.W} ${chartPoints.H}`}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.38" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={`${chartPoints.path} L${chartPoints.W - 10} ${chartPoints.H} L10 ${chartPoints.H} Z`}
                      fill="url(#chartGrad)"
                    />
                    <path
                      d={chartPoints.path}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx={chartPoints.last[0]}
                      cy={chartPoints.last[1]}
                      r="5.5"
                      fill="#ffd60a"
                      stroke="#047857"
                      strokeWidth="2.5"
                    />
                  </svg>
                  {period === 7 && (
                    <div className="chart-labels">
                      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d, i) => (
                        <span key={i}>{d}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dernières ventes avec bouton de téléchargement direct */}
              <div className="card">
                <div className="row">
                  <h2>Dernières ventes ({salesCount})</h2>
                  <button onClick={() => setCurrentTab('reports')} style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>Historique</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
                {sales.length === 0 ? (
                  <p style={{ color: 'var(--mute)', margin: '14px 0', fontSize: 13 }}>
                    Aucune vente enregistrée pour le moment. Le total du jour est à <b>0 FCFA</b>.
                  </p>
                ) : (
                  <ul className="list">
                    {sales.slice(0, 5).map((s, idx) => (
                      <li key={idx}>
                        <span className="av"><Receipt size={18} /></span>
                        <div className="grow">
                          <b>{s.cl}</b>
                          <span>{s.no} · {s.t} · {s.pay}</span>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="amt">{hideAmounts ? '••••' : `${fmt(s.tot)} FCFA`}</span>
                          <button
                            className="btn-icon-receipt"
                            onClick={() => downloadReceipt(s, showToast)}
                            title={`Télécharger le reçu ${s.no}`}
                            aria-label={`Télécharger le reçu ${s.no}`}
                          >
                            <Download size={15} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* COLONNE DROITE */}
            <div className="dash-col-side">
              {/* Modes de paiement */}
              <div className="card">
                <div className="row">
                  <h2>Modes de paiement du jour</h2>
                </div>
                <div className="bar" style={{ height: 12, margin: '14px 0 10px' }}>
                  <i style={{ width: `${totalToday ? (paymentBreakdown['Espèces'] / totalToday) * 100 : 0}%`, background: 'var(--blue)' }}></i>
                  <i style={{ width: `${totalToday ? (paymentBreakdown['Flooz'] / totalToday) * 100 : 0}%`, background: 'var(--yellow)' }}></i>
                  <i style={{ width: `${totalToday ? (paymentBreakdown['T-Money'] / totalToday) * 100 : 0}%`, background: '#f97316' }}></i>
                </div>
                <div className="payment-list">
                  <div className="payment-row">
                    <span><i className="sw" style={{ background: 'var(--blue)' }}></i>Espèces</span>
                    <b>{fmt(paymentBreakdown['Espèces'])} FCFA</b>
                  </div>
                  <div className="payment-row">
                    <span><i className="sw" style={{ background: 'var(--yellow)' }}></i>Flooz</span>
                    <b>{fmt(paymentBreakdown['Flooz'])} FCFA</b>
                  </div>
                  <div className="payment-row">
                    <span><i className="sw" style={{ background: '#f97316' }}></i>T-Money</span>
                    <b>{fmt(paymentBreakdown['T-Money'])} FCFA</b>
                  </div>
                </div>
              </div>

              {/* Top produits */}
              <div className="card">
                <h2>Produits les plus demandés</h2>
                <ul className="list">
                  {products.slice(0, 4).map((p) => (
                    <li key={p.id}>
                      <span className="av">{p.n[0]}</span>
                      <div className="grow">
                        <b>{p.n}</b>
                        <span>{fmt(p.p)} FCFA · Stock: {p.s}</span>
                      </div>
                      <span className={`tag ${p.s <= p.min ? 'bad' : 'ok'}`}>
                        {p.s <= p.min ? 'Stock bas' : 'OK'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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

            <div className="search-bar-wrap" style={{ marginTop: 12, marginBottom: 14 }}>
              <Search size={16} className="search-icon-inside" />
              <input
                className="fld fld-with-icon"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                        {p.s <= 0 ? 'Rupture' : `Stock : ${p.s}${cart[p.id] ? ` (${cart[p.id]})` : ''}`}
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
          VUE 3 : INVENTAIRE & STOCKS PLEINE LARGEUR
          ========================================================= */}
      {currentTab === 'stock' && (
        <main className="fullwidth-layout">
          <div className="card">
            <div className="row">
              <div>
                <h2>Inventaire des Produits</h2>
                <span style={{ fontSize: 13, color: 'var(--mute)' }}>{products.length} articles en gestion</span>
              </div>
              <button className="qb" onClick={() => setShowNewProd(!showNewProd)}>
                {showNewProd ? 'Fermer' : '+ Nouveau produit'}
              </button>
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
                      {ROLES[role].canViewBuy && (
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

                      <button
                        className="qb"
                        style={{ width: '100%', padding: '9px 0', textAlign: 'center' }}
                        onClick={() => {
                          setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, s: x.s + 10 } : x));
                          showToast(`+10 ${p.n} reçus en stock ✓`);
                        }}
                      >
                        + Réceptionner 10 unités
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* =========================================================
          VUE 4 : RAPPORTS ET CLÔTURES
          ========================================================= */}
      {currentTab === 'reports' && (
        <main className="fullwidth-layout">
          <div className="card">
            <h2>Synthèse Financière du Jour</h2>
            <div className="grid2" style={{ marginTop: 12 }}>
              <div className="card kpi" style={{ margin: 0 }}>
                <div className="t">Chiffre d'affaires encaissé</div>
                <div className="v">{fmt(totalToday)} <small>FCFA</small></div>
              </div>
              <div className="card kpi" style={{ margin: 0 }}>
                <div className="t">Transactions réalisées</div>
                <div className="v">{salesCount} <small>tickets</small></div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <h2>Historique Complet des Ventes & Reçus</h2>
            {sales.length === 0 ? (
              <p style={{ color: 'var(--mute)', margin: '14px 0', fontSize: 13 }}>
                Aucune vente enregistrée aujourd'hui.
              </p>
            ) : (
              <ul className="list">
                {sales.map((s, idx) => (
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

          <div className="card" style={{ marginTop: 14 }}>
            <h2>Contrôle des Profils & Autorisations</h2>
            <p style={{ fontSize: 13, color: 'var(--mute)', margin: '8px 0 14px' }}>
              Profil utilisateur en cours d'utilisation : <b>{ROLES[role].label}</b>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {Object.keys(ROLES).map((k) => (
                <button
                  key={k}
                  className="qb"
                  style={{
                    padding: 12,
                    background: role === k ? 'var(--blue)' : 'var(--bg)',
                    color: role === k ? '#fff' : 'var(--ink)'
                  }}
                  onClick={() => {
                    setRole(k);
                    showToast(`Profil changé vers : ${ROLES[k].label}`);
                  }}
                >
                  {ROLES[k].label}
                </button>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* MODAL CLÔTURE DE JOURNÉE */}
      {showCloseModal && (
        <div className="ov">
          <div className="card modal-content-wrap">
            <h2>Clôturer la journée ?</h2>
            <p style={{ margin: '14px 0', color: 'var(--mute)', fontSize: 14, lineHeight: 1.6 }}>
              Total encaissé aujourd'hui : <b>{fmt(totalToday)} FCFA</b> ({salesCount} ventes).<br />
              Toutes les transactions seront archivées dans l'historique et la caisse repartira à 0 FCFA.
            </p>
            <button
              className="cta"
              onClick={() => {
                const now = new Date();
                setClosedDays((prev) => [
                  { date: now.toLocaleDateString('fr-FR'), tot: totalToday, n: salesCount, by: ROLES[role].label },
                  ...prev
                ]);
                setSales([]);
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
          MODAL SUCCÈS VENTE — AVEC REDIRECTION ET ACTUALISATION DIRECTE
          ========================================================= */}
      {showSaleModal && lastCompletedSale && (
        <div className="ov">
          <div className="card modal-content-wrap">
            <div className="chk"><CheckCircle2 size={36} /></div>
            <h2>Paiement validé !</h2>
            
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
                <span style={{ fontWeight: 700 }}>Total encaissé :</span>
                <b style={{ color: 'var(--blue)', fontSize: 16 }}>{fmt(lastCompletedSale.tot)} FCFA</b>
              </div>
              {lastCompletedSale.pay === 'Espèces' && lastCompletedSale.chg > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ok)' }}>
                  <span>Monnaie rendue :</span>
                  <b>{fmt(lastCompletedSale.chg)} FCFA</b>
                </div>
              )}
            </div>

            {/* BOUTON 1 : TÉLÉCHARGER LE REÇU CLIENT */}
            <button
              className="cta"
              style={{ background: 'var(--blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}
              onClick={() => downloadReceipt(lastCompletedSale, showToast)}
            >
              <Download size={18} />
              <span>Télécharger le reçu client (PDF)</span>
            </button>

            {/* BOUTON 2 : NOUVELLE VENTE -> MET DIRECTEMENT LE COMPTEUR À JOUR SUR L'ACCUEIL */}
            <button
              className="cta"
              style={{ background: 'var(--yellow)', color: '#111', marginTop: 4 }}
              onClick={() => {
                setShowSaleModal(false);
                setCurrentTab('accueil'); // Retour direct sur l'accueil pour voir immédiatement les ventes du jour et le montant cumulé !
                showToast(`Total du jour actualisé : ${fmt(totalToday)} FCFA (${salesCount} ventes)`);
              }}
            >
              Voir le tableau de bord & Nouvelle vente
            </button>
          </div>
        </div>
      )}

      {/* NAVIGATION PRINCIPALE */}
      <nav aria-label="Navigation principale">
        <button
          aria-current={currentTab === 'accueil' ? 'page' : undefined}
          onClick={() => setCurrentTab('accueil')}
        >
          <LayoutDashboard size={20} />
          <span>Accueil</span>
        </button>

        <button
          aria-current={currentTab === 'stock' ? 'page' : undefined}
          onClick={() => setCurrentTab('stock')}
        >
          <Package size={20} />
          <span>Stock</span>
        </button>

        <button
          className="sell"
          aria-current={currentTab === 'vente' ? 'page' : undefined}
          onClick={() => setCurrentTab('vente')}
        >
          <em><ShoppingCart size={22} /></em>
          <span>Vente</span>
        </button>

        <button
          aria-current={currentTab === 'reports' ? 'page' : undefined}
          onClick={() => setCurrentTab('reports')}
        >
          <BarChart3 size={20} />
          <span>Rapports</span>
        </button>

        <button
          aria-current={currentTab === 'plus' ? 'page' : undefined}
          onClick={() => setCurrentTab('plus')}
        >
          <Settings size={20} />
          <span>Plus</span>
        </button>
      </nav>

      <div className={`toast ${toast ? 'on' : ''}`}>{toast}</div>
    </div>
  );
}
