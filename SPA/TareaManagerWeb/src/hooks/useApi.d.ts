import { useState, useEffect, useCallback } from 'react';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiReturn<T> extends ApiState<T> {
  execute: (...args: any[]) => Promise<T>;
}

export interface UseCrudApiReturn {
  create: (item: any) => Promise<any>;
  update: (id: number | string, item: any) => Promise<any>;
  remove: (id: number | string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export declare function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  dependencies?: any[]
): UseApiReturn<T>;

export declare function useCrudApi(baseUrl: string): UseCrudApiReturn; 