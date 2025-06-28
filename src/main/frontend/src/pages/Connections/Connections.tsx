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
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingHealthData, setLoadingHealthData] = useState<Record<string, boolean>>({});
  const { addAlert } = useContext(AlertContext);
  const navigate = useNavigate();
  const [confirmProps, setConfirmProps] = useState({
    show: false,
    title: "",
    description: "",
    confirmAction: () => {},
    buttonColor: "red",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const getConnectionData = async () => {
      try {
        // First, load just the connections quickly
        const data: Connection[] = await getConnections();
        if (!data || data.length === 0) {
          setConnectionData([]);
          setLoadingConnections(false);
          return;
        }
        setConnectionData(data.map(conn => ({ ...conn, health: undefined })));
        setLoadingConnections(false);

        // Initialize loading states for health data
        const initialLoadingStates = data.reduce<Record<string, boolean>>((acc, conn) => {
          acc[conn.connection_name] = true;
          return acc;
        }, {});
        setLoadingHealthData(initialLoadingStates);

        // Then load health data for each connection independently
        data.forEach(async (connection) => {
          try {
            const healthData: ConnectionHealth = await getConnectionHealth(connection.connection_name);
            
            // Update the specific connection with health data
            setConnectionData(prev =>
              prev.map(conn =>
                conn.connection_name === connection.connection_name
                  ? { ...conn, health: healthData }
                  : conn
              )
            );
          } catch (e) {
            console.warn(`Failed to load health data for ${connection.connection_name}:`, e);
          } finally {
            // Mark this connection's health data as loaded
            setLoadingHealthData(prev => ({
              ...prev,
              [connection.connection_name]: false
            }));
          }
        });

      } catch (error) {
        addAlert(
          "Failed to load connections data. Please try again later.",
          "error"
        );
        setLoadingConnections(false);
      }
    };

    getConnectionData();
  }, [addAlert]);

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
    setIsDeleting(true);
    try {
      await deleteConnection(connectionName);
      setConnectionData(previous => previous.filter(el => el.connection_name !== connectionName))
      addAlert("Connection deleted successfully", "success");
      setConfirmProps((prevProps) => ({ ...prevProps, show: false }));
    } catch (error) {
      addAlert("Failed to delete connection", "error");
    } finally {
      setIsDeleting(false);
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
    return formatConnectionDataForTable(connectionData, loadingHealthData);
  }, [connectionData, loadingHealthData])

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
          {loadingConnections ? (
            <Loading />
          ) : (
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
              disabledActions={["Edit"]}
            />
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
        isLoading={isDeleting}
      />
    </>
  );
};

export default ConnectionsView;
