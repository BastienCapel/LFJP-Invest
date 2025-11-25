
import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  YEARS_TO_SIMULATE,
  GLOBAL_REVENUE
} from './constants';
import { AlertCircle, CloudOff, Loader2, Building2, Wallet, Calculator } from 'lucide-react';

// Modules / Hooks
import { usePersistence } from './hooks/usePersistence';
import { useFinancials } from './hooks/useFinancials';

// Components
import Header from './components/Header';
import KPIGrid from './components/KPIGrid';
import FinancialChart from './components/FinancialChart';
import FinancialTable from './components/FinancialTable';
import ProjectCard from './components/ProjectCard';
import ProjectGantt from './components/ProjectGantt';
import FeeSimulator from './components/FeeSimulator';
import PasswordModal from './components/PasswordModal';

const App: React.FC = () => {
  // --- UI State ---
  const [currency, setCurrency] = useState<'XOF' | 'EUR'>('XOF');
  const [isLocked, setIsLocked] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // --- Logic Hooks ---
  // Persistence handles data loading/saving/sync
  const { 
    projects, 
    studentCount, 
    setStudentCount,
    feeRates, 
    isLoading, 
    isSaving, 
    lastSaved, 
    dbStatus, 
    errorMessage,
    actions 
  } = usePersistence(isLocked);

  // Financials handles math
  const { 
    simulationData, 
    summary, 
    formatCurrency 
  } = useFinancials(projects, feeRates, currency);

  // --- Handlers ---

  const handleLockToggle = () => {
    if (isLocked) {
      setShowPasswordModal(true);
    } else {
      setIsLocked(true);
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
    setShowPasswordModal(false);
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('dashboard-content');
    if (!element) return;

    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#f8fafc',
        logging: false,
        onclone: (clonedDoc) => {
            const inputs = clonedDoc.querySelectorAll('input[type="number"], input[type="text"]');
            inputs.forEach((input: any) => {
                const span = clonedDoc.createElement('div');
                span.textContent = input.value;
                span.style.cssText = window.getComputedStyle(input).cssText;
                span.style.border = '1px solid #e2e8f0';
                span.style.display = 'flex';
                span.style.alignItems = 'center';
                span.style.justifyContent = input.classList.contains('text-right') ? 'flex-end' : 'flex-start';
                span.style.backgroundColor = '#ffffff';
                span.style.padding = '4px 8px'; 
                if (input.parentNode) {
                    input.parentNode.replaceChild(span, input);
                }
            });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`LFJP_Plan_Investissement_${timestamp}.pdf`);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      alert("Une erreur est survenue lors de la création du PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <h2 className="text-lg font-semibold text-slate-700">Chargement des données...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-slate-50/50 relative">
      <Header 
        isLocked={isLocked}
        onLockToggle={handleLockToggle}
        isExporting={isExporting}
        onExportPDF={handleExportPDF}
        currency={currency}
        onCurrencyToggle={() => setCurrency(prev => prev === 'XOF' ? 'EUR' : 'XOF')}
        isSaving={isSaving}
        dbStatus={dbStatus}
        lastSaved={lastSaved}
        onReset={actions.handleResetData}
        studentCount={studentCount}
        onStudentCountChange={setStudentCount}
      />

      <main id="dashboard-content" className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50/50">
        
        {errorMessage && (
           <div className={`border-l-4 p-4 mb-6 rounded-r flex justify-between items-center ${errorMessage?.includes('règles') ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {errorMessage?.includes('règles') ? <AlertCircle className="h-5 w-5 text-red-500" /> : <CloudOff className="h-5 w-5 text-amber-500" />}
              </div>
              <div className="ml-3">
                <p className={`text-sm ${errorMessage?.includes('règles') ? 'text-red-700' : 'text-amber-700'}`}>
                  <strong>{errorMessage?.includes('règles') ? "Action requise sur Firebase" : "Mode hors ligne"} : </strong> 
                  {errorMessage}
                  {errorMessage?.includes('règles') && (
                    <span className="block mt-1 text-xs">
                        Allez dans l'onglet <strong>Règles</strong> de votre base de données Firestore et mettez <code>allow read, write: if true;</code>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <KPIGrid summary={summary} formatCurrency={formatCurrency} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* LEFT: Projects (3/12 on XL) */}
          <div className="xl:col-span-3 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-400" />
                Projets
              </h2>
              
              <div className="flex flex-col gap-4">
                {projects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onToggle={actions.toggleProject}
                    onCostChange={actions.updateProjectCost}
                    onPeriodChange={actions.updateProjectPeriod}
                    formatCurrency={formatCurrency}
                    isLocked={isLocked}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* MIDDLE: Financials (6/12 on XL) */}
          <div className="xl:col-span-6 space-y-6">
             <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-slate-400" />
                Analyse Financière
              </h2>
            <FinancialChart data={simulationData} currency={currency} />
            
            <FinancialTable data={simulationData} formatCurrency={formatCurrency} />

            <ProjectGantt 
                projects={projects} 
                years={YEARS_TO_SIMULATE} 
                onPeriodChange={actions.updateProjectPeriod}
                onToggle={actions.toggleProject}
                currency={currency}
                isLocked={isLocked}
            />
          </div>

          {/* RIGHT: Fee Simulator (3/12 on XL) */}
          <div className="xl:col-span-3">
            <div className="sticky top-24">
               <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-slate-400" />
                Financement
              </h2>
              <FeeSimulator 
                years={YEARS_TO_SIMULATE}
                feeRates={feeRates}
                globalRevenue={GLOBAL_REVENUE}
                onRateChange={actions.updateFeeRate}
                formatCurrency={formatCurrency}
                isLocked={isLocked}
              />
            </div>
          </div>
        </div>
      </main>

      <PasswordModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onUnlock={handleUnlock}
      />
    </div>
  );
};

export default App;
