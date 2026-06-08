export async function electronStartup(): Promise<boolean> {
  try {
    return await window.electron.vaultExists();
  } catch {
    return false;
  }
}
