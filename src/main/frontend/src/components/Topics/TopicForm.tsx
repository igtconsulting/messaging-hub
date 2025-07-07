import { useContext, useEffect, useMemo, useState } from "react";
import { validateValueError } from "../../services/formValidations";
import { Connection, InputErrorProps, Package, Topic, TreeNode } from "../../types";
import Input from "../General/Form/Input";
import SearchableSelect from "../General/Form/SearchableSelect";
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
  const [selectedConnectionType, setSelectedConnectionType] = useState<string>("");
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        
        // If editing a topic, set the connection type from the current connection
        if (topic && connectionName) {
          const currentConn = data.find(conn => conn.connection_name === connectionName);
          if (currentConn) {
            setSelectedConnectionType(currentConn.connection_type);
          }
        } else if (!topic && data.length > 0) {
          // When creating new topic, default to first available connection type
          const availableTypes = [...new Set(data.map(conn => conn.connection_type))];
          if (availableTypes.length > 0) {
            setSelectedConnectionType(availableTypes[0]);
            // Set first connection of that type as default
            const firstConnOfType = data.find(conn => conn.connection_type === availableTypes[0]);
            if (firstConnOfType && !connectionName) {
              setSelectedConnectionName(firstConnOfType.connection_name);
            }
          }
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

  async function formSubmittion(e: React.FormEvent) {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);
    
    try {
      const error = validateForm();
      if (error) {
        setError(error);
        setIsSubmitting(false);
        return;
      }
      if (!(schemeData.length > 0)) {
        addAlert("Please create a scheme with at least one node.", "error");
        setIsSubmitting(false);
        return;
      }
      const schemeJson = convertToJsonStructure(schemeData);
      const stringifiedJsonSchema = JSON.stringify(schemeJson);
      const formValues = {
        packageName: selectedPackageName,
        topicName: topicName,
        schema: stringifiedJsonSchema.replace(/\\/g, ""),
        connectionName: selectedConnectionName,
      };

      await submitForm(formValues, selectedConnectionName);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
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

    inputValue = selectedConnectionType;
    inputName = "connectionType";

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
    // Filter connections based on selected connection type
    if (selectedConnectionType) {
      const filteredConnections = connectionData.filter(conn =>
        conn.connection_type === selectedConnectionType
      );
      return formatConnectionDataForSelect(filteredConnections);
    }
    return [];
  }, [connectionData, selectedConnectionType])

  // Available connection types
  const connectionTypeOptions = useMemo(() => {
    const types = [...new Set(connectionData.map(conn => conn.connection_type))];
    return types.map(type => ({ label: type, value: type }));
  }, [connectionData]);

  // Handle connection type change
  const handleConnectionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setSelectedConnectionType(newType);
    
    // Reset selected connection and pick first available of new type
    const connectionsOfType = connectionData.filter(conn => conn.connection_type === newType);
    if (connectionsOfType.length > 0) {
      setSelectedConnectionName(connectionsOfType[0].connection_name);
    } else {
      setSelectedConnectionName("");
    }
  };

  const formattedPackageData = useMemo(() => {
    return packageData.map(({ name }) => ({
      label: name,
      value: name,
    }));
  }, [packageData])

  const isKafkaConn = selectedConnectionType === "KAFKA"
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
      <SearchableSelect
        options={formattedPackageData}
        name="packageName"
        label="Package"
        value={selectedPackageName}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPackageName(e.target.value)}
        error={error}
        placeholder="Search packages..."
      />
      {topic ? (
        <Input
          type="text"
          label="Connection Type"
          name="connectionType"
          value={selectedConnectionType}
          disabled={true}
          tooltip="Connection type cannot be changed when editing a topic"
        />
      ) : (
        <SearchableSelect
          options={connectionTypeOptions}
          name="connectionType"
          label="Connection Type"
          value={selectedConnectionType}
          onChange={handleConnectionTypeChange}
          error={error}
          placeholder="Select connection type..."
        />
      )}
      <SearchableSelect
        options={formattedConnectionData}
        name="connectionName"
        label="Connection"
        value={selectedConnectionName}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedConnectionName(e.target.value)}
        error={error}
        placeholder="Search connections..."
      />
      <h1 className="text-subtitle dark:text-white mb-5">Schema</h1>
      <Scheme
        topicName={topicName}
        editable={true}
        onChange={setSchemeData}
        isDefaultKafkaSchema={isKafkaConn && !topic}
        isKafkaConnection={isKafkaConn}
        data={initialSchemeData}
      />
      <div className="flex gap-5 mt-8">
        <Link to="/topics">
          <Button text="Cancel" color="gray" type="button" />
        </Link>
        <Button
          text={isSubmitting ? "Processing..." : (topic ? "Save changes" : "Create topic")}
          type="submit"
          color="green"
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
};

export default TopicForm;
