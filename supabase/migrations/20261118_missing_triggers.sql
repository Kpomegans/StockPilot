-- ============================================================
-- TRIGGERS MANQUANTS — StockPilot
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- Projet : vdxztgrzzuatksbacgny
-- ============================================================

-- -------------------------------------------------------
-- TRIGGER 1 : Création automatique du profil utilisateur
-- Déclenché à chaque inscription via Supabase Auth
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
        NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprime l'ancien trigger s'il existe (pour éviter les doublons)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crée le trigger sur la table auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- -------------------------------------------------------
-- TRIGGER 2 : Protection des logs d'audit
-- Empêche toute modification ou suppression d'un log d'audit
-- -------------------------------------------------------
DROP TRIGGER IF EXISTS trg_protect_audit_logs ON public.audit_logs;

CREATE TRIGGER trg_protect_audit_logs
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();


-- -------------------------------------------------------
-- VÉRIFICATION FINALE
-- -------------------------------------------------------
SELECT
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'auth')
   OR event_object_schema IN ('public', 'auth')
ORDER BY event_object_table, trigger_name;
