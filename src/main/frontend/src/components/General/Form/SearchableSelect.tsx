import { forwardRef, useEffect, useRef, useState, useCallback } from "react";
import { InputErrorProps } from "../../../types";
import { ArrowDown } from "../../../assets/icons/ArrowDown";
import { ArrowUp } from "../../../assets/icons/ArrowUp";
import { Search } from "../../../assets/icons/Search";

type SelectOption = {
  label: string;
  value: string;
};

type SearchableSelectProps = {
  options: SelectOption[];
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
  placeholder?: string;
} & React.InputHTMLAttributes<HTMLSelectElement>;

const SearchableSelect = forwardRef<HTMLSelectElement, SearchableSelectProps>(
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
      placeholder = "Search...",
      ...rest
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredOptions, setFilteredOptions] = useState(options);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<SelectOption | null>(null);
    const [errorMessage, setErrorMessage] = useState<null | string | undefined>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement>(null);

    // Sync with external ref
    useEffect(() => {
      if (ref && typeof ref === 'object' && ref.current !== hiddenSelectRef.current) {
        (ref as React.MutableRefObject<HTMLSelectElement | null>).current = hiddenSelectRef.current;
      }
    }, [ref]);

    useEffect(() => {
      if (name) {
        const newErrorMessage =
          error?.inputName === name ? error.errorMessage : null;
        setErrorMessage(newErrorMessage);
      }
    }, [error, name]);

    // Initialize selected option from value prop
    useEffect(() => {
      if (value) {
        const option = options.find(opt => opt.value === value);
        setSelectedOption(option || null);
      }
    }, [value, options]);

    // Filter options based on search term
    useEffect(() => {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
      setHighlightedIndex(0);
    }, [searchTerm, options]);

    const selectOption = useCallback((option: SelectOption) => {
      setSelectedOption(option);
      setSearchTerm("");
      setIsOpen(false);
      
      // Update hidden select value and trigger onChange
      if (hiddenSelectRef.current) {
        hiddenSelectRef.current.value = option.value;
        if (onChange) {
          const syntheticEvent = {
            target: hiddenSelectRef.current,
            currentTarget: hiddenSelectRef.current,
          } as React.ChangeEvent<HTMLSelectElement>;
          onChange(syntheticEvent);
        }
      }
    }, [onChange]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;
      
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          if (isOpen && filteredOptions[highlightedIndex]) {
            selectOption(filteredOptions[highlightedIndex]);
          } else {
            setIsOpen(true);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex(prev => 
              prev < filteredOptions.length - 1 ? prev + 1 : prev
            );
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSearchTerm("");
          break;
      }
    };

    const handleClickOutside = useCallback((event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }, []);

    useEffect(() => {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [handleClickOutside]);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen]);

    return (
      <div className={`flex flex-col mb-6 ${wrapperClassName}`}>
        <label
          htmlFor={name}
          className={`font-roboto flex gap-2 items-center ${labelClassName} ${
            errorMessage ? "!text-red" : ""
          }`}
        >
          {label}
          {!optional && <span className="text-red ml-1">*</span>}
          {optional && <p className="text-gray text-sm">{`(optional)`}</p>}
        </label>
        
        <div ref={containerRef} className="relative w-full">
          <div className="absolute w-3 h-2 border-t-4 border-white top-[-2px] left-3"></div>
          
          {/* Hidden select for form validation */}
          <select
            ref={hiddenSelectRef}
            name={name}
            id={id}
            value={selectedOption?.value || ""}
            onChange={() => {}} // Controlled by selectOption function
            className="sr-only"
            disabled={disabled}
            {...rest}
          >
            <option value="">Select an option</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom dropdown interface */}
          <div
            className={`w-full max-w-[330px] font-roboto border border-gray ring-2 ring-transparent rounded px-4 py-3 focus-within:outline-none focus-within:ring-blue ${className} ${
              errorMessage ? "!border-red !ring-red ring-1" : ""
            } ${
              disabled ? "cursor-not-allowed bg-gray-100" : "cursor-pointer"
            }`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            tabIndex={disabled ? -1 : 0}
          >
            <div className="flex items-center justify-between">
              <span className={`truncate pr-2 ${selectedOption ? "text-black" : "text-gray"}`}>
                {selectedOption ? selectedOption.label : "Select an option"}
              </span>
              <div className="ml-2 flex-shrink-0">
                {isOpen ? (
                  <ArrowUp className="w-4 h-4 text-gray-600" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-gray-600" />
                )}
              </div>
            </div>
          </div>

          {/* Dropdown */}
          {isOpen && !disabled && (
            <div className="absolute z-50 w-full max-w-[330px] mt-1 bg-white border border-gray rounded shadow-lg max-h-60 overflow-hidden">
              {/* Search input */}
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Options list */}
              <div className="overflow-y-auto max-h-48">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-gray-500 text-center">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <div
                      key={option.value}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 truncate ${
                        index === highlightedIndex ? "bg-blue-50" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectOption(option);
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      title={option.label}
                    >
                      {option.label}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {errorMessage && (
          <p className="text-red text-sm mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);

SearchableSelect.displayName = "SearchableSelect";

export default SearchableSelect;