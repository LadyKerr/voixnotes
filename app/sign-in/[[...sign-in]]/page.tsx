import Image from "next/image";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center gap-6">
      <div className="flex items-center gap-2">
        <Image src="/logo.svg" alt="Voixnotes logo" width={32} height={32} />
        <h1 className="text-2xl font-semibold">Voixnotes</h1>
      </div>
      <SignIn forceRedirectUrl="/record" />
    </div>
  );
}
