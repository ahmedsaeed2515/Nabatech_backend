import { Response } from "express";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  requestId?: string;
  // Legacy aliases
  token?: string;
  refreshToken?: string;
  user?: any;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    status: number;
    message: string;
    details?: any;
  };
  requestId?: string;
  // Legacy error message
  message?: string; 
}

export const ok = <T>(res: Response, data: T, legacyAliases?: any) => {
  const requestId = (res as any).requestId || res.locals.requestId;
  
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    requestId,
    ...legacyAliases
  };
  
  return res.status(200).json(response);
};

export const created = <T>(res: Response, data: T, legacyAliases?: any) => {
  const requestId = (res as any).requestId || res.locals.requestId;
  
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    requestId,
    ...legacyAliases
  };
  
  return res.status(201).json(response);
};


