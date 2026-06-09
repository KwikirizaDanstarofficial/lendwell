export {};

declare global {
  interface Window {
    electron: {
      vaultExists:   () => Promise<boolean>;
      login:         (email: string, password: string) => Promise<{ success: boolean }>;
      getConfig:     () => Promise<{
        supabaseUrl:          string;
        supabaseAnonKey:      string;
        powersyncUrl:         string;
        egoSmsApiKey:         string;
        egoSmsUsername:       string;
        flutterwavePublicKey: string;
        flutterwaveSecretKey: string;
        accessToken:          string;
        refreshToken:         string;
      }>;
      clearVault:    () => Promise<{ success: boolean }>;
      verifyPayment: (transactionId: string) => Promise<any>;
      sendSms:       (to: string, message: string) => Promise<any>;
      getOfflineQueue:     () => Promise<any[]>;
      addToOfflineQueue:   (item: any) => Promise<{ success: boolean }>;
      clearOfflineQueue:   () => Promise<{ success: boolean }>;
      getPlatform:         () => Promise<string>;
      getDataPath:         () => Promise<string>;
      onFlushDb:           (cb: () => void) => void;
      removeFlushDbListener: () => void;
      dbFlushed:           () => Promise<void>;
    };
  }
}
