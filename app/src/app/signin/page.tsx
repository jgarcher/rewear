import { Logo } from "@/components/Logo";
import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Sign in — ReWear",
};

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-12 flex flex-col items-center text-center">
          <Logo size={88} showWordmark={false} />
          <h1 className="mt-8 font-heading text-3xl font-medium tracking-tight text-charcoal sm:text-4xl">
            Welcome to ReWear.
          </h1>
          <p className="mt-3 text-base text-charcoal-soft">
            Open your closet, not another app.
          </p>
        </div>

        <AuthForm />

        <p className="mt-8 text-center text-xs text-charcoal-muted">
          We'll email you a sign-in link. No password to remember.
        </p>
      </div>
    </main>
  );
}
