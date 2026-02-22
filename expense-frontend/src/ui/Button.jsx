// Re-export from shadcn button for backward compatibility
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ButtonLink({ to, variant = "outline", size = "sm", className, children, ...props }) {
  return (
    <Link to={to} className={cn("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium", className)} {...props}>
      {children}
    </Link>
  );
}

export { Button, ButtonLink };
