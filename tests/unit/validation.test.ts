import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from '../../src/middlewares/validateRequest';
import { BadRequestError } from '../../src/errors/AppError';

describe('Validation Middleware', () => {
  it('should pass validation when body schema matches', async () => {
    const schema = {
      body: z.object({
        email: z.string().email(),
      }),
    };

    const req = {
      body: { email: 'merchant@fluxapay.com' },
    } as unknown as Request;

    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    const middleware = validateRequest(schema);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should pass BadRequestError when body fails validation', async () => {
    const schema = {
      body: z.object({
        email: z.string().email(),
      }),
    };

    const req = {
      body: { email: 'invalid-email' },
    } as unknown as Request;

    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    const middleware = validateRequest(schema);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
  });
});
