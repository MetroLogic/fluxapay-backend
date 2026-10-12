import request from 'supertest';
import express from 'express';
import { healthRouter } from '../../src/routes/healthRoutes';

const testApp = express();
testApp.use(express.json());
testApp.use('/health', healthRouter);

describe('Health Endpoints Integration', () => {
  it('GET /health/liveness returns 200 with status live', async () => {
    const res = await request(testApp).get('/health/liveness');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('live');
    expect(res.body).toHaveProperty('timestamp');
  });
});
