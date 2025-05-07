"use server";

import { encodedRedirect } from "@/lib/utils";
import { createClient } from "@/lib/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const userRole = formData.get("userRole")?.toString() || "client"; // Default to client
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  // Sign up the user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        role: userRole, // Store role in auth metadata
      },
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  // If user is a barber, create a barber profile
  if (userRole === "barber" && data.user) {
    const { error: profileError } = await supabase
      .from("barber_profiles")
      .insert({
        user_id: data.user.id,
        status: "pending",
      });

    if (profileError) {
      console.error("Failed to create barber profile:", profileError);
      // Continue with sign-up even if profile creation fails, but log the error
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link." +
    (userRole === "barber" ? " Your barber account is pending approval." : ""),
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Check if user is a barber, and if so, check their approval status
  if (data.user?.user_metadata?.role === "barber") {
    const { data: barberData, error: barberError } = await supabase
      .from("barber_profiles")
      .select("status")
      .eq("user_id", data.user.id)
      .single();

    if (barberError) {
      console.error("Error fetching barber profile:", barberError);
      return encodedRedirect("error", "/sign-in", "Error verifying your account status");
    }

    if (barberData.status === "pending") {
      return encodedRedirect(
        "success", 
        "/pending-approval", 
        "Your barber account is pending approval from an administrator"
      );
    }

    if (barberData.status === "rejected") {
      return encodedRedirect(
        "error", 
        "/sign-in", 
        "Your barber application has been rejected"
      );
    }
  }

  // Redirect based on role
  if (data.user?.user_metadata?.role === "barber") {
    return redirect("/barber/dashboard");
  } else {
    return redirect("/client/dashboard");
  }
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
