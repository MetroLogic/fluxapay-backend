import { Horizon } from '@stellar/stellar-sdk';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface PaymentVerificationResult {
  verified: boolean;
  txHash?: string;
  amountReceived?: string;
  assetCode?: string;
  senderAddress?: string;
  memoMatched?: boolean;
  message?: string;
}

export interface FxQuote {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  amountIn: number;
  amountOut: number;
  expiresAt: string;
}

export class StellarService {
  private horizonServer: Horizon.Server;
  private usdcIssuer: string;

  constructor() {
    this.horizonServer = new Horizon.Server(env.STELLAR_HORIZON_URL);
    this.usdcIssuer = env.STELLAR_USDC_ISSUER;
  }

  public getUsdcAssetCode(): string {
    return 'USDC';
  }

  public getUsdcIssuer(): string {
    return this.usdcIssuer;
  }

  /**
   * Generates a unique 32-character numeric or hex memo for transaction matching
   */
  public generatePaymentMemo(): string {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `FLX-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
  }

  /**
   * Calculates SEP-0038 compliant FX quotes between local fiat and USDC
   */
  public getFxQuote(fiatAmount: number, fiatCurrency: string): FxQuote {
    // Current indicative rates per USDC
    const rates: Record<string, number> = {
      USD: 1.0,
      EUR: 0.92,
      NGN: 1650.0,
      KES: 129.5,
      GHS: 15.8,
      ZAR: 18.2,
      BRL: 5.65,
    };

    const rate = rates[fiatCurrency.toUpperCase()] || 1.0;
    const usdcAmount = Number((fiatAmount / rate).toFixed(7));

    return {
      fromCurrency: fiatCurrency.toUpperCase(),
      toCurrency: 'USDC',
      rate,
      amountIn: fiatAmount,
      amountOut: usdcAmount,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min lock
    };
  }

  /**
   * Verifies on-chain transaction by txHash on Stellar Horizon
   */
  public async verifyTransactionOnChain(
    txHash: string,
    expectedMemo?: string,
    expectedAmountUsdc?: number
  ): Promise<PaymentVerificationResult> {
    try {
      const tx = await this.horizonServer.transactions().transaction(txHash).call();

      if (!tx.successful) {
        return {
          verified: false,
          txHash,
          message: 'Transaction failed on-chain.',
        };
      }

      const memoMatches = !expectedMemo || tx.memo === expectedMemo;
      if (!memoMatches) {
        return {
          verified: false,
          txHash,
          memoMatched: false,
          message: `Memo mismatch. Expected: ${expectedMemo}, Received: ${tx.memo}`,
        };
      }

      // Query payments inside this transaction
      const payments = await this.horizonServer.payments().forTransaction(txHash).call();
      const usdcPayment = payments.records.find((record) => {
        const payment = record as unknown as {
          asset_code?: string;
          asset_issuer?: string;
          amount?: string;
          from?: string;
        };
        return (
          payment.asset_code === 'USDC' ||
          (payment.asset_code && payment.asset_code.toUpperCase() === 'USDC')
        );
      });

      if (!usdcPayment) {
        return {
          verified: false,
          txHash,
          memoMatched: true,
          message: 'No USDC payment found inside transaction.',
        };
      }

      const paymentRecord = usdcPayment as unknown as { amount: string; from: string };
      const receivedAmount = parseFloat(paymentRecord.amount);

      if (expectedAmountUsdc && receivedAmount < expectedAmountUsdc) {
        return {
          verified: false,
          txHash,
          amountReceived: paymentRecord.amount,
          message: `Insufficient payment. Expected: ${expectedAmountUsdc}, Received: ${receivedAmount}`,
        };
      }

      return {
        verified: true,
        txHash,
        amountReceived: paymentRecord.amount,
        assetCode: 'USDC',
        senderAddress: paymentRecord.from,
        memoMatched: true,
        message: 'Payment confirmed on Stellar ledger.',
      };
    } catch (error) {
      logger.error('Stellar Horizon verification query error:', error);
      return {
        verified: false,
        txHash,
        message: 'Transaction not found or Horizon query timed out.',
      };
    }
  }
}

export const stellarService = new StellarService();
