-- ========================================================
-- MIGRATION DE SÉCURITÉ STOCKPILOT : SCHÉMA RELATIONNEL & RLS MULTI-TENANT
-- Version : 20261118_initial_security_schema.sql
-- ========================================================

-- Activer l'extension pgcrypto pour les UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================
-- 1. TABLE DES ENTREPRISES (COMPANIES - MULTI-TENANT)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    currency TEXT NOT NULL DEFAULT 'XOF',
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================================
-- 2. TABLE DES PROFILS UTILISATEURS (PROFILES)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================================
-- 3. ASSOCIATION UTILISATEUR <-> ENTREPRISE & RÔLES (RBAC)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.company_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('proprietaire', 'administrateur', 'gestionnaire', 'employe', 'lecture_seule')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, user_id)
);

-- ========================================================
-- 4. MAGASINS & POINTS DE VENTE (STORES)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Magasin' CHECK (type IN ('Magasin', 'Boutique', 'Dépôt', 'Rayon', 'Point de vente')),
    location TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================================
-- 5. PRODUITS DU CATALOGUE (PRODUCTS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT NOT NULL DEFAULT 'Général',
    buy_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (buy_price >= 0),
    sell_price NUMERIC(12, 2) NOT NULL CHECK (sell_price >= 0),
    min_stock_alert INTEGER NOT NULL DEFAULT 5 CHECK (min_stock_alert >= 0),
    unit TEXT NOT NULL DEFAULT 'unité',
    barcode TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================================
-- 6. NIVEAUX DE STOCK PAR MAGASIN (PRODUCT_STOCKS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.product_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(store_id, product_id)
);

-- ========================================================
-- 7. MOUVEMENTS D'INVENTAIRE / RÉCEPTIONS (INVENTORY_MOVEMENTS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_change INTEGER NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('reception', 'vente', 'ajustement', 'transfert', 'retour', 'perte')),
    reference_id TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================================
-- 8. CLIENTS (CUSTOMERS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================================
-- 9. VENTES ET FACTURATION (SALES)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('especes', 'mobile_money', 'carte', 'virement', 'cheque', 'credit')),
    payment_status TEXT NOT NULL DEFAULT 'paye' CHECK (payment_status IN ('paye', 'partiel', 'en_attente', 'annule')),
    cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, invoice_number)
);

