import {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";

interface BaseProps {
  label: string;
  name: string;
  error?: string;
  className?: string;
}

interface InputFieldProps
  extends BaseProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "name"> {
  as?: "input";
  options?: never;
  rows?: never;
}

interface TextareaFieldProps
  extends BaseProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name"> {
  as: "textarea";
  options?: never;
}

interface SelectFieldProps
  extends BaseProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, "name"> {
  as: "select";
  options: { value: string; label: string }[];
  children?: ReactNode;
}

export type FormFieldProps =
  | InputFieldProps
  | TextareaFieldProps
  | SelectFieldProps;

const inputBase = (hasError: boolean) =>
  `w-full min-h-[48px] rounded-none border bg-neutral-50 px-4 py-3 text-base text-ink-900 placeholder:text-neutral-400 transition-all focus:bg-neutral-0 focus:outline-none focus:ring-2 focus:ring-brand-500/25 ${
    hasError
      ? "border-status-error focus:border-status-error"
      : "border-neutral-200 focus:border-brand-500"
  }`;

export function FormField(props: FormFieldProps) {
  const { label, name, error, className = "" } = props;
  const hasError = Boolean(error);
  const id = name;

  return (
    <div className={`flex flex-col ${className}`}>
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-wider text-neutral-500 mb-2"
      >
        {label}
      </label>

      {props.as === "textarea" ? (
        <textarea
          id={id}
          name={name}
          className={`${inputBase(hasError)} resize-none`}
          {...(props as Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name">)}
        />
      ) : props.as === "select" ? (
        <select
          id={id}
          name={name}
          className={inputBase(hasError)}
          {...(props as Omit<SelectHTMLAttributes<HTMLSelectElement>, "name">)}
        >
          {(props as SelectFieldProps).options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={name}
          className={inputBase(hasError)}
          {...(props as Omit<InputHTMLAttributes<HTMLInputElement>, "name">)}
        />
      )}

      {hasError && (
        <p className="mt-1.5 text-sm text-status-error">{error}</p>
      )}
    </div>
  );
}
