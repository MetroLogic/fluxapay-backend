jest.mock('@stellar/stellar-sdk', () => ({
  Horizon: {
    Server: jest.fn().mockImplementation(() => ({
      transactions: jest.fn().mockReturnValue({
        transaction: jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValue({ successful: true, memo: 'FLX-TEST' }),
        }),
      }),
      payments: jest.fn().mockReturnValue({
        forTransaction: jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValue({
            records: [
              { asset_code: 'USDC', amount: '100.00', from: 'GXXXXXXXXXXXXXXXXX' },
            ],
          }),
        }),
      }),
    })),
  },
}));

import request from 'supertest';
import express from 'express';
import { chargeRouter } from '../../src/routes/chargeRoutes';

const testApp = express();
testApp.use(express.json());
testApp.use('/api/v1/charges', chargeRouter);

describe('Charges & Stellar Quotes API', () => {
  it('GET /api/v1/charges/rates returns valid SEP-0038 FX quote', async () => {
    const res = await request(testApp).get('/api/v1/charges/rates?amount=1650&currency=NGN');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('toCurrency', 'USDC');
    expect(res.body.data).toHaveProperty('amountOut');
    expect(res.body.data.amountOut).toBeGreaterThan(0);
  });
});
