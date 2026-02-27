import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-semibold">Voixnotes</h1>
      <SignUp />
    </div>
  );
}
