import Link from "next/link";
import { AuthService } from "@/services/AuthService";
import { logoutAction } from "@/app/actions/authActions";

export async function Navbar() {
  const { user } = await AuthService.getSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-heading font-bold text-xl text-foreground">
              FASIH 3603
            </span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/"
              className="flex items-center text-sm font-medium text-primary transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            {user && (
              <Link
                href="/upload"
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Upload Progress
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <nav className="flex items-center space-x-1">
            {user ? (
              <form action={logoutAction}>
                <button 
                  type="submit" 
                  className="h-9 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-border bg-background shadow-sm hover:bg-muted text-foreground"
                >
                  Logout
                </button>
              </form>
            ) : (
              <Link 
                href="/login" 
                className="h-9 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90"
              >
                Login Admin
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
