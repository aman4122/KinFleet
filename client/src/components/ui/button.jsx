import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark disabled:pointer-events-none disabled:opacity-50 press-scale cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'gradient-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110',
        secondary:
          'bg-surface-elevated text-text-primary border border-border hover:bg-border hover:border-border-light',
        destructive:
          'gradient-danger text-white shadow-lg shadow-danger/25 hover:shadow-xl hover:shadow-danger/30 hover:brightness-110',
        outline:
          'border border-border bg-transparent text-text-primary hover:bg-surface-elevated hover:border-border-light',
        ghost:
          'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50',
        link:
          'text-primary-light underline-offset-4 hover:underline',
        success:
          'gradient-success text-white shadow-lg shadow-success/25 hover:shadow-xl hover:shadow-success/30 hover:brightness-110',
        accent:
          'gradient-accent text-white shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:brightness-110',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        xl: 'h-14 rounded-2xl px-10 text-lg',
        icon: 'h-10 w-10 rounded-xl',
        'icon-sm': 'h-8 w-8 rounded-lg',
        'icon-lg': 'h-12 w-12 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
