import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';
import { AppError } from '../utils/app_error';

export const validateRequest = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      if (error && (error.name === 'ZodError' || Array.isArray(error.errors) || Array.isArray(error.issues))) {
        const issues = error.issues || error.errors;
        const message = issues.map((e: any) => `${e.path?.join('.')} ${e.message}`).join(', ');
        next(new AppError({
          message,
          statusCode: 400,
          code: 'VALIDATION_FAILED',
          details: issues
        }));
      } else {
        next(error);
      }
    }
  };
};
