import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run code between createServerClient and getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPath = path.startsWith("/signin") || path.startsWith("/auth/");
  // Public preview pages — readable without auth (invite landing shows who invited you)
  const isPublicPath = path.startsWith("/invite/");

  if (!user && !isAuthPath && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    // Preserve the original path so the user lands back where they were trying to go
    const originalPath = path + (request.nextUrl.search ?? "");
    if (originalPath !== "/" && !originalPath.startsWith("/signin")) {
      url.searchParams.set("next", originalPath);
    } else {
      url.search = "";
    }
    return NextResponse.redirect(url);
  }

  if (user && path === "/signin") {
    const url = request.nextUrl.clone();
    // If they came in via ?next=..., honour it (relative paths only)
    const next = request.nextUrl.searchParams.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      url.pathname = next.split("?")[0];
      url.search = next.includes("?") ? next.substring(next.indexOf("?")) : "";
    } else {
      url.pathname = "/";
      url.search = "";
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
