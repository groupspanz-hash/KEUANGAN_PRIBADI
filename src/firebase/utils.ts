import { auth } from './config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, shouldThrow: boolean = true) {
  let errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('Failed to get document because the client is offline') || errorMessage.includes('offline')) {
    errorMessage = 'Koneksi ke database lambat atau offline. Beberapa data mungkin tidak muncul atau tertunda.';
    console.warn("Firestore Offline:", errorMessage);
  }

  const errInfo: FirestoreErrorInfo = {
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
  
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}

export function cn(...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]) {
  return inputs.filter(Boolean).join(' ');
}
