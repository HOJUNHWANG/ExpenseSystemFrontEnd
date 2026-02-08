import { Link } from "react-router-dom";

const VARIANT = {
  primary: "bg-slate-900 text-white hover:bg-slate-800 border-slate-900",
  secondary: "bg-white text-slate-900 hover:bg-slate-50 border-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-700 border-red-600",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border-transparent",
};

const SIZE = {
  sm: "text-xs px-3 py-2 rounded-xl",
  md: "text-sm px-4 py-2 rounded-xl",
};

function clsx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "secondary",
  size = "sm",
  className,
  disabled,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-2 border font-medium disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap",
        VARIANT[variant] || VARIANT.secondary,
        SIZE[size] || SIZE.sm,
        className
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  to,
  variant = "secondary",
  size = "sm",
  className,
  ...props
}) {
  return (
    <Link
      to={to}
      className={clsx(
        "inline-flex items-center justify-center gap-2 border font-medium whitespace-nowrap",
        VARIANT[variant] || VARIANT.secondary,
        SIZE[size] || SIZE.sm,
        className
      )}
      {...props}
    />
  );
}
