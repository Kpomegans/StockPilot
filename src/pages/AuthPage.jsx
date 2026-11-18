import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

/**
 * Page d'authentification StockPilot
 * Gère : Connexion, Inscription, Réinitialisation du mot de passe
 * Utilise Supabase Auth (email + mot de passe)
 */
export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Réinitialise les champs et messages lors du changement de mode
  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  // --- CONNEXION ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        // Traduction des erreurs Supabase en français
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Veuillez confirmer votre adresse email avant de vous connecter.');
        } else if (signInError.message.includes('Too many requests')) {
          setError('Trop de tentatives. Veuillez patienter quelques minutes.');
        } else {
          setError('Erreur de connexion. Vérifiez vos identifiants.');
        }
        return;
      }

      if (data?.session) {
        // Connexion réussie — l'App écoutera onAuthStateChange
        if (onAuthSuccess) onAuthSuccess(data.session);
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  // --- INSCRIPTION ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validations côté client
    if (!fullName.trim()) {
      setError('Le nom complet est requis.');
      return;
    }
    if (!companyName.trim()) {
      setError('Le nom de votre entreprise est requis.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            company_name: companyName.trim(),
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          setError('Cette adresse email est déjà utilisée. Essayez de vous connecter.');
        } else if (signUpError.message.includes('Password should be at least')) {
          setError('Le mot de passe doit comporter au moins 8 caractères.');
        } else {
          setError("Erreur lors de l'inscription. Réessayez.");
        }
        return;
      }

      if (data?.user) {
        setSuccessMsg(
          "Compte créé avec succès ! Vérifiez votre boîte email pour confirmer votre adresse, puis connectez-vous."
        );
        switchMode('login');
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  // --- RÉINITIALISATION DU MOT DE PASSE ---
  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Entrez votre adresse email.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        setError('Erreur lors de l\'envoi. Vérifiez votre email.');
      } else {
        setSuccessMsg(
          'Email de réinitialisation envoyé ! Vérifiez votre boîte de réception (et vos spams).'
        );
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Fond animé */}
      <div className="auth-bg">
        <div className="auth-bg-circle auth-bg-circle-1" />
        <div className="auth-bg-circle auth-bg-circle-2" />
      </div>

      <div className="auth-container">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="7" width="20" height="14" rx="2" fill="currentColor" opacity="0.2"/>
              <path d="M8 7V5a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 12v4m-2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="auth-logo-text">StockPilot</span>
        </div>

        {/* Carte principale */}
        <div className="auth-card">
          {/* Titre selon le mode */}
          {mode === 'login' && (
            <>
              <h1 className="auth-title">Bon retour !</h1>
              <p className="auth-subtitle">Connectez-vous à votre espace de gestion</p>
            </>
          )}
          {mode === 'register' && (
            <>
              <h1 className="auth-title">Créer un compte</h1>
              <p className="auth-subtitle">Essai gratuit de 30 jours · Sans carte bancaire</p>
            </>
          )}
          {mode === 'reset' && (
            <>
              <button className="auth-back-btn" onClick={() => switchMode('login')}>
                <ArrowLeft size={16} /> Retour
              </button>
              <h1 className="auth-title">Mot de passe oublié</h1>
              <p className="auth-subtitle">Nous vous enverrons un lien de réinitialisation</p>
            </>
          )}

          {/* Message de succès */}
          {successMsg && (
            <div className="auth-alert auth-alert-success">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="auth-alert auth-alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* === FORMULAIRE CONNEXION === */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Adresse email</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label className="auth-label">Mot de passe</label>
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={() => switchMode('reset')}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="auth-spinner" />
                    Connexion en cours…
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>

              <p className="auth-switch-text">
                Pas encore de compte ?{' '}
                <button type="button" className="auth-link" onClick={() => switchMode('register')}>
                  Créer un compte gratuit
                </button>
              </p>
            </form>
          )}

          {/* === FORMULAIRE INSCRIPTION === */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Nom complet</label>
                <div className="auth-input-wrapper">
                  <input
                    type="text"
                    className="auth-input auth-input-no-icon"
                    placeholder="Prénom et Nom"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Nom de votre entreprise</label>
                <div className="auth-input-wrapper">
                  <input
                    type="text"
                    className="auth-input auth-input-no-icon"
                    placeholder="Ex: Boutique Centrale, Épicerie Mawuli…"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Adresse email</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Mot de passe</label>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Minimum 8 caractères"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Confirmer le mot de passe</label>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Répétez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="auth-spinner" />
                    Création du compte…
                  </>
                ) : (
                  'Créer mon compte gratuit'
                )}
              </button>

              <p className="auth-switch-text">
                Déjà un compte ?{' '}
                <button type="button" className="auth-link" onClick={() => switchMode('login')}>
                  Se connecter
                </button>
              </p>
            </form>
          )}

          {/* === FORMULAIRE RÉINITIALISATION === */}
          {mode === 'reset' && (
            <form onSubmit={handleReset} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Adresse email de votre compte</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="auth-spinner" />
                    Envoi en cours…
                  </>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="auth-footer">
          © 2026 StockPilot · Gestion commerciale pour l'Afrique
        </p>
      </div>
    </div>
  );
}
