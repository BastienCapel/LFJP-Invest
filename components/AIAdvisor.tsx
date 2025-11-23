
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { SimulationSummary, YearlyFinancials, Project } from '../types';

interface Props {
  summary: SimulationSummary;
  yearlyData: YearlyFinancials[];
  projects: Project[];
  studentCount: number;
  currency: 'XOF' | 'EUR';
}

const AIAdvisor: React.FC<Props> = ({ summary, yearlyData, projects, studentCount, currency }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAdvice = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Clé API manquante");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const currencyLabel = currency === 'XOF' ? 'FCFA' : 'EUR';
      const exchangeRate = currency === 'EUR' ? 655.957 : 1;

      // Prepare prompt context
      const activeProjectsList = projects
        .filter(p => p.isActive)
        .map(p => `- ${p.name}: ${(p.totalCost / exchangeRate).toLocaleString()} ${currencyLabel} (${p.startYear}-${p.startYear + p.durationYears})`)
        .join('\n');

      const yearlyBreakdown = yearlyData
        .map(y => `Year ${y.label}: Cap ${(y.investmentCapacity / exchangeRate).toFixed(0)}, Cost ${(y.projectCosts / exchangeRate).toFixed(0)}, Bal ${(y.balance / exchangeRate).toFixed(0)}`)
        .join('\n');

      const prompt = `
        Agis en tant qu'expert financier senior pour une école (Lycée Français).
        Analyse le plan d'investissement suivant :
        
        CONTEXTE:
        - Devise de référence: ${currencyLabel}
        - Nombre d'élèves: ${studentCount}
        - Déficit Total à financer: ${(summary.fundingGap / exchangeRate).toLocaleString()} ${currencyLabel}
        - Années déficitaires: ${summary.yearsWithDeficit}

        PROJETS ACTIFS:
        ${activeProjectsList}

        DONNÉES ANNUELLES (${currencyLabel}):
        ${yearlyBreakdown}

        Tâche : Donne une analyse stratégique concise (max 4 phrases) et 3 recommandations par points (bullet points) pour équilibrer ce budget ou gérer la hausse des frais de scolarité (écolages). Sois direct et professionnel.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAdvice(response.text || "Aucune réponse générée.");
    } catch (err) {
      console.error(err);
      setError("Impossible de générer l'analyse. Vérifiez votre connexion ou la clé API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-indigo-900">Assistant Stratégique Gemini</h3>
        </div>
        {!advice && !loading && (
          <button 
            onClick={generateAdvice}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Analyser le plan
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-indigo-600">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Analyse financière en cours...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {advice && !loading && (
        <div className="prose prose-indigo text-sm text-slate-700 bg-white/60 p-4 rounded-lg border border-indigo-100/50 w-full max-w-none">
          <div className="whitespace-pre-line">{advice}</div>
          <button 
            onClick={generateAdvice} 
            className="mt-4 text-xs text-indigo-600 hover:text-indigo-800 underline"
          >
            Mettre à jour l'analyse
          </button>
        </div>
      )}
    </div>
  );
};

export default AIAdvisor;