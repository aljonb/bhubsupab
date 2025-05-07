import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  return (
    <div className="w-full max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Unauthorized Access</h1>
      
      <p className="text-gray-600 mb-6">
        You don't have permission to access this page.
      </p>
      
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
        
        <Button variant="outline" asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    </div>
  );
}