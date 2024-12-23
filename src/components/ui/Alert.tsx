import { cn } from "@/lib/utils";

interface AlertProps {
  children: React.ReactNode;
  variant?: "default" | "error" | "warning" | "success";
  className?: string;
}

export function Alert({ children, variant = "default", className }: AlertProps) {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
  };

  return (
    <div
      className={cn(
        "rounded-lg p-4",
        variantClasses[variant],
        className
      )}
      role="alert"
    >
      {children}
    </div>
  );
}
