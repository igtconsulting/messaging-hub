import React, { useCallback, useState } from 'react'

type AlertType = {
    text: string
    type: string
  }
  

export const AlertContext = React.createContext({
  alert: null as null | AlertType,
  addAlert: (text: string, type: string) => {
    console.log(text, type)
  },
  removeAlert: () => {},
})

const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [alert, setAlert] = useState<null | AlertType>(null)

  const addAlert = useCallback((text: string, type: string) => {

    setAlert({ text, type })

    setTimeout(() => {
      setAlert(null)
    }, 6000)

  }, [])

  function removeAlert() {
    setAlert(null)
  }

  return (
    <AlertContext.Provider
      value={{
        alert: alert,
        addAlert: addAlert,
        removeAlert: removeAlert,
      }}
    >
      {children}
    </AlertContext.Provider>
  )
}

export default AuthContextProvider
