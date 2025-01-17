type ButtonProps = {
  color: string;
  className?: string;
  text?: string;
  type?: "button" | "submit" | "reset" | undefined;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  iconPosition?: "center" | "left" | "right";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  tableButton?: boolean;
  padding?: boolean;
};

type Colors = {
  [key: string]: string;
};

const colors: Colors = {
  none: "",
  blue: "bg-blue border-transparent enabled:hover:bg-blue-darker text-white focus:ring-4 focus:ring-blue dark:bg-blue-darker dark:enabled:hover:bg-blue-dark",
  green:
    "bg-green border-transparent enabled:hover:bg-green-darker text-white focus:ring-4 focus:ring-green dark:bg-green-darker dark:enabled:hover:bg-green-dark",
  purple:
    "bg-purple border-transparent enabled:hover:bg-purple-darker text-white focus:ring-4 focus:ring-purple dark:bg-purple-darker dark:enabled:hover:bg-purple-dark",
  red: "bg-red border-transparent enabled:hover:bg-red-darker text-white focus:ring-4 focus:ring-red dark:bg-red-darker dark:enabled:hover:bg-red-dark",
  gray: "bg-gray border-transparent enabled:hover:bg-igtgray-600 text-white focus:ring-4 focus:ring-igtgray-300 dark:bg-igtgray-600 dark:enabled:hover:bg-igtgray-700",
};

const Button: React.FC<ButtonProps> = ({
  color,
  className,
  text,
  type,
  icon: Icon,
  iconPosition = "left",
  onClick,
  disabled = false,
  tableButton = false,
  padding = true,
}) => {
  return (
    <button
      className={`${
        colors[color]
      } text-base uppercase font-medium font-roboto rounded-md transition-all duration-150 flex justify-center items-center ${className} 
      ${disabled ? "opacity-50" : ""}
      ${padding && (tableButton ? "px-3 py-1.5" : "min-w-[8.5rem] px-5  py-2")}
      `}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {Icon && iconPosition === "center" && <Icon className="p-0.5 text-2xl" />}
      {Icon && iconPosition === "left" && <Icon className="pr-2 text-2xl" />}
      {text}
      {Icon && iconPosition === "right" && <Icon className="pl-2 text-2xl" />}
    </button>
  );
};

export default Button;
