import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server"; // Ensure this path is correct
import { User, AuthError } from "@supabase/supabase-js"; // Import Supabase types if needed by UserResponse

// Define route protection configuration (Moved from permissions.ts)
interface RouteConfig {
  pattern: string | RegExp;
  type: "exact" | "startsWith";
  protection: "authenticated" | "unauthenticated" | "role";
  roles?: string[];
  redirectTo: string;
}

// Route protection configuration (Moved from permissions.ts)
// TODO: Review and refine these rules based on actual app structure (e.g., /client, /barber routes)
const routeProtection: RouteConfig[] = [
  {
    pattern: "/protected", // Example protected route base
    type: "startsWith",
    protection: "authenticated",
    redirectTo: "/sign-in",
  },
  {
    pattern: "/barber", // Example barber-specific section
    type: "startsWith",
    protection: "role",
    roles: ["barber", "admin"], // Assuming 'barber' and 'admin' roles
    redirectTo: "/unauthorized", // Or redirect to '/sign-in' if not authenticated at all
  },
  {
    pattern: "/admin", // Example admin-specific section
    type: "startsWith",
    protection: "role",
    roles: ["admin"],
    redirectTo: "/unauthorized",
  },
  // Add rules for /client if needed
  // Add rules for auth pages like /sign-in, /sign-up to redirect if already authenticated
  {
    pattern: "/sign-in",
    type: "exact",
    protection: "unauthenticated",
    redirectTo: "/protected", // Or maybe /bookings or a dashboard
  },
  {
    pattern: "/sign-up",
    type: "exact",
    protection: "unauthenticated",
    redirectTo: "/protected", // Or maybe /bookings or a dashboard
  },
  // Default public route (example, adjust as needed)
  // {
  //   pattern: '/',
  //   type: 'exact',
  //   protection: 'unauthenticated', // Or maybe 'public'? Consider a 'public' protection type or just handle implicitly
  //   redirectTo: '/protected' // Example redirect if auth required implicitly elsewhere
  // },
  // Add other specific routes like /bookings/manage if they have different rules
];

// Unified session update and route protection function (Moved from permissions.ts)
export const updateSession = async (request: NextRequest) => {
  // This response object will be modified if redirects or header changes are needed.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = await createClient(); // Use the server client for middleware

    // Refresh session cookies - important for server components getting up-to-date session
    // This should ideally come *before* route protection checks that rely on the user object
    // Note: supabase.auth.getUser() SHOULD implicitly handle token refresh if needed.
    // Explicitly calling refreshSession might be redundant depending on Supabase client version/behavior.
    // Let's rely on getUser() for now, but keep refreshSession in mind if issues arise.
    // await supabase.auth.refreshSession(); // Potentially redundant, monitor if needed

    const userResponse = await supabase.auth.getUser();
    const user = userResponse.data.user;

    // Check each route configuration
    for (const route of routeProtection) {
      const path = request.nextUrl.pathname;
      const isMatch =
        route.type === "exact"
          ? path === route.pattern
          : typeof route.pattern === "string" // Added type check for startsWith
          ? path.startsWith(route.pattern)
          : route.pattern.test(path); // Handle RegExp patterns if used

      if (!isMatch) continue;

      const requiresAuth = route.protection === "authenticated";
      const requiresNoAuth = route.protection === "unauthenticated";
      const requiresRole = route.protection === "role";

      const isAuthenticated = !!user && !userResponse.error;

      // Handle authenticated routes
      if (requiresAuth && !isAuthenticated) {
        console.log(`Redirecting unauthenticated user from ${path} to ${route.redirectTo}`);
        return NextResponse.redirect(new URL(route.redirectTo, request.url));
      }

      // Handle unauthenticated routes (redirect if logged in)
      if (requiresNoAuth && isAuthenticated) {
         console.log(`Redirecting authenticated user from ${path} to ${route.redirectTo}`);
        return NextResponse.redirect(new URL(route.redirectTo, request.url));
      }

      // Handle role-based protection (only if user is authenticated)
      if (requiresRole && isAuthenticated && route.roles && route.roles.length > 0) {
        // Fetch user roles. Consider caching this if performance becomes an issue.
        // Assumes 'user_roles' table links users to roles, and 'roles' table has role names.
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("roles!inner(name)") // Select the name from the related roles table
          .eq("user_id", user.id);

        if (roleError) {
          console.error("Error fetching user roles:", roleError);
          // Decide how to handle error: forbid access, allow, show error page?
          // For safety, let's forbid access by redirecting.
          return NextResponse.redirect(new URL('/unauthorized?error=role_fetch_failed', request.url));
        }

        const userRoles = roleData?.map((item: any) => item.roles.name).filter(Boolean) || []; // Ensure roles.name exists
        const hasRequiredRole = route.roles.some(requiredRole => userRoles.includes(requiredRole));

        if (!hasRequiredRole) {
           console.log(`Redirecting user without required role (${route.roles.join(',')}) from ${path} to ${route.redirectTo}`);
          return NextResponse.redirect(new URL(route.redirectTo, request.url));
        }
        // If user has the role, proceed to the next middleware or the route handler
      }

      // If a matching route rule was processed and didn't redirect, break the loop
      // (assuming the first matching rule is the most specific one intended)
       break;
    }

    // If no protection rule caused a redirect, return the response (potentially updated by Supabase client)
    return response;

  } catch (e) {
    console.error("Error in middleware:", e);
    // Return the original unmodified response or handle error state appropriately
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};

// We might need the Supabase client instance type if we pass it around,
// but createClient() seems to handle it internally here.
// export type { SupabaseClient } from '@supabase/supabase-js';
