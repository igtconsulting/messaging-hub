import { useContext } from 'react'
import { AlertContext } from '../contextapi/AlertContext'
import { Error } from '../assets/icons/Error'
import { Success } from '../assets/icons/Success';
import { Cross } from '../assets/icons/Cross';

const Alert: React.FC<{ type: string; text: string }> = ({ type, text }) => {
  const { removeAlert } = useContext(AlertContext)

  const getColorClasses = (type: string) => {
    switch(type) {
      case "error":
        return { bg: "bg-red", icon: <Error className={`text-red w-10 h-10`} /> }
      case "success":
        return { bg: "bg-green", icon: <Success className='text-green w-10 h-10' /> }
      default:
        return { bg: "bg-purple", icon: <Error className={`text-purple w-10 h-10`} /> }
    }
  }

  const { bg, icon } = getColorClasses(type)

  return (
    <div className="fixed top-12 z-50 right-8 w-11/12 max-w-[649px] animate-fadeInFromTop">
      <div className="flex bg-white w-full shadow-lg justify-between">
        <div className='flex items-center'>
            <div className={`w-4 h-full ${bg}`}></div>
            <div className="flex items-center py-4 px-6">
                {icon}
                <div className="ml-4">
                    <p className="text-black">{text}</p>
                </div>
            </div>
        </div>
        <button onClick={removeAlert} className="mr-4 text-black"><Cross /></button>
      </div>
    </div>
  )
}

export default Alert