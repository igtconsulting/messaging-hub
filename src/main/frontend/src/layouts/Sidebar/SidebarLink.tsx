import { Link, useLocation } from "react-router-dom";
import { SVGProps, useState } from "react";

type props = {
  icon: React.FC<SVGProps<SVGSVGElement>>;
  open: boolean;
  text: string;
  link: string;
  closeNav?: () => void;
};

const SidebarLink: React.FC<props> = ({
  icon: Icon,
  open,
  text,
  link,
  closeNav,
}) => {
  const location = useLocation();
  const [isFocused, setIsFocused] = useState(false);

  const isActive = link === "/"
    ? location.pathname === link
    : location.pathname.startsWith(link);

  return (
    <Link
      to={link}
      className={`flex items-center transition-bg duration-200 hover:text-purple w-fit rounded
       ${isFocused && "clicked"} ${
        isActive ? "text-purple" : "text-gray-light"
      } ${open ? "mx-2 p-2" : "mx-auto p-2"}`}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClick={closeNav}
    >
      <span className="">
        <Icon width="24" height="24" />
      </span>
      {open && <div className="linkText linkTextAnimation pl-7">{text}</div>}
    </Link>
  );
};

export default SidebarLink;
