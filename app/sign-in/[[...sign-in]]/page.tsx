import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-semibold">Voixnotes</h1>
      <SignIn forceRedirectUrl="/record" />
    </div>
  );
}
