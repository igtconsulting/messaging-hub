import { ChangeEvent, useEffect, useRef, useState } from "react";
import { InputErrorProps } from "../../../types";

type SelectOption<T> = {
  label: string;
  value: T;
};

type GroupedOption<T> = {
  label: string;
  options: SelectOption<T>[];
};

type SelectProps<T> = {
  options: SelectOption<T>[] | GroupedOption<T>[];
  label: string;
  name?: string;
  optional?: boolean;
  className?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  error?: null | InputErrorProps;
  onChange?: (values: T[]) => void;
  value?: T[];
  disabled?: boolean;
};

const MultiSelect = (
  <T,>(
    {
      options,
      label,
      name,
      optional,
      className,
      labelClassName,
      wrapperClassName,
      error,
      onChange,
      value = [],
      disabled = false,
    }: SelectProps<T>,
  ) => {
    const [selectedValues, setSelectedValues] = useState<T[]>(value);
    const [errorMessage, setErrorMessage] = useState<null | string | undefined>(
      null
    );
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (name) {
        const newErrorMessage =
          error?.inputName === name ? error.errorMessage : null;
        setErrorMessage(newErrorMessage);
      }
    }, [error, name]);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(event.target as Node)
        ) {
          setDropdownOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    function handleOptionChange(
      event: ChangeEvent<HTMLInputElement>,
      optionValue: T
    ) {
      let updatedValues: T[];

      if (event.target.checked) {
        updatedValues = [...selectedValues, optionValue];
      } else {
        updatedValues = selectedValues.filter((val) => val !== optionValue);
      }

      setSelectedValues(updatedValues);
      if (onChange) onChange(updatedValues);
    }

    function toggleDropdown() {
      setDropdownOpen(!dropdownOpen);
    }

    function getSelectedLabels(): string {
      return selectedValues
        .map((val) => {
          for (const option of options) {
            if ("options" in option) {
              const foundOption = option.options.find(
                (opt) => opt.value === val
              );
              if (foundOption) return foundOption.label;
            } else if (option.value === val) {
              return option.label;
            }
          }
          return val as unknown as string; // Fallback if label is not found
        })
        .join(", ");
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
        <div className="relative max-w-[330px]" ref={wrapperRef}>
          <div
            onClick={toggleDropdown}
            className={`w-full max-w-[330px] font-roboto border ${
              dropdownOpen ? "ring-blue ring-2" : "border-gray"
            } rounded px-4 py-3 cursor-pointer ${
              disabled ? "cursor-not-allowed" : ""
            } ${className}`}
          >
            <div className="absolute top-[-2px] left-3 w-3 h-2 border-t-4 border-white"></div>
            {selectedValues.length > 0 ? getSelectedLabels() : "Select options"}
          </div>
          {dropdownOpen && (
            <div className="absolute w-full max-w-[330px] bg-white border border-gray rounded mt-1 z-10">
              {options.map((option) =>
                "options" in option ? (
                  <div key={option.label}>
                    <div className="px-4 py-2 font-bold">{option.label}</div>
                    {option.options.map((opt) => (
                      <label
                        key={opt.value as unknown as string}
                        className="flex items-center px-4 py-2 hover:bg-gray-lightest cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedValues.includes(opt.value)}
                          onChange={(event) =>
                            handleOptionChange(event, opt.value)
                          }
                          className="hidden"
                          disabled={disabled}
                        />
                        <span
                          className={`w-5 h-5 flex items-center justify-center border border-gray rounded mr-2 ${
                            selectedValues.includes(opt.value)
                              ? "bg-blue-500"
                              : "bg-white"
                          }`}
                        >
                          {selectedValues.includes(opt.value) && (
                            <span className="w-3 h-3 bg-blue rounded"></span>
                          )}
                        </span>
                        {opt.label}
                      </label>
                    ))}
                  </div>
                ) : (
                  <label
                    key={option.value as unknown as string}
                    className="flex items-center px-2 py-1 hover:bg-gray-lightest cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option.value)}
                      onChange={(event) =>
                        handleOptionChange(event, option.value)
                      }
                      className="hidden"
                      disabled={disabled}
                    />
                    <span
                      className={`w-4 h-4 flex items-center justify-center border border-gray rounded mr-2 ${
                        selectedValues.includes(option.value)
                          ? "bg-blue"
                          : "bg-white"
                      }`}
                    >
                      {selectedValues.includes(option.value) && (
                        <span className="w-3 h-3 bg-blue rounded"></span>
                      )}
                    </span>
                    {option.label}
                  </label>
                )
              )}
            </div>
          )}
          {errorMessage && (
            <div className="text-red-500 text-sm mt-1">{errorMessage}</div>
          )}
        </div>
      </div>
    );
  }
);

export default MultiSelect;
