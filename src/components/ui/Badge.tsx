import type { ReactNode } from "react";
import "./Badge.css";

type Tone = "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
}

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={`badge badge--${tone} label-caps`}>{children}</span>;
}
