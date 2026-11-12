import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine des classes Tailwind de manière conditionnelle et sécurisée
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un montant en Franc CFA (XOF) conformément aux règles métier StockPilot
 */
export function formatFCFA(amount: number): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount);
  
  return `${formatted} FCFA`;
}
