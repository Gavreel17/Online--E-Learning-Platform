import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-card-border bg-card shadow-lg rounded-2xl">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="text-2xl font-bold font-display text-primary">
            Page Not Found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The page you are looking for doesn't exist or has moved. Choose a space below to continue:
          </p>

          <div className="mt-6 space-y-2.5">
            <Link
              href="/student/dashboard"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-accent shadow-sm hover:opacity-95 transition-opacity"
            >
              <LayoutDashboard className="size-4" /> Go to Student Dashboard
            </Link>
            <Link
              href="/admin/dashboard"
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-border bg-card py-2.5 text-sm font-bold text-primary hover:bg-muted transition-colors"
            >
              <ShieldCheck className="size-4 text-teal-700" /> Go to Admin Dashboard
            </Link>
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-3.5" /> Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
