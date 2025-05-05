import Hero from "@/components/ui/hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/lib/utils/supabase/check-env-vars";
import GoogleSignInButton from "@/components/shared/GoogleSignInButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  return (
    <>
      <Hero />
      <main className="flex-1 flex flex-col gap-6 px-4">
        <h2 className="font-medium text-xl mb-4">Next steps</h2>
        {hasEnvVars ? <SignUpUserSteps /> : <ConnectSupabaseSteps />}
        
        {/* Add Google Sign In */}
        <div className="flex gap-2 items-center mt-4">
          <GoogleSignInButton />
        </div>
      </main>
    </>
  );
}
