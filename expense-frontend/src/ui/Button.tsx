// Re-export from shadcn button for backward compatibility
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ButtonLinkProps {
  to: string;
  variant?: string;
  size?: string;
  className?: string;
  children: ReactNode;
  [key: string]: unknown;
}

function ButtonLink({ to, variant = 'outline', size = 'sm', className, children, ...props }: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium',
        className
      )}
      {...(props as object)}
    >
      {children}
    </Link>
  );
}

export { Button, ButtonLink };
