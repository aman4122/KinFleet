import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-white',
        secondary:
          'border-transparent bg-surface-elevated text-text-secondary',
        destructive:
          'border-transparent bg-danger/20 text-danger-light',
        warning:
          'border-transparent bg-accent/20 text-accent-light',
        success:
          'border-transparent bg-success/20 text-success-light',
        outline:
          'border-border text-text-secondary',
        info:
          'border-transparent bg-primary/20 text-primary-light',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
