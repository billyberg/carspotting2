import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Carspotting</h1>
          <p className="text-sm text-muted">
            Logga in med engångskod, lösenord eller Google
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
