import type { HTMLAttributes, ReactNode } from "react";
import "./Card.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  as?: "div" | "article" | "section";
}

export function Card({
  children,
  as: Tag = "div",
  className = "",
  ...rest
}: CardProps) {
  return (
    <Tag className={`card ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
