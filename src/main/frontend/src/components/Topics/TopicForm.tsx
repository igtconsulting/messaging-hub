import { useContext, useEffect, useMemo, useState } from "react";
import { validateValueError } from "../../services/formValidations";
import { Connection, InputErrorProps, Package, Topic, TreeNode } from "../../types";
import Input from "../General/Form/Input";
import Select from "../General/Form/Select";
import { Link } from "react-router-dom";
import Button from "../General/Button";
import { getConnections, getPackages } from "../../services/apiService";
import { AlertContext } from "../../contextapi/AlertContext";
import Scheme from "./Scheme/Scheme";
import { convertToJsonStructure } from "../../services/schemeFormating";
import { formatConnectionDataForSelect } from "../../services/dataFormating";

type TopicFormProps = {
  submitForm: (formValue: Topic, connectionName: string) => void;
  topic?: Topic | null;
  connectionName?: string;
};

const TopicForm: React.FC<TopicFormProps> = ({
  submitForm,
  topic,
  connectionName,
}) => {
  const [selectedPackageName, setSelectedPackageName] = useState<string>(
    topic?.packageName ?? ""
  );
  const [selectedConnectionName, setSelectedConnectionName] = useState<string>(
    connectionName ?? ""
  );
  const [error, setError] = useState<null | InputErrorProps>(null);
  const [packageData, setPackageData] = useState<
    Package[]
  >([]);
  const [connectionData, setConnectionData] = useState<
    Connection[]
  >([]);
  const [topicName, setTopicName] = useState<string>(
    topic ? topic.topicName : ""
  );
  const [schemeData, setSchemeData] = useState<TreeNode[]>([]);
  const { addAlert } = useContext(AlertContext);

  useEffect(() => {
    const getPackageData = async () => {
      try {
        const data: Package[] = await getPackages();
        setPackageData(data);
        if (!topic && data.length > 0) {
          setSelectedPackageName(data[0].name);
        }
      } catch (error) {
        addAlert(
          "Failed to load packages data. Please try again later.",
          "error"
        );
      }
    };
    const getConnectionData = async () => {
      try {
        const data: Connection[] = await getConnections();
        setConnectionData(data);
        if ((!topic && data.length > 0) && !connectionName) {
          setSelectedConnectionName(data[0].connection_name);
        }
      } catch (error) {
        addAlert(
          "Failed to load connections data. Please try again later.",
          "error"
        );
      }
    };

    getConnectionData();
    getPackageData();
  }, []);

  function formSubmittion(e: React.FormEvent) {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setError(error);
      return;
    }
    if (!(schemeData.length > 0)) {
      addAlert("Please create a scheme with at least one node.", "error");
      return;
    }
    const schemeJson = convertToJsonStructure(schemeData);
    const stringifiedJsonSchema = JSON.stringify(schemeJson);
    const formValues = {
      packageName: selectedPackageName,
      topicName: topicName,
      schema: stringifiedJsonSchema.replace(/\\/g, ""),
    };

    submitForm(formValues, selectedConnectionName);
  }

  function validateForm() {
    let validationError = validateValueError(topicName, ["required", "noSpace"]);
    if (validationError)
      return { inputName: "topicName", errorMessage: validationError };

    let inputValue = selectedPackageName;
    let inputName = "packageName";

    validationError = validateValueError(inputValue, ["required"]);
    if (validationError)
      return { inputName: inputName, errorMessage: validationError };

    inputValue = selectedConnectionName;
    inputName = "connectionName";

    validationError = validateValueError(inputValue, ["required"]);
    if (validationError)
      return { inputName: inputName, errorMessage: validationError };

    return null;
  }

  const formattedConnectionData = useMemo(() => {
    return formatConnectionDataForSelect(connectionData)
  }, [connectionData])

  const formattedPackageData = useMemo(() => {
    return packageData.map(({ name }) => ({
      label: name,
      value: name,
    }));
  }, [packageData])

  const isKafkaConn = connectionData.find(el => el.connection_name == selectedConnectionName)?.connection_type == "KAFKA"
  const initialSchemeData = useMemo(() => {
    return topic?.schema ? JSON.parse(topic.schema) : []
  }, [topic])

  return (
    <form onSubmit={formSubmittion}>
      <h1 className="text-subtitle dark:text-white mb-5">Topic information</h1>
      <Input
        type="text"
        label="Topic Name"
        name="topicName"
        error={error}
        value={topicName}
        onChange={(e) => setTopicName(e.target.value)}
      />
      <Select
        options={formattedPackageData}
        label="Package"
        value={selectedPackageName}
        onChange={(e) => setSelectedPackageName(e.target.value)}
      />
      <Select
        options={formattedConnectionData}
        label="Connection"
        value={selectedConnectionName}
        onChange={(e) => setSelectedConnectionName(e.target.value)}
        disabled={topic ? true : false}
      />
      <h1 className="text-subtitle dark:text-white mb-5">Schema</h1>
      <Scheme
        topicName={topicName}
        editable={!isKafkaConn}
        onChange={setSchemeData}
        isDefaultKafkaSchema={isKafkaConn}
        data={initialSchemeData}
      />
      <div className="flex gap-5 mt-8">
        <Link to="/topics">
          <Button text="Cancel" color="gray" type="button" />
        </Link>
        <Button
          text={topic ? "Save changes" : "Create topic"}
          type="submit"
          color="green"
        />
      </div>
    </form>
  );
};

export default TopicForm;
