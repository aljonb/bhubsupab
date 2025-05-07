import { signOutAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/ui/submit-button";

export default function PendingApproval() {
  return (
    <div className="w-full max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-2">
          Your barber account is currently pending approval from an administrator.
        </p>
        <p className="text-gray-600">
          You'll receive an email notification once your account has been reviewed.
        </p>
      </div>
      
      <FormMessage message={{ message: "Please wait for admin approval before accessing barber features." }} />
      
      <form className="mt-6">
        <SubmitButton formAction={signOutAction}>
          Sign Out
        </SubmitButton>
      </form>
    </div>
  );
}