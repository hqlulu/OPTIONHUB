
import { OptionContract, OptionType } from './types';

export const INITIAL_STOCK_PRICE = 130.0;
export const RISK_FREE_RATE = 0.045; // 4.5%
export const SYMBOL = "NVDA";

export const INITIAL_OPTIONS: OptionContract[] = [
  // Short Term (1 Week)
  { id: 'c-atm-7',  strike: 130, type: OptionType.CALL, expiryDays: 7,  volatility: 0.50 },
  { id: 'p-atm-7',  strike: 130, type: OptionType.PUT,  expiryDays: 7,  volatility: 0.50 },
  
  // Medium Term (1 Month)
  { id: 'c-itm-30', strike: 110, type: OptionType.CALL, expiryDays: 30, volatility: 0.45 },
  { id: 'c-atm-30', strike: 130, type: OptionType.CALL, expiryDays: 30, volatility: 0.45 },
  { id: 'c-otm-30', strike: 150, type: OptionType.CALL, expiryDays: 30, volatility: 0.45 },
  { id: 'p-itm-30', strike: 150, type: OptionType.PUT,  expiryDays: 30, volatility: 0.45 },
  { id: 'p-atm-30', strike: 130, type: OptionType.PUT,  expiryDays: 30, volatility: 0.45 },
  { id: 'p-otm-30', strike: 110, type: OptionType.PUT,  expiryDays: 30, volatility: 0.45 },
  
  // Long Term (6 Months / ~180 Days)
  { id: 'c-itm-180', strike: 100, type: OptionType.CALL, expiryDays: 180, volatility: 0.38 },
  { id: 'c-atm-180', strike: 130, type: OptionType.CALL, expiryDays: 180, volatility: 0.38 },
  { id: 'c-otm-180', strike: 160, type: OptionType.CALL, expiryDays: 180, volatility: 0.38 },
  { id: 'p-atm-180', strike: 130, type: OptionType.PUT,  expiryDays: 180, volatility: 0.38 },
];
