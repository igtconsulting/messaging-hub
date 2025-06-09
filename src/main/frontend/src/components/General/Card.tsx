
const Card: React.FC<{children: React.ReactNode, className?: string}> = ({children, className}) => {
    return (
        <div className={`rounded shadow p-5 bg-white ${className}`}>
            {children}
        </div>
    )
}

export default Card;