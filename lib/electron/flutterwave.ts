export async function getElectronFlutterwavePublicKey(): Promise<string> {
  const config = await window.electron.getConfig();
  return config.flutterwavePublicKey;
}

export async function verifyPayment(transactionId: string) {
  return window.electron.verifyPayment(transactionId);
}
