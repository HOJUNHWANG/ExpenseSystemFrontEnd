import * as React from "react";
import { cn } from "@/lib/utils";

const TooltipContext = React.createContext({ open: false });

function TooltipProvider({ children }) {
  return <>{children}</>;
}

function Tooltip({ children }) {
  const [open, setOpen] = React.useState(false);
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-flex">{children}</div>
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({ children, asChild, ...props }) {
  const { setOpen } = React.useContext(TooltipContext);
  const handlers = {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { ...props, ...handlers });
  }
  return (
    <button type="button" {...props} {...handlers}>
      {children}
    </button>
  );
}

function TooltipContent({ className, sideOffset = 4, children, ...props }) {
  const { open } = React.useContext(TooltipContext);
  if (!open) return null;
  return (
    <div
      className={cn(
        "absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
