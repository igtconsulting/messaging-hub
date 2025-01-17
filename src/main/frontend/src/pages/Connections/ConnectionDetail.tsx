import { useLocation, useNavigate, useParams } from "react-router-dom";
import BreadCrumbs from "../../layouts/Breadcrumbs";
import Button from "../../components/General/Button";
import { useContext, useEffect, useState } from "react";
import Table from "../../components/General/Table";
import { DeleteTrash } from "../../assets/icons/DeleteTrash";
import { EditPen } from "../../assets/icons/EditPen";
import Loading from "../../components/General/Loading";
import Connectionhealth from "../../components/Connections/ConnectionHealth";
import { ConnectionHealth, TableRow } from "../../types";
import {
  getConnection,
  getTopicsForConnection,
  getConnectionHealth,
  deleteTopic,
  deleteConnection,
} from "../../services/apiService";
import { AlertContext } from "../../contextapi/AlertContext";
import { formatTopicDataForTableInConnectionDetails } from "../../services/dataFormating";
import DataConfirm from "../../components/General/DataConfirm";

const ConnectionDetail = () => {
  const { name } = useParams<{ name: string }>();
  const [loading, setLoading] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [topicData, setTopicData] = useState<TableRow[]>([]);
  const location = useLocation();
  const { state } = location;
  const initialHealthData: ConnectionHealth = state?.health;
  const [healthData, setHealthData] = useState<ConnectionHealth | null>(
    initialHealthData || null
  );
  const [errorOccurred, setErrorOccurred] = useState(false);
  const { addAlert } = useContext(AlertContext);
  const [connectionType, setConnectionType] = useState<string>("");
  const [confirmProps, setConfirmProps] = useState({
    show: false,
    title: "",
    description: "",
    confirmAction: () => {},
    buttonColor: "red",
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (name && !errorOccurred) {
      const fetchData = async () => {
        try {
          setLoading(true);

          const [connection, topics] = await Promise.all([
            getConnection(name),
            getTopicsForConnection(name),
          ]);

          setConnectionType(connection.connection_type);
          topics &&
            setTopicData(formatTopicDataForTableInConnectionDetails(topics));
        } catch (error) {
          addAlert("Failed to load topics. Please try again later.", "error");
          console.error("Error fetching data:", error);
          setErrorOccurred(true);
        } finally {
          setLoading(false);
        }
      };

      const fetchHealthData = async () => {
        try {
          setLoadingHealth(true);
          const data = await getConnectionHealth(name);
          setHealthData(data);
        } catch (error) {
          addAlert(
            "Failed to load connection details. Please try again later.",
            "error"
          );
          console.error(`Failed to load health data for ${name}`, error);
          setErrorOccurred(true);
        } finally {
          setLoadingHealth(false);
        }
      };

      fetchData();

      if (!initialHealthData) {
        fetchHealthData();
      } else {
        setLoadingHealth(false);
      }
    }
  }, [name, initialHealthData, addAlert, errorOccurred]);

  const handleDeleteConnection = async () => {
    try {
      if (!name) throw new Error("Invalid parameters");
      await deleteConnection(name);
      addAlert("Connection deleted successfully", "success");
      navigate("/connections");
    } catch (error) {
      addAlert("Failed to delete connection", "error");
    } finally {
      setConfirmProps((prevProps) => ({ ...prevProps, show: false }));
    }
  };

  const handleDeleteButtonClick = () => {
    setConfirmProps({
      show: true,
      title: `Do you really want to delete the connection ${name}?`,
      description:
        "This action will delete the connection and all its topics and interfaces of the topics.",
      confirmAction: handleDeleteConnection,
      buttonColor: "red",
    });
  };

  const handleDeleteTopic = async (topicName: string) => {
    try {
      if (!name) return;
      await deleteTopic(name, topicName);
      addAlert("Topic deleted successfully", "success");
      setTopicData((prevData) =>
        prevData.filter((row) => row.parameters[0] !== topicName)
      );
    } catch (error) {
      addAlert("Failed to delete topic", "error");
    } finally {
      setConfirmProps((prevProps) => ({ ...prevProps, show: false }));
    }
  };

  const handleActionClick = (action: string, row: TableRow) => {
    switch (action) {
      case "Edit":
        navigate(`/topics/${name}/${row.parameters[0]}/edit`);
        break;
      case "Delete":
        setConfirmProps({
          show: true,
          title: "Are you sure?",
          description: `Do you really want to delete the topic ${row.parameters[0]}?`,
          confirmAction: () => handleDeleteTopic(row.parameters[0]),
          buttonColor: "red",
        });
        break;
      default:
        console.error("Unknown action for topics");
    }
  };

  return (
    <>
      <BreadCrumbs
        path={[
          { name: "Home", link: "/" },
          { name: "Connections", link: "/connections" },
          { name: name || "", link: `/connections/${name}/detail` },
        ]}
        backLink="/connections"
      />

      <div>
        <h1 className="text-heading dark:text-white mb-10">{name}</h1>
        {/*<div className="flex space-x-5 mb-10">
          <Button color="green" text="Start" />
          <Button color="purple" text="Restart" />
          <Button color="red" text="Shutdown" />
        </div>*/}
      </div>
      <h2 className="text-title dark:text-white">Connection Details</h2>
      <div className="flex justify-end space-x-5 mb-8">
        <Button
          color="blue"
          text="Edit"
          onClick={() => navigate(`/connections/${name}/edit`)}
        />
        <Button color="red" text="Delete" onClick={handleDeleteButtonClick} />
      </div>

      {loadingHealth ? (
        <Loading />
      ) : healthData ? (
        <Connectionhealth data={healthData!} type={connectionType} />
      ) : (
        <div className="text-center">
          Failed to load connection details. Please try again later.
        </div>
      )}

      <h1 className="text-title dark:text-white mb-10">Topics</h1>
      <Button
        color="green"
        text="+ Add New Topic"
        onClick={() =>
          navigate(`/topics/new`, { state: { connectionName: name } })
        }
      />
      <div className="mt-6">
        {loading ? (
          <Loading />
        ) : (
          <Table
            columns={["Topic name", "Package", "Actions"]}
            data={topicData}
            actionButtonColors={["blue", "red"]}
            actionButtonIcons={[EditPen, DeleteTrash]}
            redirectTo="topics"
            onActionClick={handleActionClick}
            connection={name}
          />
        )}
      </div>
      <DataConfirm
        show={confirmProps.show}
        title={confirmProps.title}
        description={confirmProps.description}
        confirmAction={confirmProps.confirmAction}
        cancelAction={() =>
          setConfirmProps((prevProps) => ({ ...prevProps, show: false }))
        }
        buttonColor={confirmProps.buttonColor}
      />
    </>
  );
};

export default ConnectionDetail;
