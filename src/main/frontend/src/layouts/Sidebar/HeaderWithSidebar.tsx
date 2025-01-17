import { useState } from "react";
import SidebarLink from "./SidebarLink";
import { Link, NavLink } from "react-router-dom";
import { Interfaces } from "../../assets/icons/Interfaces";
import { Connections } from "../../assets/icons/Connections";
import { HomeIcon } from "../../assets/icons/Dashboard";
import { Topics } from "../../assets/icons/Topics";
import Logo from "../../assets/images/logo.png";
import { About } from "../../assets/icons/About";

export default function SideBar() {
  const [open, setOpen] = useState(false);

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMouseEnter = () => {
    setOpen(true);
  };

  const handleMouseLeave = () => {
    setOpen(false);
  };

  return (
    <>
      <div
        className={`transition-all duration-150 ${
          open ? "md:w-40 lg:w-56 hidden md:block" : "md:w-20 md:z-30"
        }`}
        onClick={handleDrawerClose}
      ></div>
      <nav
        className={`h-screen overflow-hidden z-40 border-r-2 fixed bg-white border-primary transition-width duration-150 ease-in dark:bg-gray-900 dark:border-gray-700 ${
          open ? "hidden md:block lg:w-56 md:w-48" : "md:w-20 hidden md:block"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex flex-col h-full">
          {/* Top content */}
          <div className="flex justify-end items-center h-16 py-3 border-b border-primary dark:border-gray-700 navCloser"></div>

          {/* Sidebar links */}
          <ul className="flex flex-col items-start gap-1 py-4 border-b-2 border-primary dark:border-gray-700 dark:text-white">
            <SidebarLink
              icon={HomeIcon}
              open={open}
              text={"Dashboard"}
              link="/"
              closeNav={handleDrawerClose}
            />
            <SidebarLink
              icon={Connections}
              open={open}
              text={"Connections"}
              link={"/connections"}
              closeNav={handleDrawerClose}
            />
            <SidebarLink
              icon={Interfaces}
              open={open}
              text={"Interfaces"}
              link="/interfaces"
              closeNav={handleDrawerClose}
            />
            <SidebarLink
              icon={Topics}
              open={open}
              text={"Topics"}
              link="/topics"
              closeNav={handleDrawerClose}
            />
          </ul>

          <div className="flex flex-col flex-grow justify-end items-center py-4">
            <NavLink
              to={"/help"}
              className="text-gray-light hover:text-purple transition-colors duration-200"
            >
              <About fontSize={24} />
            </NavLink>
          </div>
        </div>
      </nav>

      <nav
        className={`flex justify-center md:justify-between h-16 items-center z-40 bg-white shadow shadow-gray-100 fixed w-full transition-width transition-margin duration-150 ease-in dark:bg-igtblue-700 ${
          open && "openedBar"
        }`}
      >
        <Link to={"/"} className="text-2xl p-4 font-rajdhani">
          <img src={Logo} className="h-12" alt="Messaging Hub" />
        </Link>
      </nav>
    </>
  );
}
