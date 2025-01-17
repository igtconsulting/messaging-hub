import { useParams, useNavigate, Link } from "react-router-dom";
import Button from "../../components/General/Button";
import BreadCrumbs from "../../layouts/Breadcrumbs";
import Card from "../../components/General/Card";
import Loading from "../../components/General/Loading";
import {
  Connection,
  Interface,
  TableRow,
  Topic,
  TopicDetails,
  TreeNode,
} from "../../types";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  deleteDurable,
  deleteInterface,
  deleteTopic,
  getConnection,
  getDurablesForTopic,
  getInterfaces,
  getTopic,
  getTopicDetail,
  publishTopicMessage,
} from "../../services/apiService";
import { AlertContext } from "../../contextapi/AlertContext";
import DataConfirm from "../../components/General/DataConfirm";
import Scheme from "../../components/Topics/Scheme/Scheme";
import Table from "../../components/General/Table";
import { EditPen } from "../../assets/icons/EditPen";
import { DeleteTrash } from "../../assets/icons/DeleteTrash";
import {
  formatDurablesDataForTable,
  formatInterfaceDataForTable,
  groupEnvironments,
} from "../../services/dataFormating";
import Modal from "../../components/General/Modal";
import { NodeId } from "react-accessible-treeview";
// import { formatSchemaForPublish } from "../../services/schemeFormating";

