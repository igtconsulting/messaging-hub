type ToggleProps = {
    toggled: boolean;
    pressed: () => void;
    size?: string;
}
const Toggle: React.FC<ToggleProps> = ({toggled, pressed, size = "base"}) => {

  return (
    <div
      onClick={pressed}
      className={`flex items-center transition-justify ease-in duration-150 cursor-pointer rounded-2xl ${
        toggled ? 'bg-purple-light justify-end' : 'bg-white border border-purple justify-start'
      }
      ${size === 'small' ? 'w-8 h-2.5' : ' w-12 h-5'}`}
    >
      <div
        className={`rounded-full bg-purple flex items-center justify-center text-white ${
          toggled ? 'dark' : 'light'
        }
        ${size === 'small' ? 'h-4 w-4' : 'h-7 w-7'}`}
      >
        
      </div>
    </div>
  )
}

export default Toggle
