
import { OptionType } from '../types';

/**
 * Standard Normal Cumulative Distribution Function
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) return 1 - d * p;
  return d * p;
}

/**
 * Black-Scholes Option Pricing Model
 * @param S Current stock price
 * @param K Strike price
 * @param T Time to expiration (in years)
 * @param r Risk-free interest rate
 * @param sigma Volatility
 * @param type Call or Put
 */
export function calculateBlackScholes(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: OptionType
) {
  if (T <= 0) {
    // At expiry
    const intrinsic = type === OptionType.CALL ? Math.max(0, S - K) : Math.max(0, K - S);
    return {
      price: intrinsic,
      delta: 0,
      theta: 0,
      intrinsicValue: intrinsic,
      extrinsicValue: 0
    };
  }

  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  let price: number;
  let delta: number;

  if (type === OptionType.CALL) {
    price = S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
    delta = normalCDF(d1);
  } else {
    price = K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
    delta = normalCDF(d1) - 1;
  }

  // Calculate Theta (Daily)
  const thetaTerm1 = -(S * sigma * Math.exp(-(d1 * d1) / 2)) / (2 * Math.sqrt(2 * Math.PI) * Math.sqrt(T));
  let theta: number;
  if (type === OptionType.CALL) {
    theta = (thetaTerm1 - r * K * Math.exp(-r * T) * normalCDF(d2)) / 365;
  } else {
    theta = (thetaTerm1 + r * K * Math.exp(-r * T) * normalCDF(-d2)) / 365;
  }

  const intrinsic = type === OptionType.CALL ? Math.max(0, S - K) : Math.max(0, K - S);
  const extrinsic = price - intrinsic;

  return {
    price: Math.max(0, price),
    delta,
    theta,
    intrinsicValue: intrinsic,
    extrinsicValue: Math.max(0, extrinsic)
  };
}
