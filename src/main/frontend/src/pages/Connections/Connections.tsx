import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/General/Button";
import Table from "../../components/General/Table";
import BreadCrumbs from "../../layouts/Breadcrumbs";
import { useContext, useEffect, useMemo, useState } from "react";
import { deleteConnection, getConnectionHealth, getConnections } from "../../services/apiService";
import { formatConnectionDataForTable } from "../../services/dataFormating";
import { Connection, ConnectionHealth, ConnectionWithHealth, TableRow } from "../../types";
import Loading from "../../components/General/Loading";
import { AlertContext } from "../../contextapi/AlertContext";
import { EditPen } from "../../assets/icons/EditPen";
import { DeleteTrash } from "../../assets/icons/DeleteTrash";
import DataConfirm from "../../components/General/DataConfirm";

const ConnectionsView = () => {
  const [connectionData, setConnectionData] = useState<ConnectionWithHealth[]>([]);
  const [healthData, setHealthData] = useState<
    Record<string, ConnectionHealth>
  >({});
  const [loading, setLoading] = useState(true);
  const { addAlert } = useContext(AlertContext);
  const navigate = useNavigate();
  const [confirmProps, setConfirmProps] = useState({
    show: false,
    title: "",
    description: "",
    confirmAction: () => {},
    buttonColor: "red",
  });

  useEffect(() => {
    const getConnectionData = async () => {
      try {
        const data: Connection[] = await getConnections();
        // Use map to create an array of promises
        const promises = data.map(async (connection) => {
          try {
            const healthData: ConnectionHealth = await getConnectionHealth(connection.connection_name)
            return {...connection, health: healthData}
          }catch (e) {
            return connection
          }
        });

        // Wait for all promises to resolve
        const connectionsWithHealth = await Promise.all(promises);
        setConnectionData(connectionsWithHealth);
      } catch (error) {
        addAlert(
          "Failed to load connections data. Please try again later.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    getConnectionData();
  }, []);

  const fetchConnectionHealthData = async (visibleConnections: TableRow[]) => {
    const newHealthData = await Promise.all(
      visibleConnections.map(async (connection) => {
        try {
          const health = await getConnectionHealth(connection.parameters[0]);
          return { id: connection.parameters[0], health };
        } catch (error) {
          console.error(
            `Failed to load health data for ${connection.parameters[0]}`,
            error
          );
          return { id: connection.parameters[0], health: null };
        }
      })
    );

    const updatedHealthData = newHealthData.reduce<
      Record<string, ConnectionHealth>
    >((acc, { id, health }) => {
      acc[id] = health;
      return acc;
    }, {});

    setHealthData((prevHealthData) => ({
      ...prevHealthData,
      ...updatedHealthData,
    }));
  };

  const handleVisibleRowsChange = (visibleRows: TableRow[]) => {
    fetchConnectionHealthData(visibleRows);
  };

  const handleDeleteConnection = async (
    connectionName: string,
  ) => {
    try {
      await deleteConnection(connectionName);
      setConnectionData(previous => previous.filter(el => el.connection_name !== connectionName))
      addAlert("Connection deleted successfully", "success");
    } catch (error) {
      addAlert("Failed to delete connection", "error");
    } finally {
      setConfirmProps((prevProps) => ({ ...prevProps, show: false }));
    }
  };

  const handleActionClick = (action: string, row: TableRow) => {
    switch (action) {
      case "Edit":
        navigate(`/connections/${row.parameters[0]}/edit`);
        break;
      case "Delete":
        setConfirmProps({
          show: true,
          title: `Do you really want to delete the connection ${row.parameters[0]}?`,
          description: "This action will delete the connection and all its topics and interfaces of the topics.",
          confirmAction: () => handleDeleteConnection(row.parameters[0]),
          buttonColor: "red",
        });
        break;
      default:
        console.error("Unknown action for topics");
    }
  };

  const formattedData = useMemo(() => {
    return formatConnectionDataForTable(connectionData);
  }, [connectionData])

  return (
    <>
      <div className="container mx-auto">
        <BreadCrumbs
          path={[
            { name: "Home", link: "/" },
            { name: "Connections", link: "/connections" },
          ]}
        />
        <h1 className="text-title dark:text-white mb-10">Connections</h1>

        <Link to="/connections/new" className="inline-block">
          <Button color="green" text="+ Add New Connection" />
        </Link>

        <div className="mt-6">
          {!loading ? (
            <Table
              connectionTypes={["All", "UM", "KAFKA"]}
              columns={[
                "Connection name",
                "Type",
                "Server",
                "State",
                "Actions",
              ]}
              data={formattedData}
              healthData={healthData}
              actionButtonColors={["blue", "red"]}
              actionButtonIcons={[EditPen, DeleteTrash]}
              onVisibleRowsChange={handleVisibleRowsChange}
              redirectTo="connections"
              onActionClick={handleActionClick}
            />
          ) : (
            <Loading />
          )}
        </div>
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

export default ConnectionsView;
