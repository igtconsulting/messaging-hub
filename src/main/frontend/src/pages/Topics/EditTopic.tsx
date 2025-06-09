import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/General/Card";
import TopicForm from "../../components/Topics/TopicForm";
import BreadCrumbs from "../../layouts/Breadcrumbs";
import { Topic } from "../../types";
import { useContext, useEffect, useState } from "react";
import { getTopic, updateTopic } from "../../services/apiService";
import { AlertContext } from "../../contextapi/AlertContext";
import Loading from "../../components/General/Loading";

const EditTopic = () => {
  const { name } = useParams<{ name: string }>();
  const { connection } = useParams<{ connection: string }>();
  const navigate = useNavigate();
  const { addAlert } = useContext(AlertContext);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getTopicData() {
      try {
        if (!name || !connection) throw Error;
        const response = await getTopic(connection, name);
        setTopic(response);
        setLoading(false);
      } catch (error) {
        addAlert("There was a problem loading the topic", "error");
      }
    }

    getTopicData();
  }, [connection, name]);

  async function onEditTopic(newTopic: Topic) {
    if (!connection || !name) {
      addAlert("Invalid connection or topic name", "error");
      return;
    }

    // console.log(newTopic, connection, name)
    try {
      await updateTopic(newTopic, connection, name);
      navigate("/topics");
      addAlert("Topic updated successfully", "success");
    } catch (error) {
      addAlert(
        "There was a problem updating the topic. Try again later",
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
            { name: "Topics", link: "/topics" },
            {
              name: name ? name : "",
              link: `/topics/${connection}/${name}/detail`,
            },
            { name: "Edit topic", link: `/topics/${connection}/${name}/edit` },
          ]}
          backLink="/topics"
        />
        <h1 className="text-title dark:text-white mb-10">Edit {name}</h1>

        <div className="mt-6">
          {loading ? (
            <Loading />
          ) : (
            <Card>
              <TopicForm
                submitForm={onEditTopic}
                topic={topic}
                connectionName={connection}
              />
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default EditTopic;
