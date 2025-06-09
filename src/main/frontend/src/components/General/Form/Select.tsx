import { ChangeEvent, forwardRef, useEffect, useState } from "react";
import { InputErrorProps } from "../../../types";

type SelectOption = {
  label: string;
  value: string;
};

type GroupedOption = {
  label: string;
  options: SelectOption[];
};

type SelectProps = {
  options: SelectOption[] | GroupedOption[];
  label: string;
  name?: string;
  id?: string;
  optional?: boolean;
  className?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  error?: null | InputErrorProps;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  value?: string;
  disabled?: boolean;
} & React.InputHTMLAttributes<HTMLSelectElement>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      label,
      name,
      id,
      optional,
      className,
      labelClassName,
      wrapperClassName,
      error,
      onChange,
      value,
      disabled = false,
      ...rest
    },
    ref
  ) => {
    const [errorMessage, setErrorMessage] = useState<null | string | undefined>(
      null
    );

    useEffect(() => {
      if (name) {
        const newErrorMessage =
          error?.inputName === name ? error.errorMessage : null;
        setErrorMessage(newErrorMessage);
      }
    }, [error, name]);

    function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
      setErrorMessage(null);
      if (onChange) onChange(event);
    }

    return (
      <div className={`flex flex-col mb-6 ${wrapperClassName}`}>
        <label
          htmlFor={name}
          className={`font-roboto flex gap-2 items-center ${labelClassName} ${
            errorMessage ? "!text-red" : ""
          }`}
        >
          {label}
          {optional && <p className="text-gray text-sm">{`(optional)`}</p>}
        </label>
        <div className="relative w-full">
          <div className="absolute w-3 h-2 border-t-4 border-white top-[-2px] left-3"></div>
          <select
            id={id}
            ref={ref}
            onChange={handleChange}
            className={`w-full max-w-[330px] font-roboto border border-gray ring-2 ring-transparent rounded px-4 py-3 focus:outline-none focus:ring-blue ${className} ${
              errorMessage ? "!border-red !ring-red ring-1" : ""
            }
            ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
            `}
            value={value}
            disabled={disabled}
            {...rest}
          >
            {options.map((option) =>
              'options' in option ? (
                <optgroup label={option.label} key={option.label}>
                  {option.options.map((opt) => (
                    <option value={opt.value} key={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ) : (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              )
            )}
          </select>
        </div>
      </div>
    );
  }
);

export default Select;
