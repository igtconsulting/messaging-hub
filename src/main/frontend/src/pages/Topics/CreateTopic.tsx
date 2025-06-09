import Card from "../../components/General/Card";
import BreadCrumbs from "../../layouts/Breadcrumbs";
import { useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AlertContext } from "../../contextapi/AlertContext";
import TopicForm from "../../components/Topics/TopicForm";
import { createTopic } from "../../services/apiService";
import { Topic } from "../../types";

const CreateTopic = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const connectionName = location.state?.connectionName || '';
  const { addAlert } = useContext(AlertContext);

  async function onCreateTopic(newTopic: Topic, connectionName: string) {
    try {
      await createTopic(newTopic, connectionName);
      navigate("/topics");
      addAlert("Topic created successfully", "success");
    } catch (error) {
      addAlert(
        "There was a problem creating the topic. Try again later",
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
            { name: "Create topic", link: "/topics/new" },
          ]}
          backLink="/topics"
        />
        <h1 className="text-title dark:text-white mb-10">Create new topic</h1>

        <div className="mt-6">
          <Card>
            <TopicForm submitForm={onCreateTopic} connectionName={connectionName} />
          </Card>
        </div>
      </div>
    </>
  );
};

export default CreateTopic;
