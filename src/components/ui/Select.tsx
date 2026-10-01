import type { SelectHTMLAttributes } from "react";
import { useId } from "react";
import "./Select.css";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
}

export function Select({
  label,
  options,
  id,
  className = "",
  ...rest
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className="select-field">
      {label ? (
        <label className="select-field__label label-caps" htmlFor={selectId}>
          {label}
        </label>
      ) : null}
      <div className="select-field__wrap">
        <select id={selectId} className={`select-field__select ${className}`} {...rest}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="select-field__arrow" aria-hidden="true">
          ▾
        </span>
      </div>
    </div>
  );
}
