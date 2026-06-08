export async function sendElectronSms(to: string, message: string) {
  return window.electron.sendSms(to, message);
}
