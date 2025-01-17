import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "../../../../assets/icons/ArrowDown";
import { InputErrorProps, SelectOption } from "../../../../types";
import { ArrowUp } from "../../../../assets/icons/ArrowUp";

type MultipleSelectProps = {
  multiple: true;
  value: SelectOption[];
  onChange: (value: SelectOption[]) => void;
};

type SingleSelectProps = {
  multiple?: false;
  value?: SelectOption;
  onChange: (value: SelectOption | undefined) => void;
};

type SelectProps = {
  options: SelectOption[];
  name?: string;
  label?: string;
  labelClassName?: string;
  disabled?: boolean;
  error?: null | InputErrorProps;
  onChange?: () => void;
} & (SingleSelectProps | MultipleSelectProps);

export function Select({
  multiple,
  value,
  onChange,
  options,
  name,
  label,
  labelClassName,
  error,
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');
  const containerRef = useRef<HTMLDivElement>(null);
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

//   function handleChange() {
//     setErrorMessage(null);
//     if (onChange) onChange();
//   }

  function selectOption(option: SelectOption) {
    if (multiple) {
      if (value.includes(option)) {
        onChange(value.filter((o) => o !== option));
      } else {
        onChange([...value, option]);
      }
    } else {
      if (option !== value) onChange(option);
    }
  }

  useEffect(() => {
    if (isOpen) {
      const rect = containerRef.current?.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - (rect?.bottom || 0);
      const spaceAbove = rect?.top || 0;
      setDropdownDirection(spaceBelow < 200 && spaceAbove > spaceBelow ? 'up' : 'down');
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (disabled) return; 
    const handler = (e: KeyboardEvent) => {
      if (e.target !== containerRef.current) return;
      switch (e.code) {
        case "Enter":
        case "Space":
          setIsOpen((prev) => !prev);
          if (isOpen) selectOption(options[highlightedIndex]);
          break;
        case "ArrowUp":
        case "ArrowDown": {
          if (!isOpen) {
            setIsOpen(true);
            break;
          }

          const newValue = highlightedIndex + (e.code === "ArrowDown" ? 1 : -1);
          if (newValue >= 0 && newValue < options.length) {
            setHighlightedIndex(newValue);
          }
          break;
        }
        case "Escape":
          setIsOpen(false);
          break;
      }
    };
    containerRef.current?.addEventListener("keydown", handler);

    return () => {
      containerRef.current?.removeEventListener("keydown", handler);
    };
  }, [isOpen, highlightedIndex, options]);

  return (
    <div
      ref={containerRef}
      onBlur={() => setIsOpen(false)}
      onClick={() => !disabled && setIsOpen((prev) => !prev)}
      tabIndex={0}
      className={`relative min-w-40 min-h-4 border ${disabled ? "cursor-not-allowed" : "cursor-pointer focus:border-blue focus:ring-1 focus:ring-blue hover:border-blue"} border-gray flex items-center gap-2 py-1 px-2 rounded outline-none text-small text-black dark:text-white dark:ring-gray-dark group`}
    >
      <span className="grow flex gap-2 flex-wrap text-small">
        {multiple
          ? value.map((v) => (
              <button
                key={v.value}
                onClick={(e) => {
                  e.stopPropagation();
                  selectOption(v);
                }}
                className={`flex items-center border border-gray rounded py-0.5 px-1 gap-1 cursor-pointer bg-transparent outline-none bg-white`}
              >
                {v.label}
                <span className={`text-xl text-gray`}>×</span>
              </button>
            ))
          : value?.label}
      </span>
      <div className={`bg-white self-stretch w-0.5`}></div>
      <div>
        {isOpen ? <ArrowUp className="text-xl text-gray-darker" /> : <ArrowDown className="text-xl text-gray-darker" />}
      </div>
      <div className="absolute w-8 border-t-4 border-white top-[-2px] left-3">
        <label
          htmlFor={name}
          className={`absolute w-8.5 top-[-9px] left-0 text-xs text-center bg-white px-1 font-roboto flex gap-2 items-center ${labelClassName} ${
            errorMessage ? "!text-red" : disabled ? "" : "group-focus-within:text-blue group-hover:text-blue"
          }`}
        >
          {label}
        </label>
      </div>
      <ul
        className={`absolute list-none max-h-60 overflow-y-auto rounded-md shadow-md w-full left-0 bg-white z-50 dark:bg-gray-800 ${
          isOpen ? "block" : "hidden"
        } ${dropdownDirection === 'up' ? 'bottom-full mb-0.5' : 'top-full mt-0.5'}`}
      >
        {options.map((option, index) => (
          <li
            onClick={(e) => {
              e.stopPropagation();
              selectOption(option);
              setIsOpen(false);
            }}
            onMouseEnter={() => setHighlightedIndex(index)}
            key={option.value}
            className={`cursor-pointer py-1 px-2 flex items-center gap-2 text-gray-darker ${
              index === highlightedIndex ? "bg-primary " : ""
            } cursor-pointer`}
          >
            <>
            {option.icon && <option.icon className="text-md" />}
            {option.label}
            </>
          </li>
        ))}
      </ul>
    </div>
  );
}
