import type { InputHTMLAttributes } from "react";
import { useId } from "react";
import "./Input.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  id,
  className = "",
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  return (
    <div className="field">
      {label ? (
        <label className="field__label label-caps" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`field__input ${error ? "field__input--error" : ""} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <span id={`${inputId}-error`} className="field__error label-caps">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="field__hint label-caps">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
