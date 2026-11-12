import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

// --- UTILITAIRES & SÉCURITÉ ---
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

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('sp_theme') || 'light');
  const [hideAmounts, setHideAmounts] = useState(false);
  const [currentTab, setCurrentTab] = useState('accueil');
  const [role, setRole] = useState('proprietaire');
  const [toast, setToast] = useState('');

  // Données persistantes
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('sp_react_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('sp_react_sales');
    return saved ? JSON.parse(saved) : [
      { no: 'FAC-0003', cl: 'Ets Kokou', t: '12:03', date: '12/11/2026', pay: 'T-Money', tot: 45000, sub: 45000, d: 0, items: [{ n: 'Riz parfumé 5 kg', p: 2500, q: 18 }] },
      { no: 'FAC-0002', cl: 'Mme Amavi', t: '11:15', date: '12/11/2026', pay: 'Flooz', tot: 12800, sub: 12800, d: 0, items: [{ n: 'Huile végétale 1 L', p: 1500, q: 8 }] },
      { no: 'FAC-0001', cl: 'Client de passage', t: '10:42', date: '12/11/2026', pay: 'Espèces', tot: 3500, sub: 3500, d: 0, items: [{ n: 'Sucre 1 kg', p: 800, q: 4 }] }
    ];
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

  // Formulaires modaux
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

  // Persistance automatique
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
    setTimeout(() => setToast(''), 2200);
  };

  // Statistiques globales
  const totalToday = useMemo(() => sales.reduce((sum, s) => sum + s.tot, 0), [sales]);
  const salesCount = sales.length;
  const avgBasket = salesCount ? Math.round(totalToday / salesCount) : 0;

  // Répartition des paiements
  const paymentBreakdown = useMemo(() => {
    const res = { 'Espèces': 0, 'Flooz': 0, 'T-Money': 0 };
    sales.forEach((s) => { res[s.pay] = (res[s.pay] || 0) + s.tot; });
    return res;
  }, [sales]);

  // Données du graphique d'évolution des ventes
  const chartPoints = useMemo(() => {
    const data7 = [98000, 121000, 87000, 142000, 133000, 159000, totalToday];
    const data30 = Array.from({ length: 30 }, (_, i) => i === 29 ? totalToday : Math.round(90000 + Math.sin(i / 3) * 28000 + i * 2200));
    const d = period === 7 ? data7 : data30;
    const max = Math.max(...d, 1) * 1.15;
    const W = 460;
    const H = 130;
    const step = (W - 20) / (d.length - 1);
    const pts = d.map((v, i) => [10 + i * step, H - (v / max) * (H - 20)]);
    const path = pts.map((pt, i) => (i === 0 ? 'M' : 'L') + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1)).join(' ');
    const last = pts[pts.length - 1];
    const totalP = d.reduce((a, b) => a + b, 0);
    return { pts, path, last, W, H, totalP, d };
  }, [period, totalToday]);

  // Lignes du panier
  const cartLines = useMemo(() => {
    return Object.keys(cart).map((id) => {
      const prod = products.find((p) => p.id === Number(id));
      return prod ? { ...prod, qty: cart[id] } : null;
    }).filter(Boolean);
  }, [cart, products]);

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

    setSales((prev) => [newSale, ...prev]);
    setLastCompletedSale(newSale);
    setShowSaleModal(true);
    setCart({});
    setDiscount('');
    setReceivedAmount('');
    showToast(`Vente ${no} encaissée avec succès ✓`);
  };

  const handleAddProduct = () => {
    const pSell = Number(newProdSell);
    const pBuy = Number(newProdBuy) || 0;
    const pStock = Number(newProdStock) || 0;
    const pMin = Number(newProdMin) || 5;

    if (!newProdName.trim()) {
      showToast('Le nom du produit est obligatoire');
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

  // SVG ICONS
  const IconHome = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></svg>
  );
  const IconStock = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></svg>
  );
  const IconCart = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6" /></svg>
  );
  const IconReports = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18" /><path d="M18 17V9M13 17V5M8 17v-3" /></svg>
  );
  const IconPlus = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
  );

  return (
    <div className="app">
      {/* HEADER SUPÉRIEUR */}
      <header>
        <div className="top">
          <div className="logo"><i>▲</i>StockPilot</div>
          <div className="user-badge">
            <span>{ROLES[role].label}</span>
            <button
              onClick={() => {
                const next = role === 'caissier' ? 'gestionnaire' : role === 'gestionnaire' ? 'proprietaire' : 'caissier';
                setRole(next);
                showToast(`Profil : ${ROLES[next].label}`);
              }}
              title="Changer de profil"
            >
              ⇄ Changer
            </button>
          </div>
          <button className="ib" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Changer de thème">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="ib" onClick={() => setHideAmounts(!hideAmounts)} aria-label="Masquer montants">
            👁
          </button>
        </div>

        <div className="shop">
          <span>🏬 Boutique Centrale · Magasin principal</span>
        </div>

        <div className="lbl">Ventes du jour</div>
        <div>
          <span className="big">{hideAmounts ? '••••••' : fmt(totalToday)}</span>
          <small className="big"><small> FCFA</small></small>
          <span className="trend">▲ 12 % vs hier</span>
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
          VUE 1 : ACCUEIL / TABLEAU DE BORD HARMONIEUX PLEINE LARGEUR
          ========================================================= */}
      {currentTab === 'accueil' && (
        <main className="dashboard-grid">
          {/* Ligne 1 : KPI & Raccourcis sur toute la largeur */}
          <div className="dash-row-full">
            <div className="grid2">
              <div className="card kpi">
                <div className="t">Ventes réalisées</div>
                <div className="v">{salesCount} <small>aujourd’hui</small></div>
              </div>
              <div className="card kpi">
                <div className="t">Panier moyen</div>
                <div className="v">{hideAmounts ? '••••' : fmt(avgBasket)} <small>FCFA</small></div>
              </div>
            </div>

            <div className="card short">
              <button className="main" onClick={() => setCurrentTab('vente')}>
                <span>🛒</span>Vente
              </button>
              <button onClick={() => setCurrentTab('stock')}>
                <span>⬇️</span>Entrée
              </button>
              <button onClick={() => showToast('Scanner code-barres / QR prêt')}>
                <span>▦</span>Scanner
              </button>
              <button onClick={() => setCurrentTab('stock')}>
                <span>📋</span>Inventaire
              </button>
            </div>
          </div>

          {lowStockProducts.length > 0 && (
            <button className="alert dash-alert-full" onClick={() => setCurrentTab('stock')}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <span className="grow">
                <span>{lowStockProducts.length} produit(s) sous le seuil d'alerte</span><br />
                <span style={{ fontWeight: 400, fontSize: 13 }}>
                  {lowStockProducts.map((p) => p.n).join(', ')} — Cliquez pour réapprovisionner
                </span>
              </span>
              <span>›</span>
            </button>
          )}

          {/* Ligne 2 : Grille à 2 colonnes majeures équilibrées */}
          <div className="dash-columns">
            {/* COLONNE GAUCHE (ÉVOLUTION & DERNIÈRES VENTES) */}
            <div className="dash-col-main">
              {/* Carte Évolution des ventes avec vrai Graphique SVG */}
              <div className="card">
                <div className="row">
                  <h2>Évolution des ventes</h2>
                  <div className="seg">
                    <button aria-pressed={period === 7} onClick={() => setPeriod(7)}>7 j</button>
                    <button aria-pressed={period === 30} onClick={() => setPeriod(30)}>30 j</button>
                  </div>
                </div>
                <div style={{ color: 'var(--mute)', fontSize: 13, marginTop: 4 }}>
                  Total sur {period} jours : <b>{hideAmounts ? '••••••' : `${fmt(chartPoints.totalP)} FCFA`}</b>
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

              {/* Dernières ventes */}
              <div className="card">
                <div className="row">
                  <h2>Dernières ventes</h2>
                  <button onClick={() => setCurrentTab('reports')} style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 13 }}>
                    Historique complet
                  </button>
                </div>
                <ul className="list">
                  {sales.slice(0, 5).map((s, idx) => (
                    <li key={idx}>
                      <span className="av">🧾</span>
                      <div className="grow">
                        <b>{s.cl}</b>
                        <span>{s.no} · {s.t} · {s.pay}</span>
                      </div>
                      <span className="amt">{hideAmounts ? '••••' : `${fmt(s.tot)} FCFA`}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* COLONNE DROITE (MODES DE PAIEMENT & PRODUITS STARS) */}
            <div className="dash-col-side">
              {/* Modes de paiement */}
              <div className="card">
                <div className="row">
                  <h2>Modes de paiement du jour</h2>
                </div>
                <div className="bar" style={{ height: 12, margin: '14px 0 10px' }}>
                  <i style={{ width: `${totalToday ? (paymentBreakdown['Espèces'] / totalToday) * 100 : 50}%`, background: 'var(--blue)' }}></i>
                  <i style={{ width: `${totalToday ? (paymentBreakdown['Flooz'] / totalToday) * 100 : 30}%`, background: 'var(--yellow)' }}></i>
                  <i style={{ width: `${totalToday ? (paymentBreakdown['T-Money'] / totalToday) * 100 : 20}%`, background: '#f97316' }}></i>
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
          VUE 2 : CAISSE & VENTE (ORGANISATION 2 COLONNES HARMONIEUSE)
          ========================================================= */}
      {currentTab === 'vente' && (
        <main className="pos-layout">
          {/* Colonne Catalogue (Pleine largeur sur la gauche) */}
          <div className="card pos-catalog">
            <div className="row">
              <h2>Catalogue Produits</h2>
              <span className="tag ok">{products.length} articles disponibles</span>
            </div>
            <input
              className="fld"
              placeholder="🔍 Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginTop: 12, marginBottom: 14 }}
            />
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
                        {p.s <= 0 ? 'Rupture' : `Stock : ${p.s}${cart[p.id] ? ` (${cart[p.id]} au panier)` : ''}`}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Colonne Panier & Encaissement (Droite) */}
          <div className="card pos-checkout">
            <h2>Panier en cours</h2>
            <div className="cart-scroll-area">
              {cartLines.length === 0 ? (
                <p style={{ color: 'var(--mute)', margin: '20px 0', textAlign: 'center' }}>
                  Panier vide.<br />Touchez un article pour l'ajouter.
                </p>
              ) : (
                cartLines.map((l) => (
                  <div className="ln" key={l.id}>
                    <div className="grow">
                      <b>{l.n}</b>
                      <span>{fmt(l.p)} × {l.qty} = {fmt(l.p * l.qty)} FCFA</span>
                    </div>
                    <div className="qty">
                      <button onClick={() => handleRemoveFromCart(l.id)}>−</button>
                      <b>{l.qty}</b>
                      <button className="pl" onClick={() => handleAddToCart(l)}>+</button>
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

            {/* GRILLE D'INVENTAIRE PLEINE LARGEUR */}
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
            <h2>Historique Complet des Ventes</h2>
            <ul className="list">
              {sales.map((s, idx) => (
                <li key={idx}>
                  <span className="av">🧾</span>
                  <div className="grow">
                    <b>{s.no} · {s.cl}</b>
                    <span>{s.date} à {s.t} · {s.pay}</span>
                  </div>
                  <b style={{ whiteSpace: 'nowrap', fontSize: 16 }}>{fmt(s.tot)} FCFA</b>
                </li>
              ))}
            </ul>
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
                  <span className="av">👤</span>
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
          <div className="card">
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
                showToast('Journée clôturée et archivée avec succès ✓');
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

      {/* MODAL SUCCÈS VENTE */}
      {showSaleModal && lastCompletedSale && (
        <div className="ov">
          <div className="card">
            <div className="chk">✓</div>
            <h2>Vente validée</h2>
            <div style={{ margin: '12px 0', color: 'var(--mute)', fontSize: 14, lineHeight: 1.7 }}>
              {lastCompletedSale.no} · {lastCompletedSale.cl}<br />
              <b style={{ color: 'var(--ink)', fontSize: 17 }}>Total : {fmt(lastCompletedSale.tot)} FCFA</b><br />
              Mode : {lastCompletedSale.pay}
              {lastCompletedSale.pay === 'Espèces' && lastCompletedSale.chg > 0 && (
                <div style={{ color: 'var(--ok)', fontWeight: 700 }}>Monnaie rendue : {fmt(lastCompletedSale.chg)} FCFA</div>
              )}
            </div>
            <button className="cta" onClick={() => setShowSaleModal(false)}>
              Nouvelle vente
            </button>
          </div>
        </div>
      )}

      {/* NAVIGATION PRINCIPALE (MOBILE & DESKTOP SIDEBAR) */}
      <nav aria-label="Navigation principale">
        <button
          aria-current={currentTab === 'accueil' ? 'page' : undefined}
          onClick={() => setCurrentTab('accueil')}
        >
          <IconHome />
          <span>Accueil</span>
        </button>

        <button
          aria-current={currentTab === 'stock' ? 'page' : undefined}
          onClick={() => setCurrentTab('stock')}
        >
          <IconStock />
          <span>Stock</span>
        </button>

        <button
          className="sell"
          aria-current={currentTab === 'vente' ? 'page' : undefined}
          onClick={() => setCurrentTab('vente')}
        >
          <em><IconCart /></em>
          <span>Vente</span>
        </button>

        <button
          aria-current={currentTab === 'reports' ? 'page' : undefined}
          onClick={() => setCurrentTab('reports')}
        >
          <IconReports />
          <span>Rapports</span>
        </button>

        <button
          aria-current={currentTab === 'plus' ? 'page' : undefined}
          onClick={() => setCurrentTab('plus')}
        >
          <IconPlus />
          <span>Plus</span>
        </button>
      </nav>

      <div className={`toast ${toast ? 'on' : ''}`}>{toast}</div>
    </div>
  );
}
