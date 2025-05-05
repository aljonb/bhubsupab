'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/utils/supabase/client';

// Declare the Google type to avoid TypeScript errors
declare global {
  interface Window {
    google: any;
    handleCredentialResponse?: (response: any) => void;
  }
}

export default function GoogleSignInButton() {
  const supabase = createClient();

  useEffect(() => {
    // Define the callback function in the global scope for Google to call
    window.handleCredentialResponse = async (response) => {
      // Send the ID token to Supabase for authentication
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential
      });

      if (error) {
        console.error('Error signing in with Google:', error);
      } else {
        console.log('Successfully signed in with Google');
        // Let the server-side middleware handle the redirect
        window.location.href = '/auth/callback?next=/protected';
      }
    };

    // Load the Google script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    // Clean up
    return () => {
      document.body.removeChild(script);
      delete window.handleCredentialResponse;
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div
        id="g_id_onload"
        data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        data-context="signin"
        data-callback="handleCredentialResponse"
        data-auto_prompt="false"
      ></div>
      <div
        className="g_id_signin"
        data-type="standard"
        data-size="large"
        data-theme="outline"
        data-text="sign_in_with"
        data-shape="rectangular"
        data-logo_alignment="left"
      ></div>
    </div>
  );
}