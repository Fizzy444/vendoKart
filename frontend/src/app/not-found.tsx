import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[70vh] space-y-4">
      <div className="text-6xl font-extrabold text-artisan-500">404</div>
      <h1 className="text-2xl font-bold text-slate-100">Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md">
        The artisan workshop or craft marketplace page you are looking for does not exist or has moved.
      </p>
      <Link href="/dashboard">
        <Button size="sm">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Workspace
        </Button>
      </Link>
    </div>
  );
}
