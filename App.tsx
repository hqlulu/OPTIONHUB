
import React, { useState, useEffect, useCallback } from 'react';
import { OptionContract, OptionValue, SimulationStep, OptionType } from './types';
import { INITIAL_STOCK_PRICE, INITIAL_OPTIONS, SYMBOL, RISK_FREE_RATE } from './constants';
import { calculateBlackScholes } from './services/optionMath';
import { getMarketInsights } from './services/geminiService';
import PriceChart from './components/PriceChart';
import OptionRow from './components/OptionCard';

const App: React.FC = () => {
  const [price, setPrice] = useState(INITIAL_STOCK_PRICE);
  const [day, setDay] = useState(0);
  
  // Initialize options with their starting price
  const [options, setOptions] = useState<OptionContract[]>(() => {
    return INITIAL_OPTIONS.map(opt => {
      const T = opt.expiryDays / 365;
      const bs = calculateBlackScholes(
        INITIAL_STOCK_PRICE,
        opt.strike,
        T,
        RISK_FREE_RATE,
        opt.volatility,
        opt.type
      );
      return { ...opt, initialPrice: bs.price };
    });
  });

  const [history, setHistory] = useState<SimulationStep[]>([
    { date: new Date().toLocaleDateString(), day: 0, price: INITIAL_STOCK_PRICE, changePercent: 0 }
  ]);
  const [optionValues, setOptionValues] = useState<OptionValue[]>([]);
  const [insight, setInsight] = useState<string>("Simulator online. Control stock price with arrow keys to see Greeks evolve.");
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Form State for Adding Options
  const [newStrike, setNewStrike] = useState<string>(INITIAL_STOCK_PRICE.toString());
  const [newDays, setNewDays] = useState<string>("30");
  const [newType, setNewType] = useState<OptionType>(OptionType.CALL);

  useEffect(() => {
    const newValues = options.map(contract => {
      const remainingDays = Math.max(0, contract.expiryDays - day);
      const T = remainingDays / 365;
      const bs = calculateBlackScholes(
        price,
        contract.strike,
        T,
        RISK_FREE_RATE,
        contract.volatility,
        contract.type
      );
      
      return {
        contractId: contract.id,
        ...bs
      };
    });
    setOptionValues(newValues);
  }, [price, day, options]);

  const handleStep = useCallback((changePercent: number) => {
    setPrice(prevPrice => {
      const newPrice = prevPrice * (1 + changePercent / 100);
      const nextDay = day + 1;
      setDay(nextDay);
      setHistory(prev => [
        ...prev, 
        { 
          date: new Date().toLocaleDateString(), 
          day: nextDay, 
          price: newPrice, 
          changePercent 
        }
      ]);
      return newPrice;
    });
  }, [day]);

  const handleAddOption = () => {
    const strike = parseFloat(newStrike);
    const days = parseInt(newDays);
    if (isNaN(strike) || isNaN(days)) return;

    // Calculate initial price at the moment of adding
    const T = days / 365;
    const initialBS = calculateBlackScholes(
      price,
      strike,
      T,
      RISK_FREE_RATE,
      0.45,
      newType
    );

    const newOption: OptionContract = {
      id: `custom-${Date.now()}`,
      strike,
      expiryDays: day + days, // To maintain relative days, we store absolute expiry offset
      type: newType,
      volatility: 0.45,
      initialPrice: initialBS.price
    };
    
    // Adjust expiryDays so that "days" from now is the target. 
    // The calculation logic uses `expiryDays - day`.
    newOption.expiryDays = day + days;

    setOptions(prev => [...prev, newOption]);
  };

  const handleRemoveOption = (id: string) => {
    setOptions(prev => prev.filter(o => o.id !== id));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleStep(1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleStep(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleStep(0);
          break;
        case 'u':
        case 'U':
          handleStep(5);
          break;
        case 'd':
        case 'D':
          handleStep(-5);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStep]);

  useEffect(() => {
    if (day > 0 && day % 4 === 0) {
      setLoadingInsight(true);
      getMarketInsights(SYMBOL, price, day, history).then(res => {
        setInsight(res);
        setLoadingInsight(false);
      });
    }
  }, [day, price, history]);

  const resetSimulation = () => {
    setPrice(INITIAL_STOCK_PRICE);
    setDay(0);
    // Recalculate initial prices for default options
    setOptions(INITIAL_OPTIONS.map(opt => {
      const T = opt.expiryDays / 365;
      const bs = calculateBlackScholes(
        INITIAL_STOCK_PRICE,
        opt.strike,
        T,
        RISK_FREE_RATE,
        opt.volatility,
        opt.type
      );
      return { ...opt, initialPrice: bs.price };
    }));
    setHistory([{ date: new Date().toLocaleDateString(), day: 0, price: INITIAL_STOCK_PRICE, changePercent: 0 }]);
    setInsight("Simulation reset. Use arrows to begin.");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto flex flex-col gap-6">
      
      {/* 1. Dashboard Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-chart-line text-white"></i>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white">
              OPTION<span className="text-emerald-500 italic">HUB</span>
            </h1>
          </div>
          <p className="text-slate-500 text-[11px] uppercase tracking-widest font-black">
            Environment: <span className="text-slate-300">{SYMBOL}</span> • QUANTIATIVE ANALYTICS
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-slate-900 border border-slate-800 px-5 py-2 rounded-xl shadow-lg">
            <p className="text-[10px] text-slate-500 uppercase font-bold">NVDA Price</p>
            <p className="text-2xl font-mono font-bold text-emerald-400">${price.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-5 py-2 rounded-xl shadow-lg">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Simulation Day</p>
            <p className="text-2xl font-mono font-bold text-white">+{day}</p>
          </div>
        </div>
      </header>

      {/* 2. Top Focused Option Table (Excel Style) */}
      <section className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="bg-slate-800/50 px-4 py-2 grid grid-cols-10 text-[10px] uppercase font-black text-slate-500 tracking-wider">
          <div>Contract</div>
          <div>Moneyness</div>
          <div>Tenor</div>
          <div>Last Price</div>
          <div>Delta</div>
          <div>Theta (1d)</div>
          <div>Intrinsic</div>
          <div>Extrinsic</div>
          <div>P/L %</div>
          <div className="text-right">Action</div>
        </div>
        <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
          {options.map((contract) => {
            const val = optionValues.find(v => v.contractId === contract.id);
            if (!val) return null;
            return (
              <OptionRow 
                key={contract.id} 
                contract={contract} 
                value={val} 
                currentStockPrice={price} 
                onDelete={handleRemoveOption}
              />
            );
          })}
          {options.length === 0 && (
            <div className="p-8 text-center text-slate-500 italic text-sm">
              No options in list. Add one below or reset simulation.
            </div>
          )}
        </div>
      </section>

      {/* 3. Lower Grid: Chart & Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-fit">
        
        {/* Left: Chart */}
        <div className="lg:col-span-8 bg-slate-900/30 rounded-2xl p-4 border border-slate-800">
          <PriceChart data={history} />
        </div>

        {/* Right: Controls & Insights */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Controls */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Command Center</h3>
              <button 
                onClick={resetSimulation}
                className="hover:rotate-180 transition-transform duration-500"
              >
                <i className="fa-solid fa-rotate-right text-slate-600 hover:text-white"></i>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button onClick={() => handleStep(1)} className="control-btn bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                <kbd className="kb-key">↑</kbd>
                <span className="btn-label">+1%</span>
              </button>
              <button onClick={() => handleStep(-1)} className="control-btn bg-rose-500/10 border-rose-500/20 text-rose-400">
                <kbd className="kb-key">↓</kbd>
                <span className="btn-label">-1%</span>
              </button>
              <button onClick={() => handleStep(0)} className="control-btn bg-slate-800/50 border-slate-700 text-slate-400">
                <kbd className="kb-key">→</kbd>
                <span className="btn-label">Flat</span>
              </button>
              <button onClick={() => handleStep(5)} className="control-btn col-span-1 bg-emerald-600/20 border-emerald-500/40 text-emerald-500 font-black">
                <kbd className="kb-key">U</kbd>
                <span className="btn-label">+5%</span>
              </button>
              <button onClick={() => handleStep(-5)} className="control-btn col-span-1 bg-rose-600/20 border-rose-500/40 text-rose-500 font-black">
                <kbd className="kb-key">D</kbd>
                <span className="btn-label">-5%</span>
              </button>
            </div>

            {/* Add Option Form */}
            <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/50 space-y-3">
              <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Add Custom Option</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] text-slate-600 uppercase font-bold">Strike</label>
                  <input 
                    type="number" 
                    value={newStrike}
                    onChange={(e) => setNewStrike(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs p-1.5 rounded focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-slate-600 uppercase font-bold">Days to Exp</label>
                  <input 
                    type="number" 
                    value={newDays}
                    onChange={(e) => setNewDays(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs p-1.5 rounded focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select 
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as OptionType)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-[10px] p-1.5 rounded focus:outline-none focus:border-emerald-500 font-bold uppercase"
                >
                  <option value={OptionType.CALL}>Call</option>
                  <option value={OptionType.PUT}>Put</option>
                </select>
                <button 
                  onClick={handleAddOption}
                  className="px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase rounded transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
              <p className="text-[9px] text-slate-500 text-center leading-relaxed">
                <i className="fa-solid fa-keyboard mr-1 opacity-50"></i>
                ARROW KEYS MAPPED TO ACTIONS. <br/>
                TIME ELAPSE: 1 DAY PER KEYPRESS.
              </p>
            </div>
          </div>

          {/* AI Insights */}
          <div className="flex-1 bg-indigo-950/20 border border-indigo-500/20 p-5 rounded-2xl relative overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <i className="fa-solid fa-brain text-indigo-400 text-xs"></i>
              <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Market Reasoning</h4>
            </div>
            <p className={`text-[11px] text-indigo-200/70 leading-relaxed italic ${loadingInsight ? 'animate-pulse' : ''}`}>
              {loadingInsight ? "Analyzing mathematical model drift..." : insight}
            </p>
            <div className="mt-auto pt-4 flex justify-between items-center text-[9px] text-slate-600 font-bold uppercase">
              <span>Dynamic Greeks</span>
              <span>Model: BS-M</span>
            </div>
          </div>

        </div>
      </div>

      <footer className="mt-4 pb-8 text-center">
        <div className="inline-flex items-center gap-4 px-6 py-2 bg-slate-900/30 rounded-full border border-slate-800/50">
          <span className="text-slate-600 text-[9px] uppercase font-black tracking-widest">Built for NVDA Analysis</span>
          <span className="h-3 w-px bg-slate-800"></span>
          <span className="text-slate-600 text-[9px] uppercase font-black tracking-widest">Real-time Theta Decay</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        .control-btn {
          @apply flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-95;
        }
        .kb-key {
          @apply px-1.5 py-0.5 bg-slate-950/80 rounded text-[10px] mb-1 font-bold shadow-inner;
        }
        .btn-label {
          @apply text-[9px] uppercase font-black tracking-tight;
        }
      `}</style>
    </div>
  );
};

export default App;
