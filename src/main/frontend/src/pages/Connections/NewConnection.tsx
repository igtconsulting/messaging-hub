import Card from "../../components/General/Card";
import BreadCrumbs from "../../layouts/Breadcrumbs";
import ConnectionForm from "../../components/Connections/ConnectionForm";
import { useNavigate } from "react-router-dom";
import { Connection } from "../../types";
import { useContext, useState } from "react";
import { AlertContext } from "../../contextapi/AlertContext";
import { createConnection } from "../../services/apiService";

const NewConnection = () => {
  const navigate = useNavigate();
  const { addAlert } = useContext(AlertContext);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  async function onCreateConnection(newConnection: Connection) {
    setIsSubmitting(true);
    try {
      await createConnection(newConnection);
      navigate("/connections");
      addAlert("Connection created successfully", "success");
    } catch (error) {
      addAlert(
        "There was a problem creating the connection. Try again later",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="container mx-auto">
        <BreadCrumbs
          path={[
            { name: "Home", link: "/" },
            { name: "Connections", link: "/connections" },
            { name: "New", link: "/connections/new" },
          ]}
          backLink="/connections"
        />
        <h1 className="text-title dark:text-white mb-10">
          Create New connection
        </h1>

        <div className="mt-6">
          <Card>
            <ConnectionForm submitForm={onCreateConnection} isLoading={isSubmitting} />
          </Card>
        </div>
      </div>
    </>
  );
};

export default NewConnection;
