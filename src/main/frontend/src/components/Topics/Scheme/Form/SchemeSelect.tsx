import { useEffect, useState } from "react";
import { InputErrorProps } from "../../../../types";

type SelectProps = {
  options: { label: string; value: string }[];
  label: string;
  name?: string;
  id?: string;
  className?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  error?: null | InputErrorProps;
  onChange?: () => void;
} & React.InputHTMLAttributes<HTMLSelectElement>;

const SchemeSelect: React.FC<SelectProps> = ({
  options,
  label,
  name,
  id,
  className,
  labelClassName,
  wrapperClassName,
  error,
  onChange,
  ...rest
}) => {
  const [errorMessage, setErrorMessage] = useState<null | string | undefined>(
    null
  );

  useEffect(() => {
    if (name) {
      const newErrorMessage =
        error?.inputName == name ? error.errorMessage : null;
      setErrorMessage(newErrorMessage);
    }
  }, [error, name]);

  function handleChange() {
    setErrorMessage(null);
    if (onChange) onChange();
  }

  return (
    <div className={`flex flex-col ${wrapperClassName}`}>
      <div className="relative w-full focus-within:text-blue">
        <div className="absolute w-8 border-t-4 border-white top-[-2px] left-3">
          <label
            htmlFor={name}
            className={`absolute w-8.5 top-[-9px] left-0 text-xs text-center bg-white px-1 font-roboto flex gap-2 items-center ${labelClassName} ${
              errorMessage ? "!text-red" : ""
            }`}
          >
            {label}
          </label>
        </div>
        <select
          id={id}
          onChange={handleChange}
          className={`w-full max-w-[330px] font-roboto cursor-pointer border border-gray ring-2 ring-transparent rounded px-1.5 py-1.5 focus:outline-none focus:text-black focus:ring-blue ${className} ${
            errorMessage ? "!border-red !ring-red ring-1" : ""
          }`}
          {...rest}
        >
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SchemeSelect;
