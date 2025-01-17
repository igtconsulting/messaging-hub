import { useNavigate } from "react-router-dom";
import Card from "../../components/General/Card";
import { useContext } from "react";
import {AlertContext} from "../../contextapi/AlertContext";
import BreadCrumbs from "../../layouts/Breadcrumbs";
import InterfaceForm from "../../components/Interfaces/InterfaceForm/InterfaceForm";
import { createEnvInterface } from "../../services/apiService";
import { Interface } from "../../types";

const NewInterface = () => {
  const navigate = useNavigate();
  const { addAlert } = useContext(AlertContext);

  async function onCreateInterface(newInterface: Interface) {
    try {
      await createEnvInterface(newInterface)
      navigate("/interfaces");
      addAlert("Interface created successfully", "success");
    } catch (error) {
      addAlert(
        "There was a problem creating the interface. Try again later",
        "error"
      );
    }
  }

  return (
    <>
      <BreadCrumbs
        path={[
          { name: "Home", link: "/" },
          { name: "Interfaces", link: "/interfaces" },
          { name: "Create interface", link: "/interfaces/new" },
        ]}
        backLink="/interfaces"
      />

      <div className="container mx-auto">
        <h1 className="text-title dark:text-white mb-10">
          Create New interface
        </h1>

        <div className="mt-6">
          <Card>
            <InterfaceForm submitForm={onCreateInterface} />
          </Card>
        </div>
      </div>
    </>
  );
};

export default NewInterface;
