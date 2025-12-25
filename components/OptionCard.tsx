
import React, { useEffect, useState } from 'react';
import { OptionContract, OptionValue, OptionType } from '../types';

interface OptionRowProps {
  contract: OptionContract;
  value: OptionValue;
  currentStockPrice: number;
  onDelete: (id: string) => void;
}

const OptionRow: React.FC<OptionRowProps> = ({ contract, value, currentStockPrice, onDelete }) => {
  const [highlight, setHighlight] = useState<'up' | 'down' | null>(null);
  const [prevPrice, setPrevPrice] = useState(value.price);

  useEffect(() => {
    if (value.price > prevPrice) {
      setHighlight('up');
      const timer = setTimeout(() => setHighlight(null), 500);
      return () => clearTimeout(timer);
    } else if (value.price < prevPrice) {
      setHighlight('down');
      const timer = setTimeout(() => setHighlight(null), 500);
      return () => clearTimeout(timer);
    }
    setPrevPrice(value.price);
  }, [value.price, prevPrice]);

  const isCall = contract.type === OptionType.CALL;
  const isExpired = value.price === 0 && value.intrinsicValue === 0;

  const moneyness = () => {
    const diff = ((contract.strike - currentStockPrice) / currentStockPrice) * 100;
    if (isCall) {
      if (diff < -15) return 'Deep ITM';
      if (diff < -2) return 'ITM';
      if (Math.abs(diff) <= 2) return 'ATM';
      return 'OTM';
    } else {
      if (diff > 15) return 'Deep ITM';
      if (diff > 2) return 'ITM';
      if (Math.abs(diff) <= 2) return 'ATM';
      return 'OTM';
    }
  };

  const calculatePnL = () => {
    if (!contract.initialPrice || contract.initialPrice === 0) return 0;
    return ((value.price - contract.initialPrice) / contract.initialPrice) * 100;
  };

  const pnl = calculatePnL();

  return (
    <div className={`grid grid-cols-10 items-center py-2 px-4 border-b border-slate-800/50 transition-colors duration-300 relative ${
      highlight === 'up' ? 'bg-emerald-500/10' : 
      highlight === 'down' ? 'bg-rose-500/10' : 
      'hover:bg-slate-800/30'
    } ${isExpired ? 'opacity-30' : ''}`}>
      
      {/* Type & Strike - Single Row */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded leading-none ${
          isCall ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
        }`}>
          {contract.type}
        </span>
        <span className="text-sm font-mono font-bold text-white">${contract.strike}</span>
      </div>

      {/* Moneyness */}
      <div className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap">
        {moneyness()}
      </div>

      {/* Expiry */}
      <div className="text-xs text-slate-400 font-mono whitespace-nowrap">
        {contract.expiryDays}d
      </div>

      {/* PRICE */}
      <div className={`text-sm font-mono font-bold transition-colors whitespace-nowrap ${
        highlight === 'up' ? 'text-emerald-400' : highlight === 'down' ? 'text-rose-400' : 'text-white'
      }`}>
        ${value.price.toFixed(2)}
      </div>

      {/* DELTA */}
      <div className={`text-xs font-mono whitespace-nowrap ${value.delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {value.delta.toFixed(3)}
      </div>

      {/* THETA */}
      <div className="text-xs font-mono text-rose-400/80 whitespace-nowrap">
        {value.theta.toFixed(3)}
      </div>

      {/* INTRINSIC */}
      <div className="text-xs font-mono text-slate-400 whitespace-nowrap">
        ${value.intrinsicValue.toFixed(2)}
      </div>

      {/* EXTRINSIC */}
      <div className="text-xs font-mono text-slate-200 whitespace-nowrap">
        ${value.extrinsicValue.toFixed(2)}
      </div>

      {/* P/L % */}
      <div className={`text-xs font-mono font-bold whitespace-nowrap ${
        pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-rose-400' : 'text-slate-500'
      }`}>
        {pnl > 0 ? '+' : ''}{pnl.toFixed(1)}%
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end">
        <button 
          onClick={() => onDelete(contract.id)}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-800/50 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
          title="Delete Contract"
        >
          <i className="fa-solid fa-trash-can text-[10px]"></i>
        </button>
      </div>

      {isExpired && (
        <div className="absolute inset-0 bg-slate-900/40 pointer-events-none flex items-center justify-center z-10">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Expired</span>
        </div>
      )}
    </div>
  );
};

export default OptionRow;
