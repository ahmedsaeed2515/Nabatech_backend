export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor({
    message,
    statusCode,
    code,
    isOperational = true,
    details
  }: {
    message: string;
    statusCode: number;
    code: string;
    isOperational?: boolean;
    details?: any;
  }) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    
    Error.captureStackTrace(this);
  }
}


