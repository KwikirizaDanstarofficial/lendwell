export async function electronLogin(
  email: string,
  password: string
): Promise<{ success: boolean }> {
  return window.electron.login(email, password);
}

export async function electronLogout(): Promise<void> {
  const supabase = await import('@/lib/electron/supabase').then(m => m.getElectronSupabase());
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore network errors on logout — vault is cleared regardless
  }
  await window.electron.clearVault();
  import('@/lib/electron/supabase').then(m => m.resetElectronSupabase());
}
