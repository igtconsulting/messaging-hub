import BreadCrumbs from "../layouts/Breadcrumbs";
import Blue from "../assets/images/igtblue.png";
import Purple from "../assets/images/igtpurple.png";
import Green from "../assets/images/igtgreen.png";
import { Interfaces } from "../assets/icons/Interfaces";
import { Connections } from "../assets/icons/Connections";
import { Topics } from "../assets/icons/Topics";
import DashboardCardColored from "../components/Dashboard/DashboardCardColored";
import { getConnections, getInterfaces, getTopics } from "../services/apiService";
import { useContext, useEffect, useState } from "react";
import { Connection } from "../types";
import { AlertContext } from "../contextapi/AlertContext";
// import DataConfirm from "../components/General/DataConfirm";
// import { useState } from "react";
// import Button from "../components/General/Button";

function Dashboard() {
  // const [idToDelete, setIdToDelete] = useState<null | number>(null);

  // function deleteSomething(id: number | null) {
  //   if (id) {
  //     console.log(id);
  //     setIdToDelete(null);
  //   }
  // }
  const { addAlert } = useContext(AlertContext);
  const [loading, setLoading] = useState(true); 
  const [numberOfConnections, setNumberOfConnections] = useState<number>(0);
  const [numberOfTopics, setNumberOfTopics] = useState<number>(0);
  const [numberOfInterfaces, setNumberOfInterfaces] = useState<number>(0);

  useEffect(() => {
    async function getNumberOfConnections() {
      try {
        const data: Connection[] = await getConnections();
        setNumberOfConnections(data?.length || 0);
      } catch (error) {
        addAlert(
          "Failed to load connections data. Please try again later.",
          "warning"
        );
      }
    }

    async function getNumberOfTopics() {
      try {
        const data: Connection[] = await getTopics();
        setNumberOfTopics(data?.length || 0);
      } catch (error) {
        addAlert(
          "Failed to load topics data. Please try again later.",
          "warning"
        );
      }
    }

    async function getNumberOfInterfaces() {
      try {
        const data: Connection[] = await getInterfaces();
        setNumberOfInterfaces(data?.length || 0);
      } catch (error) {
        addAlert(
          "Failed to load interfaces data. Please try again later.",
          "warning"
        );
      }
    }
    Promise.all([getNumberOfConnections(), getNumberOfTopics(), getNumberOfInterfaces()]).finally(() => {
      setLoading(false)
    })
  }, [addAlert]);

  return (
    <>
      <div className="container mx-auto">
        <BreadCrumbs path={[{ name: "Home", link: "/" }]} />
        <h1 className="text-title dark:text-white">Dashboard</h1>
        <div className="flex flex-col md:flex-row w-auto justify-between gap-6 mt-10">
          <DashboardCardColored
            text="Created connections"
            number={numberOfConnections}
            color={Blue}
            icon={Connections}
            loading={loading}
          />
          <DashboardCardColored
            text="Created topics"
            number={numberOfTopics}
            color={Purple}
            icon={Topics}
            loading={loading}
          />
          <DashboardCardColored
            text="Created interfaces"
            number={numberOfInterfaces}
            color={Green}
            icon={Interfaces}
            loading={loading}
          />
        </div>
      </div>
    </>
  );
}

export default Dashboard;
