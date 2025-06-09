import { useNavigate, useParams } from "react-router-dom";
import ConnectionForm from "../../components/Connections/ConnectionForm";
import Card from "../../components/General/Card";
import BreadCrumbs from "../../layouts/Breadcrumbs";
import { Connection } from "../../types";
import { useContext, useEffect, useState } from "react";
import { AlertContext } from "../../contextapi/AlertContext";
import { getConnection, updateConnection } from "../../services/apiService";
import Loading from "../../components/General/Loading";

const EditConnection = () => {
  const navigate = useNavigate();
  const { addAlert } = useContext(AlertContext);
  const { name } = useParams<{ name: string }>();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function getConnectionDetails() {
      try {
        const response = await getConnection(name);
        setConnection(response);
        setLoading(false);
      } catch (error) {
        addAlert(
          "There was a problem loading the connection. Try again later",
          "error"
        );
        navigate("/connections");
      }
    }
    getConnectionDetails();
  }, [name, addAlert]);

  async function onEditConnection(editedConnection: Connection) {
    if (!name) {
      addAlert("Invalid connection name", "error");
      return;
    }

    try {
      await updateConnection(name, editedConnection);
      navigate("/connections");
      addAlert("Connection updated successfully", "success");
    } catch (error) {
      addAlert(
        "There was a problem updating the connection. Try again later",
        "error"
      );
    }
  }

  return (
    <>
      <div className="container mx-auto">
        <BreadCrumbs
          path={[
            { name: "Home", link: "/" },
            { name: "Connections", link: "/connections" },
            { name: "Edit", link: `/connections/${name}/edit` },
          ]}
          backLink="/connections"
        />
        <h1 className="text-title dark:text-white mb-10">Edit connection</h1>

        <div className="mt-6">
          <Card>
            {loading ? (
              <Loading />
            ) : (
              <ConnectionForm
                submitForm={onEditConnection}
                connection={connection}
              />
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default EditConnection;