-- ========================================================
-- 10. LIGNES DE VENTE / HISTORIQUE COMPTABLE (SALE_ITEMS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    buy_price_snapshot NUMERIC(12, 2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- ========================================================
-- 11. ABONNEMENTS SAAS & PAYGATE (SUBSCRIPTIONS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'essai' CHECK (plan IN ('essai', 'decouverte', 'professionnel', 'business', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'actif' CHECK (status IN ('actif', 'expire', 'en_attente', 'annule')),
    trial_ends_at TIMESTAMPTZ,
    current_period_ends_at TIMESTAMPTZ,
    paygate_tx_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================================
-- 12. JOURNAL D'AUDIT SÉCURISÉ IMMUABLE (AUDIT_LOGS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================================
-- 13. INDEX DE PERFORMANCE ET DE RECHERCHE RAPIDE
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.company_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_company ON public.company_memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_stores_company ON public.stores(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_stocks_product ON public.product_stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_stocks_store ON public.product_stocks(store_id);
CREATE INDEX IF NOT EXISTS idx_movements_company ON public.inventory_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company ON public.sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_company ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at);

-- ========================================================
-- 14. FONCTIONS HELPER POSTGRESQL SECURITY DEFINER POUR RLS
-- ========================================================

-- Récupérer la liste des entreprises autorisées pour l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_user_company_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT company_id 
    FROM public.company_memberships 
    WHERE user_id = auth.uid() 
      AND is_active = true;
$$;

-- Récupérer le rôle de l'utilisateur dans une entreprise donnée
CREATE OR REPLACE FUNCTION public.get_user_role(target_company_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role 
    FROM public.company_memberships 
    WHERE user_id = auth.uid() 
      AND company_id = target_company_id 
      AND is_active = true
    LIMIT 1;
$$;

-- ========================================================
-- 15. ACTIVATION STRICTE DE ROW LEVEL SECURITY (RLS)
-- ========================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- 16. POLITIQUES RLS MULTI-TENANT ÉTANCHES
-- ========================================================

-- PROFILES : Chaque utilisateur gère son propre profil
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- COMPANIES : Visible uniquement si membre actif
CREATE POLICY "companies_select_member" ON public.companies FOR SELECT 
USING (id IN (SELECT public.get_user_company_ids()));

CREATE POLICY "companies_update_admin" ON public.companies FOR UPDATE 
USING (public.get_user_role(id) IN ('proprietaire', 'administrateur'));

-- MEMBERSHIPS : Visible par les membres de la même entreprise
CREATE POLICY "memberships_select_member" ON public.company_memberships FOR SELECT 
USING (company_id IN (SELECT public.get_user_company_ids()));

CREATE POLICY "memberships_admin_manage" ON public.company_memberships FOR ALL 
USING (public.get_user_role(company_id) IN ('proprietaire', 'administrateur'));

-- STORES : Lecture par membres, modification par gestionnaires/admins
CREATE POLICY "stores_select_member" ON public.stores FOR SELECT 
USING (company_id IN (SELECT public.get_user_company_ids()));

CREATE POLICY "stores_manage_admin" ON public.stores FOR ALL 
USING (public.get_user_role(company_id) IN ('proprietaire', 'administrateur', 'gestionnaire'));

-- PRODUCTS : Lecture par membres, modification interdite aux caissiers/employés/lecture_seule
CREATE POLICY "products_select_member" ON public.products FOR SELECT 
USING (company_id IN (SELECT public.get_user_company_ids()));

CREATE POLICY "products_manage_admin" ON public.products FOR ALL 
USING (public.get_user_role(company_id) IN ('proprietaire', 'administrateur', 'gestionnaire'));

-- PRODUCT_STOCKS : Visible par membres, modifiable par admins/gestionnaires
CREATE POLICY "stocks_select_member" ON public.product_stocks FOR SELECT 
USING (company_id IN (SELECT public.get_user_company_ids()));

CREATE POLICY "stocks_manage_admin" ON public.product_stocks FOR ALL 
USING (public.get_user_role(company_id) IN ('proprietaire', 'administrateur', 'gestionnaire'));

-- INVENTORY_MOVEMENTS : Traçabilité des mouvements
CREATE POLICY "movements_select_member" ON public.inventory_movements FOR SELECT 
USING (company_id IN (SELECT public.get_user_company_ids()));

CREATE POLICY "movements_insert_staff" ON public.inventory_movements FOR INSERT 
WITH CHECK (
    company_id IN (SELECT public.get_user_company_ids()) 
    AND public.get_user_role(company_id) IN ('proprietaire', 'administrateur', 'gestionnaire', 'employe')
);

-- SALES : Ventes visibles par les membres autorisés
CREATE POLICY "sales_select_member" ON public.sales FOR SELECT 
USING (company_id IN (SELECT public.get_user_company_ids()));

CREATE POLICY "sales_insert_staff" ON public.sales FOR INSERT 
WITH CHECK (
    company_id IN (SELECT public.get_user_company_ids()) 
    AND public.get_user_role(company_id) IN ('proprietaire', 'administrateur', 'gestionnaire', 'employe')
);

-- SALE_ITEMS : Détails de vente protégés par la liaison à la vente
CREATE POLICY "sale_items_select_member" ON public.sale_items FOR SELECT 
USING (sale_id IN (SELECT id FROM public.sales WHERE company_id IN (SELECT public.get_user_company_ids())));

CREATE POLICY "sale_items_insert_staff" ON public.sale_items FOR INSERT 
WITH CHECK (sale_id IN (SELECT id FROM public.sales WHERE company_id IN (SELECT public.get_user_company_ids())));

-- AUDIT_LOGS : Visible UNIQUEMENT par propriétaire et administrateur
CREATE POLICY "audit_select_admin" ON public.audit_logs FOR SELECT 
USING (public.get_user_role(company_id) IN ('proprietaire', 'administrateur'));

CREATE POLICY "audit_insert_any" ON public.audit_logs FOR INSERT 
WITH CHECK (true);

-- INTERDICTION TOTALE DE SUPPRESSION OU MODIFICATION SUR LES AUDIT_LOGS
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Les journaux d''audit de StockPilot sont immuables et ne peuvent être ni modifiés ni supprimés.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_audit_logs ON public.audit_logs;
CREATE TRIGGER trg_protect_audit_logs
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- ========================================================
-- 17. DONNÉES INITIALES (SEED DE DÉMARRAGE STOCKPILOT)
-- ========================================================
DO $$
DECLARE
    v_company_id UUID;
    v_store_main_id UUID;
    v_store_depot_id UUID;
    v_prod_sucre UUID;
    v_prod_huile UUID;
    v_prod_eau UUID;
    v_prod_riz UUID;
    v_prod_savon UUID;
    v_prod_lait UUID;
BEGIN
    -- 1. Entreprise par défaut
    INSERT INTO public.companies (name, slug, currency, phone, address)
    VALUES ('Boutique Centrale', 'boutique-centrale', 'XOF', '+228 90 00 00 00', 'Lomé, Togo')
    RETURNING id INTO v_company_id;

    -- 2. Abonnement initial (Essai 30 jours gratuit conforme au cahier des charges)
    INSERT INTO public.subscriptions (company_id, plan, status, trial_ends_at)
    VALUES (v_company_id, 'essai', 'actif', now() + interval '30 days');

    -- 3. Magasins de démarrage
    INSERT INTO public.stores (company_id, name, type, is_default)
    VALUES (v_company_id, 'Magasin principal', 'Magasin', true)
    RETURNING id INTO v_store_main_id;

    INSERT INTO public.stores (company_id, name, type, is_default)
    VALUES (v_company_id, 'Dépôt Lomé', 'Dépôt', false)
    RETURNING id INTO v_store_depot_id;

    -- 4. Produits initiaux du catalogue
    INSERT INTO public.products (company_id, name, sku, category, buy_price, sell_price, min_stock_alert, unit)
    VALUES (v_company_id, 'Sucre 1 kg', 'SUC-001', 'Alimentation', 550, 750, 10, 'kg')
    RETURNING id INTO v_prod_sucre;

    INSERT INTO public.products (company_id, name, sku, category, buy_price, sell_price, min_stock_alert, unit)
    VALUES (v_company_id, 'Huile végétale 1 L', 'HUI-001', 'Alimentation', 950, 1300, 8, 'bouteille')
    RETURNING id INTO v_prod_huile;

    INSERT INTO public.products (company_id, name, sku, category, buy_price, sell_price, min_stock_alert, unit)
    VALUES (v_company_id, 'Eau minérale 1,5 L', 'EAU-001', 'Boissons', 300, 500, 20, 'bouteille')
    RETURNING id INTO v_prod_eau;

    INSERT INTO public.products (company_id, name, sku, category, buy_price, sell_price, min_stock_alert, unit)
    VALUES (v_company_id, 'Riz parfumé 5 kg', 'RIZ-001', 'Alimentation', 2800, 3600, 6, 'sac')
    RETURNING id INTO v_prod_riz;

    INSERT INTO public.products (company_id, name, sku, category, buy_price, sell_price, min_stock_alert, unit)
    VALUES (v_company_id, 'Savon de ménage', 'SAV-001', 'Entretien', 200, 350, 15, 'barre')
    RETURNING id INTO v_prod_savon;

    INSERT INTO public.products (company_id, name, sku, category, buy_price, sell_price, min_stock_alert, unit)
    VALUES (v_company_id, 'Lait concentré', 'LAI-001', 'Alimentation', 450, 650, 12, 'boîte')
    RETURNING id INTO v_prod_lait;

    -- 5. Stocks initiaux dans le Magasin Principal
    INSERT INTO public.product_stocks (company_id, store_id, product_id, quantity) VALUES
    (v_company_id, v_store_main_id, v_prod_sucre, 28),
    (v_company_id, v_store_main_id, v_prod_huile, 14),
    (v_company_id, v_store_main_id, v_prod_eau, 85),
    (v_company_id, v_store_main_id, v_prod_riz, 9),
    (v_company_id, v_store_main_id, v_prod_savon, 42),
    (v_company_id, v_store_main_id, v_prod_lait, 30);

    -- 6. Journalisation de l'initialisation
    INSERT INTO public.audit_logs (company_id, action, entity_type, entity_id, details)
    VALUES (v_company_id, 'INITIALISATION_SYSTEME', 'SYSTEM', v_company_id::text, '{"message": "Création initiale de l''entreprise, des magasins et du catalogue StockPilot"}'::jsonb);
END $$;
