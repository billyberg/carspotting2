import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) redirect("/login");

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Sätt nytt lösenord
          </h1>
          <p className="text-sm text-muted">
            Välj ett lösenord som du kommer ihåg.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
