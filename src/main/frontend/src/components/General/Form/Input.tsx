import { LegacyRef, MutableRefObject, forwardRef, useEffect, useState } from "react";
import { InputErrorProps } from "../../../types";
import { QuestionMarkFill } from "../../../assets/icons/QuestionMarkFill";
import Tooltip from "./Tooltip";

type InputProps = {
  label: string;
  name?: string;
  id?: string;
  optional?: boolean;
  className?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  error?: null | InputErrorProps;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  ref?: LegacyRef<HTMLInputElement>;
  validators?: string[];
  schemeSize?: boolean;
  tooltip?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      name,
      id,
      optional,
      className,
      labelClassName,
      wrapperClassName,
      error,
      onChange,
      validators,
      schemeSize,
      tooltip,
      ...rest
    },
    ref
  ) => {
    const [errorMessage, setErrorMessage] = useState<null | string | undefined>(
      null
    );

    useEffect(() => {
      const mutableRef: MutableRefObject<HTMLInputElement | null> = ref as MutableRefObject<HTMLInputElement | null>;
      if (mutableRef && mutableRef.current) {
        mutableRef.current.setAttribute("validators", JSON.stringify(validators || []));
      }
    }, [validators, ref]);

    useEffect(() => {
      if (name) {
        const newErrorMessage =
          error?.inputName == name ? error.errorMessage : null;
        setErrorMessage(newErrorMessage);
      }
    }, [error, name]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      setErrorMessage(null);
      if (onChange) onChange(e);
    }

    return (
      <div className={`flex flex-col ${schemeSize ? "" : "mb-6"} ${wrapperClassName}`}>
        {!schemeSize && (
          <label
          htmlFor={name}
          className={`font-roboto flex gap-2 items-center ${labelClassName} ${
            errorMessage ? "!text-red" : ""
          }`}
        >
          {label}
          {optional && <p className="text-gray text-sm">{`(optional)`}</p>}
          {tooltip && (
              <div className="relative group flex items-center">
                <QuestionMarkFill className="text-lg text-gray-darker cursor-pointer" />
                <Tooltip text={tooltip} position="right"/>
              </div>
            )}
        </label>
        )}
        <div className="relative w-full group">
          <div className="absolute w-3 h-2 border-t-4 border-white top-[-2px] left-3">
            {schemeSize && (
              <label
              htmlFor={name}
              className={`absolute w-8.5 top-[-9px] left-0 text-xs text-center bg-white px-1 font-roboto flex gap-2 items-center ${labelClassName} ${
                errorMessage ? "!text-red" : "group-focus-within:text-blue group-hover:text-blue"
              }`}
            >
              {label}
            </label>
            )}
          </div>
          <input
            id={id}
            ref={ref}
            name={name}
            onChange={handleChange}
            className={`w-full max-w-[659px] font-roboto border border-gray ring-transparent rounded focus:outline-none focus:ring-blue ${className} ${
              errorMessage ? "!border-red !ring-red ring-1" : ""
            }
            ${schemeSize ? "px-2 py-1 ring-1 hover:border-blue" : "px-4 py-3 ring-2"}
            `}
            {...rest}
          />
        </div>
        <p className="text-red text-sm font-semibold">{errorMessage}</p>
      </div>
    );
  }
);

export default Input;
