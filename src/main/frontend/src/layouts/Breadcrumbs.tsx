import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight } from '../assets/icons/ChevronRight'
import { ChevronLeft } from '../assets/icons/ChevronLeft'

type BreadCrumb = {
  name: string
  link: string
}

type BreadCrumbsProps = {
  path: BreadCrumb[];
  backLink?: string; 
}

const BreadCrumbs: React.FC<BreadCrumbsProps> = ({ path, backLink }) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (backLink) {
      navigate(backLink);
    }
  };
  
  return (
    <>
      <div className="mb-10">
        <nav aria-label="breadcrumb">
          <ul className="flex items-center flex-wrap font-roboto text-small">
            {path.map((crumb, index) => (
              <li key={index}>
                <Link
                  to={crumb.link}
                  className="flex items-center text-igtblue-500 hover:underline focus:outline-none hover:text-igtpurple-500"
                >
                  {index != 0 && (
                    <ChevronRight className="mx-2 text-xl text-secondaryText" />
                  )}
                  <p className={`${index === path.length - 1 ? 'text-primaryText' : 'text-secondaryText'}`}>{crumb.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {backLink &&
      <div className={`mb-3 flex`}>
        <button onClick={handleBackClick} className="flex gap-2 items-center">
            <ChevronLeft />
            Back
          </button>
      </div>
      }
    </>
  )
}

export default BreadCrumbs
