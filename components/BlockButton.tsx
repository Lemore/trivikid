import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary";

type BlockButtonProps = {
  variant?: Variant;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
};

const base =
  "flex h-15 w-full items-center justify-center rounded-control text-[21px] font-bold transition-[transform,box-shadow] duration-100 select-none " +
  "focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-block-blue";

const pressable = "active:translate-y-[3px]";

const variants: Record<Variant, string> = {
  primary: `bg-block-blue text-white shadow-block-blue active:shadow-[0_2px_0_var(--color-block-blue-dark)] ${pressable}`,
  secondary: `border-[2.5px] border-block-blue bg-white text-block-blue shadow-block-tan active:shadow-[0_2px_0_var(--color-wood-tan)] ${pressable}`,
};

const disabledStyle = "cursor-not-allowed bg-wood-tan text-white shadow-none";

// Wooden-block style button. Renders a link when `href` is given, otherwise a <button>.
export function BlockButton({
  variant = "primary",
  href,
  onClick,
  disabled = false,
  children,
}: BlockButtonProps) {
  if (href && !disabled) {
    return (
      <Link href={href} className={`${base} ${variants[variant]}`}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${disabled ? disabledStyle : variants[variant]}`}
    >
      {children}
    </button>
  );
}
