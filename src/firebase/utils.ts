import { auth } from './config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DatabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleDatabaseError(error: unknown, operationType: OperationType, path: string | null, shouldThrow: boolean = true) {
  let errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('Failed to get document because the client is offline') || errorMessage.includes('offline') || errorMessage.includes('permission_denied')) {
    errorMessage = 'Koneksi ke database lambat, offline, atau masalah izin. Beberapa data mungkin tidak muncul atau tertunda. ' + errorMessage;
    console.warn("Database issue:", errorMessage);
  }

  const errInfo: DatabaseErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  
  console.error('Database Error Details: ', JSON.stringify(errInfo));
  
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}

export function cn(...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]) {
  return inputs.filter(Boolean).join(' ');
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 8000, errorMessage: string = 'Koneksi lambat atau terputus. Silakan coba lagi.'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs))
  ]);
}