const TopicDetail = () => {
  const { name } = useParams<{ name: string }>();
  const { connection } = useParams<{ connection: string }>();
  const navigate = useNavigate();
  const [cpuData, setCPUData] = useState<TopicDetails | null>(null);
  const { addAlert } = useContext(AlertContext);
  // const [errorOccurred, setErrorOccurred] = useState(false);
  const [confirmProps, setConfirmProps] = useState({
    show: false,
    title: "",
    description: "",
    confirmAction: () => {},
    buttonColor: "red",
  });
  const [modalProps, setModalProps] = useState({
    show: false,
    title: "",
    content: <>Some content</>,
    confirmAction: () => {},
    buttonColor: "green",
  });
  const [topicDetails, setTopicDetails] = useState<(Topic & Connection) | null>(
    null
  );
  const [interfaceData, setInterfaceData] = useState<TableRow[]>([]);
  const [durablesData, setDurablesData] = useState<TableRow[]>([]);
  const [schemeDataToPublish, setSchemeDataToPublish] = useState<
    TreeNode[] | undefined
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name || !connection) {
      addAlert("Invalid parameters: 'name' or 'connection' missing.", "error");
      setLoading(false);
      return;
    }

    // Function to load topic details
    async function loadTopicDetails(connectionName: string, topicName: string) {
      try {
        const response = await getTopicDetail(connectionName, topicName);
        setCPUData(JSON.parse(response));
      } catch (error) {
        addAlert("There was a problem loading CPU details", "error");
      }
    }

    // Function to load topic schema and connection data
    async function loadTopicScheme(connectionName: string, topicName: string) {
      try {
        const connectionData = await getConnection(connection);
        const response = await getTopic(connectionName, topicName);
        const parsedSchema = JSON.parse(response.schema);

        setTopicDetails({ ...response, ...connectionData });
        setSchemeDataToPublish(parsedSchema);
      } catch (error) {
        addAlert("There was a problem loading topic schema", "error");
      }
    }

    // Function to load durables data if connection type is not Kafka
    async function loadDurablesData(connectionName: string, topicName: string) {
      try {
        const connectionData = await getConnection(connectionName);
        if (connectionData.connection_type.toLowerCase() === "kafka") return;

        const data = await getDurablesForTopic(connectionName, topicName);
        setDurablesData(formatDurablesDataForTable(data));
      } catch (error) {
        addAlert(
          "Failed to load durables data. Please try again later.",
          "error"
        );
      }
    }

    const getInterfaceData = async (topicName: string) => {
      try {
        const data: Interface[] = await getInterfaces();
        const groupedData = groupEnvironments(data);
        const formattedData = formatInterfaceDataForTable(groupedData);
        const filteredData = formattedData.filter(
          (row) => row.parameters[3] === topicName
        );
        setInterfaceData(filteredData);
      } catch (error) {
        addAlert(
          "Failed to load interfaces data. Please try again later.",
          "error"
        );
      }
    };

    Promise.all([
      loadTopicDetails(connection, name),
      loadTopicScheme(connection, name),
      loadDurablesData(connection, name),
      getInterfaceData(name),
    ]).finally(() => {
      setLoading(false); // Set loading to false after all functions complete
    });
  }, [name, connection, addAlert]);

  const onPublish = useCallback(async () => {
    const collectChildValues = (parentId: NodeId): unknown => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const childObject: any = {};
      const children =
        schemeDataToPublish?.filter(
          (item) => item.parent === parentId && !item.metadata.replicaOf
        ) || [];

      children.forEach((child) => {
        if (child.metadata.type === "string") {
          childObject[child.name] = child.metadata.value || "";
        } else if (
          child.metadata.type === "array" &&
          child.metadata.array === "string"
        ) {
          childObject[child.name] = child.metadata.value;
        } else if (child.metadata.type === "object") {
          childObject[child.name] = collectChildValues(child.id);
        } else if (child.metadata.array === "document") {
          childObject[child.name] = schemeDataToPublish
            ?.filter((el) => el.metadata.replicaOf == child.id)
            .map((el) => el.metadata.value);
        }
      });

      return childObject;
    };
    try {
      const formattedMessage = collectChildValues(1);
      await publishTopicMessage(connection, name, formattedMessage);
      addAlert("Topic message published successfully", "success");
    } catch (e) {
      addAlert("Failed to publish message", "error");
    } finally {
      setModalProps({
        show: false,
        title: "",
        content: <>Some content</>,
        confirmAction: () => {},
        buttonColor: "green",
      });
    }
  }, [schemeDataToPublish, name, connection, addAlert]);

  useEffect(() => {
    setModalProps((previous) => {
      return { ...previous, confirmAction: onPublish };
    });
  }, [onPublish]);

  const schemeData = useMemo(() => {
    return topicDetails?.schema ? JSON.parse(topicDetails?.schema) : null;
  }, [topicDetails]);

  const handleDeleteTopic = async () => {
    try {
      if (!name || !connection) throw new Error("Invalid parameters");
      await deleteTopic(connection, name);
      addAlert("Topic deleted successfully", "success");
      navigate("/topics");
    } catch (error) {
      addAlert("Failed to delete topic", "error");
    }
  };

  const handleDeleteButtonClick = () => {
    setConfirmProps({
      show: true,
      title: "Are you sure?",
      description: `Do you really want to delete the topic ${name}?`,
      confirmAction: handleDeleteTopic,
      buttonColor: "red",
    });
  };

  const handleDeleteInterface = async (interfaceName: string) => {
    try {
      await deleteInterface(interfaceName);
      addAlert("Interface deleted successfully", "success");
    } catch (error) {
      addAlert("Failed to delete interface", "error");
    } finally {
      setConfirmProps((prevProps) => ({ ...prevProps, show: false }));
    }
  };

  const handleDeleteDurable = async (durable: string) => {
    try {
      await deleteDurable(connection, name, durable);
      addAlert("Durable deleted successfully", "success");
    } catch (error) {
      addAlert("Failed to delete durable", "error");
    } finally {
      setConfirmProps((prevProps) => ({ ...prevProps, show: false }));
    }
  };

  const handleActionClick = (action: string, row: TableRow) => {
    switch (action) {
      case "Edit":
        navigate(`/interfaces/${row.parameters[0]}/edit`);
        break;
      case "Delete":
        setConfirmProps({
          show: true,
          title: `Do you really want to delete the interface ${row.parameters[0]}?`,
          description: `This action will delete the interface on all environments.`,
          confirmAction: () => handleDeleteInterface(row.parameters[0]),
          buttonColor: "red",
        });
        break;
      default:
        console.error("Unknown action for interfaces");
    }
  };

  const handleActionClickDurable = (action: string, row: TableRow) => {
    switch (action) {
      case "Delete":
        setConfirmProps({
          show: true,
          title: `Do you really want to delete the durable ${row.parameters[0]}?`,
          description: `This action will delete the interface on all environments.`,
          confirmAction: () => handleDeleteDurable(row.parameters[0]),
          buttonColor: "red",
        });
        break;
      default:
        console.error("Unknown action for interfaces");
    }
  };

  const handlePublishButtonClick = () => {
    setModalProps({
      show: true,
      title: "Publish message to topic",
      content:
        schemeData && schemeDataToPublish ? (
          <Scheme
            topicName={name || ""}
            editable={false}
            data={schemeData}
            publishable={true}
            onChangePublish={setSchemeDataToPublish}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            Failed to load scheme details. Please try again later.
          </div>
        ),
      confirmAction: onPublish,
      buttonColor: "green",
    });
  };

  return (
    <div className="container mx-auto">
      <BreadCrumbs
        path={[
          { name: "Home", link: "/" },
          { name: "Topics", link: "/topics" },
          { name: name || "", link: `/topics/${connection}/${name}/detail` },
        ]}
        backLink="/topics"
      />

      <div>
        <h1 className="text-heading dark:text-white mb-10">{name}</h1>
      </div>
      {loading ? (
        <Loading />
      ) : (
        <>
          <h2 className="text-title dark:text-white">Topic Details</h2>
          <div className="flex justify-between my-6">
            <Button
              color="green"
              text="+ Publish message to topic"
              onClick={handlePublishButtonClick}
            />
            <div className="flex gap-4">
              <Button
                color="blue"
                text="Edit"
                onClick={() => {
                  navigate(`/topics/${connection}/${name}/edit`);
                }}
              />
              <Button
                color="red"
                text="Delete"
                onClick={handleDeleteButtonClick}
              />
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <Card className="flex-1">
              {schemeData ? (
                <>
                  <h2 className="text-subtitle uppercase text-gray mb-2">
                    Schema
                  </h2>
                  <Scheme
                    topicName={name || ""}
                    editable={false}
                    data={schemeData}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  Failed to load scheme details. Please try again later.
                </div>
              )}
            </Card>
            <Card className="flex-1">
              {cpuData ? (
                <>
                  <h2 className="text-subtitle uppercase text-gray">
                    Messages
                  </h2>
                  <div className="flex w-full text-redactor">
                    <p className="w-2/3 xl:w-2/5">
                      {cpuData.total_consumed !== undefined
                        ? "Consumed"
                        : "Partitions"}
                    </p>
                    <p>
                      {cpuData["total_consumed"] ??
                        cpuData.describeTopicPartitions ??
                        0}
                    </p>
                  </div>
                  <div className="flex w-full text-redactor">
                    <p className="w-2/3 xl:w-2/5">
                      {cpuData.total_published !== undefined
                        ? "Published"
                        : "Replications"}
                    </p>
                    <p>
                      {cpuData?.total_published ??
                        cpuData.describeTopicReplications ??
                        0}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  Failed to load CPU details. Please try again later.
                </div>
              )}
            </Card>
          </div>
          {topicDetails?.connection_type?.toLowerCase() == "kafka" ? null : (
            <Card className="mb-10">
              <h2 className="text-subtitle uppercase text-gray">Durables</h2>
              <Table
                columns={[
                  "Durable name",
                  "Type",
                  "Selector",
                  "Processing",
                  "Retrieval",
                  "Actions",
                ]}
                data={durablesData}
                actionButtonColors={["red"]}
                actionButtonIcons={[DeleteTrash]}
                redirectTo="durables"
                onActionClick={handleActionClickDurable}
              />
            </Card>
          )}
          <h2 className="text-title dark:text-white mb-6">Interfaces</h2>

          <Link to={"/interfaces/new"} className="inline-block">
            <Button color="green" text="+ Add New Interface" />
          </Link>
          <div className="mt-6">
            <Table
              connectionTypes={["All", "UM", "KAFKA"]}
              columns={[
                "Interface name",
                "Type",
                "Environments",
                "Topic source",
                "Actions",
              ]}
              data={interfaceData}
              actionButtonColors={["blue", "red"]}
              actionButtonIcons={[EditPen, DeleteTrash]}
              redirectTo="interfaces"
              onActionClick={handleActionClick}
            />
          </div>
        </>
      )}

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

      <Modal
        show={modalProps.show}
        title={modalProps.title}
        content={modalProps.content}
        buttonColor={modalProps.buttonColor}
        confirmAction={modalProps.confirmAction}
        cancelAction={() =>
          setModalProps((prevProps) => ({ ...prevProps, show: false }))
        }
      />
    </div>
  );
};

export default TopicDetail;
