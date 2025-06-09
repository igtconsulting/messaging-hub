import { Outlet } from "react-router-dom"
import PageLayout from "./layouts/PageLayout"
import SideBar from "./layouts/Sidebar/HeaderWithSidebar"
import { useContext } from "react"
import {AlertContext} from "./contextapi/AlertContext"
import Alert from "./layouts/Alert"

function App() {
  const { alert } = useContext(AlertContext)

  return (
    <>
    <div className="flex bg-primary dark:bg-gray-900 min-h-screen">
      {alert && <Alert text={alert.text} type={alert.type} />}
      <SideBar />
      <div className="pt-16 flex-auto">
          <PageLayout>
            <Outlet />
          </PageLayout>
        </div>
    </div>
    </>
  )
}

export default App
