import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '../../src/errors/AppError';

describe('AppError Hierarchy', () => {
  it('should instantiate AppError with default values', () => {
    const error = new AppError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  it('should correctly set status code for BadRequestError', () => {
    const details = [{ field: 'email', message: 'Required' }];
    const error = new BadRequestError('Invalid input', details);
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual(details);
  });

  it('should correctly set status code for UnauthorizedError', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
  });

  it('should correctly set status code for ForbiddenError', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
  });

  it('should correctly set status code for NotFoundError', () => {
    const error = new NotFoundError('User not found');
    expect(error.statusCode).toBe(404);
  });

  it('should correctly set status code for ConflictError', () => {
    const error = new ConflictError('Email already registered');
    expect(error.statusCode).toBe(409);
  });
});
