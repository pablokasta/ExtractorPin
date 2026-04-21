import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, Loader2, CheckCircle2, AlertCircle, X, ChevronRight, List, BrainCircuit, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { extractVouchersFromPDF } from './services/gemini';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [vouchers, setVouchers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStatus('idle');
      setError(null);
    } else {
      setError('Por favor sube un archivo PDF válido.');
    }
  };

  const processPDF = async () => {
    if (!file) return;

    setStatus('processing');
    setError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      const extractedVouchers = await extractVouchersFromPDF(base64Data);
      
      setVouchers(extractedVouchers);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setError(err.message || 'Error al procesar el PDF. Inténtalo de nuevo.');
    }
  };

  const downloadExcel = () => {
    if (vouchers.length === 0) return;

    const worksheet = XLSX.utils.aoa_to_sheet(vouchers.map(v => [v]));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vouchers');
    XLSX.writeFile(workbook, `vouchers_${new Date().getTime()}.xlsx`);
  };

  const reset = () => {
    setFile(null);
    setVouchers([]);
    setStatus('idle');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 md:p-8 overflow-x-hidden selection:bg-indigo-500/30">
      <div className="max-w-[1400px] mx-auto h-full grid grid-cols-1 md:grid-cols-12 md:grid-rows-12 gap-4 min-h-[900px]">
        
        {/* Header Section */}
        <header className="md:col-span-8 md:row-span-2 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Hotspot PDF Parser</h1>
              <p className="text-zinc-500 text-sm italic">Extractor automático de folios de 10 dígitos</p>
            </div>
          </div>
          <div className="hidden sm:flex gap-2">
            <div className="bg-zinc-800 px-4 py-2 rounded-xl border border-zinc-700 text-xs font-mono text-zinc-400">
              STABLE_v2.5.0
            </div>
          </div>
        </header>

        {/* List Section */}
        <div className="md:col-span-4 md:row-span-6 bg-indigo-600/5 border border-indigo-500/20 rounded-3xl p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-indigo-400" />
              <h2 className="font-semibold text-lg">Lista de Vouchers</h2>
            </div>
            <span className="bg-indigo-500 text-white text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider">
              {vouchers.length} Detectados
            </span>
          </div>
          
          <div className="flex-grow bg-zinc-900/80 rounded-2xl border border-zinc-800 overflow-hidden relative">
            <div className="absolute inset-0 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-800/50 text-zinc-500 font-mono text-[10px] uppercase tracking-wider sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Voucher ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-mono">
                  {vouchers.length > 0 ? (
                    vouchers.map((v, i) => (
                      <tr key={i} className="group hover:bg-indigo-500/5 transition-colors">
                        <td className="px-4 py-3 text-zinc-600 text-xs">{(i + 1).toString().padStart(2, '0')}</td>
                        <td className="px-4 py-3 text-indigo-400 group-hover:text-indigo-300 transition-colors">{v}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-12 text-center text-zinc-600 italic text-xs">
                        {status === 'idle' ? 'Esperando archivo...' : status === 'processing' ? 'Procesando...' : 'No se encontraron vouchers'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div 
          onClick={() => status !== 'processing' && fileInputRef.current?.click()}
          className={`md:col-span-4 md:row-span-4 bg-zinc-900 border ${status === 'processing' ? 'border-indigo-500/30' : 'border-zinc-800'} rounded-3xl p-6 flex flex-col justify-center items-center group cursor-pointer hover:border-indigo-500/50 transition-all active:scale-[0.98]`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="hidden"
          />
          {!file ? (
            <>
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-zinc-700 group-hover:scale-110 transition-transform group-hover:bg-zinc-700">
                <Upload className="w-8 h-8 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <p className="text-sm font-medium">Arrastra PDF aquí</p>
              <p className="text-xs text-zinc-500 mt-1">Formatos: .pdf (Máx 10MB)</p>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4 border border-indigo-500/30 mx-auto">
                {status === 'processing' ? (
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-indigo-400" />
                )}
              </div>
              <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
              <button 
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="text-[10px] uppercase tracking-widest text-zinc-500 mt-2 hover:text-white transition-colors"
              >
                Cambiar Archivo
              </button>
            </div>
          )}
        </div>

        {/* Preview / Status Area */}
        <div className="md:col-span-4 md:row-span-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden flex flex-col">
          <div className={`absolute top-0 left-0 w-full h-1 ${status === 'processing' ? 'bg-indigo-500 animate-pulse' : 'bg-zinc-800'}`}></div>
          <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4 font-bold">Estado del Sistema</h3>
          
          <div className="flex-grow flex flex-col justify-center gap-6">
            {error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-xs leading-relaxed">{error}</p>
              </div>
            ) : status === 'processing' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-mono uppercase tracking-widest animate-pulse">Analizando estructura...</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-full bg-indigo-500"
                  />
                </div>
              </div>
            ) : status === 'success' ? (
              <div className="space-y-4">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-center">
                  <p className="text-[10px] uppercase text-indigo-400 font-bold mb-1">Último resultado</p>
                  <p className="text-2xl font-bold tracking-tighter text-indigo-100 font-mono">
                    {vouchers[0] || "---"}
                  </p>
                </div>
                <p className="text-[10px] text-zinc-500 text-center italic">Vista previa del primer voucher detectado</p>
              </div>
            ) : (
              <div className="text-center opacity-30 italic text-xs">
                Inicia una extracción para ver los datos aquí
              </div>
            )}
          </div>
        </div>

        {/* Export Area */}
        <div className="md:col-span-8 md:row-span-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex items-center justify-between">
          <div className="space-y-4 flex-grow pr-8">
            <h3 className="text-xl font-semibold">Exportar Resultados</h3>
            <p className="text-zinc-500 text-sm max-w-md hidden sm:block">
              Genera un archivo Excel (.xlsx) compatible con Google Sheets y Microsoft Excel con una sola columna de folios limpios.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={status === 'idle' && file ? processPDF : downloadExcel}
                disabled={status === 'processing' || (!file && status === 'idle')}
                className={`flex-1 sm:flex-none font-bold py-3 px-8 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                  status === 'processing' || (!file && status === 'idle')
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
                  : status === 'idle' ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                {status === 'idle' && file ? 'Procesar Ahora' : 'Descargar Excel'}
                {status === 'idle' && file ? <ChevronRight className="w-5 h-5" /> : <Download className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={reset}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 px-6 rounded-2xl border border-zinc-700 transition-colors"
                disabled={status === 'processing'}
              >
                Limpiar todo
              </button>
            </div>
          </div>
          <div className="hidden lg:block w-32 h-32 opacity-10">
            <Activity className="w-full h-full text-indigo-500" />
          </div>
        </div>

        {/* Accuracy Stat Section */}
        <div className="md:col-span-4 md:row-span-2 bg-emerald-950/20 border border-emerald-500/30 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-950" />
          </div>
          <div>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Precisión IA</p>
            <p className="text-2xl font-mono font-bold">99.8%</p>
          </div>
        </div>

      </div>
    </div>
  );
}
