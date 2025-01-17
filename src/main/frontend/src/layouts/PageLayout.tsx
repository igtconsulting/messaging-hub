import { ReactNode } from 'react'

type PageLayoutProps = {
  children: ReactNode
  className?: string
}

const PageLayout = ({ children, className }: PageLayoutProps) => {
  return (
    <div className={`p-3 lg:p-5 md:mx-8 lg:mx-20 text-black dark:text-white ${className}`}>
      {children}
    </div>
  )
}

export default PageLayout