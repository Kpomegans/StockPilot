import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

// Utilitaires de formatage
const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');

// Configuration des rôles et contrôle d'accès
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

  // Données métier
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('sp_react_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('sp_react_sales');
    return saved ? JSON.parse(saved) : [
      { no: 'FAC-0003', cl: 'Ets Kokou', t: '12:03', pay: 'T-Money', tot: 45000, items: [{ n: 'Riz parfumé 5 kg', p: 2500, q: 18 }] },
      { no: 'FAC-0002', cl: 'Mme Amavi', t: '11:15', pay: 'Flooz', tot: 12800, items: [{ n: 'Huile végétale 1 L', p: 1500, q: 8 }] },
      { no: 'FAC-0001', cl: 'Client de passage', t: '10:42', pay: 'Espèces', tot: 3500, items: [{ n: 'Sucre 1 kg', p: 800, q: 4 }] }
    ];
  });

  const [cart, setCart] = useState({});
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [client, setClient] = useState('Client de passage');
  const [period, setPeriod] = useState(7);
  const [search, setSearch] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState(null);

  // Sauvegarde persistante
  useEffect(() => {
    localStorage.setItem('sp_react_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('sp_react_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('sp_theme', theme);
  }, [theme]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // Calculs totaux du jour
  const totalToday = useMemo(() => sales.reduce((sum, s) => sum + s.tot, 0), [sales]);
  const salesCount = sales.length;
  const avgBasket = salesCount ? Math.round(totalToday / salesCount) : 0;

  // Calculs panier
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
      showToast(`Stock insuffisant (${prod.s} max)`);
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
      showToast('Montant reçu insuffisant');
      return;
    }

    // Décrémenter le stock
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
    showToast(`Vente ${no} enregistrée ✓`);
  };

  const lowStockProducts = products.filter((p) => p.s <= p.min);

  return (
    <div className="app">
      <header>
        <div className="top">
          <div className="logo"><i>▲</i>StockPilot</div>
          <div className="user-badge">
            <span>{ROLES[role].label}</span>
            <button
              onClick={() => {
                const nextRole = role === 'caissier' ? 'gestionnaire' : role === 'gestionnaire' ? 'proprietaire' : 'caissier';
                setRole(nextRole);
                showToast(`Profil changé : ${ROLES[nextRole].label}`);
              }}
              title="Changer de profil"
            >
              ⚙
            </button>
          </div>
          <button className="ib" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="ib" onClick={() => setHideAmounts(!hideAmounts)}>
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
          <span className="trend">▲ 12 %</span>
        </div>
        <span className="trial">React + Vite v2.1</span>
        {ROLES[role].canClose && (
          <button
            className="trial"
            style={{ marginLeft: 8, background: 'rgba(255,255,255,0.2)', color: '#fff' }}
            onClick={() => setShowCloseModal(true)}
          >
            Clôturer la journée
          </button>
        )}
      </header>

      {currentTab === 'accueil' && (
        <main>
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
            <button onClick={() => showToast('Scanner QR/Code-barres bientôt disponible')}>
              <span>▦</span>Scanner
            </button>
            <button onClick={() => setCurrentTab('stock')}>
              <span>📋</span>Inventaire
            </button>
          </div>

          {lowStockProducts.length > 0 && (
            <button className="alert" onClick={() => setCurrentTab('stock')}>
              <span style={{ fontSize: 22 }}>⚠️</span>
              <span className="grow">
                <span>{lowStockProducts.length} produit(s) sous le seuil</span><br />
                <span style={{ fontWeight: 400, fontSize: 12 }}>
                  {lowStockProducts.map((p) => p.n).join(', ')}
                </span>
              </span>
              <span>›</span>
            </button>
          )}

          <div className="card">
            <div className="row">
              <h2>Dernières ventes</h2>
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
        </main>
      )}

      {currentTab === 'vente' && (
        <main style={{ marginTop: -40 }}>
          <div className="card">
            <input
              className="fld"
              placeholder="Rechercher un produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              {products
                .filter((p) => p.n.toLowerCase().includes(search.toLowerCase()))
                .map((p) => (
                  <button
                    key={p.id}
                    className="fld"
                    style={{ textAlign: 'left', padding: 10, background: 'var(--bg)', height: 'auto' }}
                    onClick={() => handleAddToCart(p)}
                    disabled={p.s <= 0}
                  >
                    <b>{p.n}</b>
                    <div style={{ fontSize: 12, color: 'var(--mute)' }}>{fmt(p.p)} FCFA</div>
                    <div style={{ fontSize: 11, color: p.s <= p.min ? 'var(--bad)' : 'var(--ok)' }}>
                      {p.s <= 0 ? 'Rupture' : `Stock: ${p.s}`}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          <div className="card">
            <h2>Panier</h2>
            <ul className="list">
              {cartLines.length === 0 ? (
                <li style={{ color: 'var(--mute)' }}>Panier vide</li>
              ) : (
                cartLines.map((l) => (
                  <li key={l.id}>
                    <div className="grow">
                      <b>{l.n}</b>
                      <span>{fmt(l.p)} × {l.qty} = {fmt(l.p * l.qty)} FCFA</span>
                    </div>
                    <div>
                      <button onClick={() => handleRemoveFromCart(l.id)} style={{ padding: '4px 10px', background: 'var(--bg)', borderRadius: 6 }}>−</button>
                      <b style={{ margin: '0 8px' }}>{l.qty}</b>
                      <button onClick={() => handleAddToCart(l)} style={{ padding: '4px 10px', background: 'var(--blue)', color: '#fff', borderRadius: 6 }}>+</button>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Total à encaisser</span>
                <b style={{ fontSize: 18 }}>{fmt(totalToPay)} FCFA</b>
              </div>
              <button
                className="cta"
                disabled={cartLines.length === 0}
                onClick={handleValidateSale}
              >
                Encaisser {fmt(totalToPay)} FCFA →
              </button>
            </div>
          </div>
        </main>
      )}

      {currentTab === 'stock' && (
        <main style={{ marginTop: -40 }}>
          <div className="card">
            <h2>Inventaire des Produits</h2>
            <ul className="list">
              {products.map((p) => (
                <li key={p.id}>
                  <div className="grow">
                    <b>{p.n}</b>
                    <span>Prix: {fmt(p.p)} FCFA {ROLES[role].canViewBuy && `(Achat: ${fmt(p.buy)} FCFA)`}</span>
                  </div>
                  <div>
                    <span className={`tag ${p.s <= p.min ? 'bad' : 'ok'}`}>
                      {p.s} en stock
                    </span>
                    <button
                      style={{ marginLeft: 8, padding: '4px 8px', background: 'var(--yellow)', borderRadius: 6, fontWeight: 700 }}
                      onClick={() => {
                        setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, s: x.s + 10 } : x));
                        showToast(`+10 ${p.n} ajoutés`);
                      }}
                    >
                      +10
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </main>
      )}

      {/* MODAL SUCCÈS VENTE */}
      {showSaleModal && lastCompletedSale && (
        <div className="ov">
          <div className="card">
            <div style={{ fontSize: 36, color: 'var(--ok)' }}>✓</div>
            <h2>Vente validée</h2>
            <p style={{ margin: '12px 0', color: 'var(--mute)' }}>
              {lastCompletedSale.no} · {lastCompletedSale.cl}<br />
              <b>Total : {fmt(lastCompletedSale.tot)} FCFA</b>
            </p>
            <button className="cta" onClick={() => setShowSaleModal(false)}>
              Nouvelle vente
            </button>
          </div>
        </div>
      )}

      {/* MODAL CLÔTURE DE JOURNÉE */}
      {showCloseModal && (
        <div className="ov">
          <div className="card">
            <h2>Clôture de Caisse</h2>
            <p style={{ margin: '14px 0', color: 'var(--mute)' }}>
              Total encaissé aujourd'hui : <b>{fmt(totalToday)} FCFA</b> ({salesCount} ventes).<br />
              Voulez-vous clôturer et remettre le tableau de bord à 0 ?
            </p>
            <button
              className="cta"
              onClick={() => {
                setSales([]);
                setShowCloseModal(false);
                showToast('Journée clôturée avec succès ✓');
              }}
            >
              Confirmer la clôture
            </button>
            <button
              className="cta"
              style={{ background: 'var(--bg)', color: 'var(--ink)', marginTop: 6 }}
              onClick={() => setShowCloseModal(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* NAVIGATION INFÉRIEURE */}
      <nav>
        <button aria-current={currentTab === 'accueil' ? 'page' : undefined} onClick={() => setCurrentTab('accueil')}>
          Accueil
        </button>
        <button aria-current={currentTab === 'stock' ? 'page' : undefined} onClick={() => setCurrentTab('stock')}>
          Stock
        </button>
        <button className="sell" onClick={() => setCurrentTab('vente')}>
          <em>🛒</em>
          Vente
        </button>
        <button onClick={() => showToast('Module Rapports')}>
          Rapports
        </button>
        <button onClick={() => showToast('Module Paramètres')}>
          Plus
        </button>
      </nav>

      <div className={`toast ${toast ? 'on' : ''}`}>{toast}</div>
    </div>
  );
}

