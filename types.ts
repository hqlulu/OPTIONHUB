
export enum OptionType {
  CALL = 'CALL',
  PUT = 'PUT'
}

export interface OptionContract {
  id: string;
  strike: number;
  type: OptionType;
  expiryDays: number; // Initial days to expiry
  volatility: number;
  initialPrice?: number; // The price when the contract was first simulated/added
}

export interface SimulationStep {
  date: string;
  day: number;
  price: number;
  changePercent: number;
}

export interface OptionValue {
  contractId: string;
  price: number;
  delta: number;
  theta: number;
  intrinsicValue: number;
  extrinsicValue: number;
}
