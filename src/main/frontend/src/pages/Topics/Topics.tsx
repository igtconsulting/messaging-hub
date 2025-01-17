import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DeleteTrash } from "../../assets/icons/DeleteTrash";
import { EditPen } from "../../assets/icons/EditPen";
import Button from "../../components/General/Button";
import Table from "../../components/General/Table";
import BreadCrumbs from "../../layouts/Breadcrumbs";
import { ConnectionHealth, TableRow, Topic } from "../../types";
import {
  getConnectionHealth,
  getTopics,
  deleteTopic,
} from "../../services/apiService";
import { formatTopicDataForTable } from "../../services/dataFormating";
import { AlertContext } from "../../contextapi/AlertContext";
import Loading from "../../components/General/Loading";
import { Link } from "react-router-dom";
import DataConfirm from "../../components/General/DataConfirm";

const Topics = () => {
  const [topicData, setTopicData] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<
    Record<string, ConnectionHealth>
  >({});
  const { addAlert } = useContext(AlertContext);
  const [confirmProps, setConfirmProps] = useState({
    show: false,
    title: "",
    description: "",
    confirmAction: () => {},
    buttonColor: "red",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const getTopicData = async () => {
      try {
        const data: Topic[] = await getTopics();
        const formattedData = formatTopicDataForTable(data);
        setTopicData(formattedData);
      } catch (error) {
        addAlert(
          "Failed to load topics data. Please try again later.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    getTopicData();
  }, []);

  const fetchConnectionHealthData = async (visibleTopics: TableRow[]) => {
    const newHealthData = await Promise.all(
      visibleTopics.map(async (topic) => {
        try {
          const health = await getConnectionHealth(topic.parameters[2]);
          return { id: topic.parameters[2], health };
        } catch (error) {
          console.error(
            `Failed to load health data for ${topic.parameters[2]}`,
            error
          );
          return { id: topic.parameters[2], health: null };
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

  const handleDeleteTopic = async (
    connectionName: string,
    topicName: string
  ) => {
    try {
      await deleteTopic(connectionName, topicName);
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
        navigate(`/topics/${row.parameters[2]}/${row.parameters[0]}/edit`);
        break;
      case "Delete":
        setConfirmProps({
          show: true,
          title: "Are you sure?",
          description: `Do you really want to delete the topic ${row.parameters[0]}?`,
          confirmAction: () =>
            handleDeleteTopic(row.parameters[2], row.parameters[0]),
          buttonColor: "red",
        });
        break;
      default:
        console.error("Unknown action for topics");
    }
  };

  return (
    <>
      <div className="container mx-auto">
        <BreadCrumbs
          path={[
            { name: "Home", link: "/" },
            { name: "Topics", link: "/topics" },
          ]}
        />
        <h1 className="text-title dark:text-white mb-10">Topics</h1>
        <Link to="/topics/new" className="inline-block">
          <Button color="green" text="+ Add New Topic" />
        </Link>
        <div className="mt-6">
          {!loading ? (
            <Table
              connectionTypes={["All", "UM", "KAFKA"]}
              columns={["Topic name", "Type", "Connection", "Actions"]}
              data={topicData}
              actionButtonColors={["blue", "red"]}
              actionButtonIcons={[EditPen, DeleteTrash]}
              redirectTo="topics"
              onVisibleRowsChange={handleVisibleRowsChange}
              healthData={healthData}
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

export default Topics;
