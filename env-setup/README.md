## Seed vault

Edit `.env.local` with your keys, then run in **Command Prompt**:

```bat
copy "%USERPROFILE%\Desktop\env-setup\.env.local" "%APPDATA%\lendwell\.env"
"%PROGRAMFILES%\Lendwell\Lendwell.exe" --seed-vault "%APPDATA%\lendwell\.env"
```

Then launch `Lendwell.exe` normally.
