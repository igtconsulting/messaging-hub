export const Title: React.FC<{children: string}> = ({children}) => {
    return <h1 className="text-title">{children}</h1>
}

export const Subtitle: React.FC<{children: string}> = ({children}) => {
    return <h1 className="text-subtitle">{children}</h1>
}

export const Text: React.FC<{children: string}> = ({children}) => {
    return <h1 className="text-text">{children}</h1>
}