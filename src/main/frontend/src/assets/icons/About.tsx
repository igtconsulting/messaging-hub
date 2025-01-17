import { SVGProps } from "react";

export function About(props: SVGProps<SVGSVGElement>) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}><g fill="none" stroke="currentColor" stroke-linejoin="round"><circle cx="12" cy="12" r="9" stroke-linecap="round" stroke-width="2"/><path stroke-width="3" d="M12 16h.01v.01H12z"/><path stroke-linecap="round" stroke-width="2" d="M10.586 7.586c.39-.39.9-.585 1.41-.586a2 2 0 0 1 1.418.586c.39.39.586.902.586 1.414s-.195 1.024-.586 1.414a2 2 0 0 1-1.418.586L12 12"/></g></svg>
    )
  }