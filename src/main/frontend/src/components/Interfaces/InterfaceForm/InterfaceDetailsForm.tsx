import { Link } from "react-router-dom";
import Button from "../../General/Button";
import Toggle from "../../General/Toggle";
import Select from "../../General/Form/Select";
import SearchableSelect from "../../General/Form/SearchableSelect";
import Input from "../../General/Form/Input";
import FilterBuilder from "../FilterBuilder/FilterBuilder";
import {
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Connection,
  InputErrorProps,
  Interface,
  InterfaceDetails,
  SelectTopicOption,
} from "../../../types";
import { validateValueError } from "../../../services/formValidations";
import {getConnection, getMessagingHubUsers, getTopic} from "../../../services/apiService";
import { AlertContext } from "../../../contextapi/AlertContext";

type InterfaceFormProps = {
  submitForm: (formValue: InterfaceDetails) => void;
  interfaceEnv?: Interface | null;
  interfaceDetails?: InterfaceDetails | null;
  packageOptions: { label: string; value: string }[];
  connectionOptions: { label: string; value: string }[];
  topicOptions: SelectTopicOption[];
};

const interface_options = [
  { label: "DEV", value: "DEV" },
  { label: "TEST", value: "TEST" },
  { label: "PROD", value: "PROD" },
];

const delivery_options = [
  { label: "Generic", value: "genericHTTPDelivery" },
  { label: "Custom Service", value: "customService" },
];

const connectionType_options = [
  { label: "UM", value: "UM" },
  { label: "Kafka", value: "KAFKA" },
];

const interfaceType_options = [
  { label: "Consumer", value: "KAFKA_CONSUMER" },
  // { label: "Producer", value: "KAFKA_PRODUCER" },
];

const InterfaceDetailsForm: React.FC<InterfaceFormProps> = ({
  submitForm,
  interfaceEnv,
  interfaceDetails,
  packageOptions,
  topicOptions,
}) => {
  const interfaceNameRef = useRef<HTMLInputElement>(null);
  const triggerUserRef = useRef<HTMLSelectElement>(null);
  const deliveryMethodRef = useRef<HTMLSelectElement>(null);
  const [enabled, setEnabled] = useState<boolean>(
    interfaceDetails ? interfaceDetails.enabled : true
  );
  const [selectedConnectionType, setSelectedConnectionType] = useState<string>(
      interfaceDetails ? (interfaceDetails?.interface_type == "UM" ? "UM" : "KAFKA") : connectionType_options[0]?.value
  );
  const filteredTopics = topicOptions.filter(
      (topic) => topic.type === selectedConnectionType
  );
  
  // Flatten the grouped topics for SearchableSelect
  const flattenedTopicOptions = filteredTopics.flatMap(group =>
    group.options.map(option => ({
      label: option.label,
      value: option.value
    }))
  );
  const [messagingHubFor, setMessagingHubFor] = useState<boolean>(
    interfaceDetails?.messaging_hub_forwarding !== "false"
      ? true
      : false
  );
  const [error, setError] = useState<null | InputErrorProps>(null);
  const { addAlert } = useContext(AlertContext);
  const [selectedPackageName, setSelectedPackageName] = useState<string>(
    (interfaceDetails && interfaceDetails.package_name) ||
      packageOptions[0]?.value
  );
  const [selectedConnectionName, setSelectedConnectionName] = useState<string>(
    interfaceDetails?.um_connection || ""
  );
  const [selectedEnv, setSelectedEnv] = useState<string>(
    (interfaceEnv && interfaceEnv.environment) || interface_options[0]?.value
  );
  const [selectedInterfaceType, setSelectedInterfaceType] = useState<string>(
    interfaceDetails?.interface_type ?? interfaceType_options[0]?.value
  );
  const [selectedSourceTopic, setSelectedSourceTopic] = useState<string>(
    interfaceDetails?.source_topic ??
      topicOptions[0]?.options[0]?.value
  );
  const [connectionDisplayName, setConnectionDisplayName] =
    useState<string>("");
  const [globalPrefix, setGlobalPrefix] = useState<string>(
    interfaceDetails?.global_prefix || ""
  );
  const [messagingHubUserOptions, setMessagingHubUserOptions] = useState<
      { label: string; value: string }[]
  >([]);
  const [triggerUser, setTriggerUser] = useState(interfaceDetails?.trigger_execution_user || "");
  const [messageFilter, setMessageFilter] = useState(interfaceDetails?.message_filter || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topicSchema, setTopicSchema] = useState<any>(null);


  useEffect(() => {
    const fetchMessagingHubUsers = async () => {
      try {
        const users = await getMessagingHubUsers();
        const options = users.map((user: string) => ({
          label: user,
          value: user,
        }));
        setMessagingHubUserOptions(options);
      } catch (error) {
        console.error("Failed to fetch messaging hub users", error);
        setMessagingHubUserOptions([]);
      }
    };

    fetchMessagingHubUsers();
  }, []);

  useEffect(() => {
    if (selectedConnectionType === "KAFKA") {
      setSelectedInterfaceType(interfaceType_options[0]?.value);
    }

    setSelectedSourceTopic(
      topicOptions.find((topic) => topic.type === selectedConnectionType)
        ?.options[0]?.value || ""
    );
  }, [selectedConnectionType, topicOptions]);

  useEffect(() => {
    if (interfaceEnv) {
      setSelectedEnv(interfaceEnv.environment || "");
    }
  }, [interfaceEnv]);

  useEffect(() => {
    const getConnectionData = async () => {
      try {
        if (!selectedConnectionName) return;
        const data: Connection = await getConnection(selectedConnectionName);
        if (data) {
          setGlobalPrefix(data?.global_prefix || "");
          setConnectionDisplayName(data?.is_resource_name || "");
        }
      } catch (error) {
        addAlert(
          "Failed to load connection data. Please try again later.",
          "error"
        );
      }
    };

    if (selectedConnectionName) {
      getConnectionData();
    }
  }, [selectedConnectionName, addAlert]);

  const handleTopicChange = useCallback(
    async (selectedOption: string) => {
      setSelectedSourceTopic(selectedOption);
      if (selectedOption) {
        const selectedConnection = topicOptions.find((group) => {
          return group.options.some(
            (option) => option.value === selectedOption
          );
        });
        const newConnectionName = selectedConnection?.label || "";
        setSelectedConnectionName(newConnectionName);
        
        // Always fetch connection data when topic changes, even if connection name is the same
        if (newConnectionName) {
          try {
            const data: Connection = await getConnection(newConnectionName);
            if (data) {
              setGlobalPrefix(data?.global_prefix || "");
              setConnectionDisplayName(data?.is_resource_name || "");
            }
            
            // Fetch topic schema for FilterBuilder
            try {
              const topicData = await getTopic(newConnectionName, selectedOption);
              if (topicData && topicData.schema) {
                // Parse the schema if it's a string
                const parsedSchema = typeof topicData.schema === 'string'
                  ? JSON.parse(topicData.schema)
                  : topicData.schema;
                setTopicSchema(parsedSchema);
              } else {
                setTopicSchema(null);
              }
            } catch (schemaError) {
              console.warn("Failed to load topic schema:", schemaError);
              setTopicSchema(null);
            }
          } catch (error) {
            addAlert(
              "Failed to load connection data. Please try again later.",
              "error"
            );
          }
        }
      }
    },
    [topicOptions, addAlert]
  );

  useEffect(() => {
    if (selectedSourceTopic && selectedConnectionType) {
      // Only auto-fill connection when connection type matches the topic type
      const selectedTopicGroup = topicOptions.find((group) => {
        return group.options.some((option) => option.value === selectedSourceTopic);
      });
      
      if (selectedTopicGroup && selectedTopicGroup.type === selectedConnectionType) {
        // Connection type matches topic type, so auto-fill
        handleTopicChange(selectedSourceTopic);
      } else {
        // Connection type doesn't match, clear connection data
        setSelectedConnectionName("");
        setConnectionDisplayName("");
        setGlobalPrefix("");
      }
    }
  }, [selectedSourceTopic, selectedConnectionType, handleTopicChange, topicOptions]);

  // Handle initial setup for new interfaces
  useEffect(() => {
    if (!interfaceDetails && selectedSourceTopic && topicOptions.length > 0 && selectedConnectionType) {
      const selectedConnection = topicOptions.find((group) => {
        return group.options.some(
          (option) => option.value === selectedSourceTopic
        );
      });
      
      // Only set connection if connection type matches topic type
      if (selectedConnection && selectedConnection.type === selectedConnectionType && !selectedConnectionName) {
        setSelectedConnectionName(selectedConnection.label);
      }
    }
  }, [selectedSourceTopic, topicOptions, interfaceDetails, selectedConnectionName, selectedConnectionType]);

  // Handle initial connection setup when editing interfaces
  useEffect(() => {
    if (interfaceDetails && selectedSourceTopic && topicOptions.length > 0 && !connectionDisplayName && selectedConnectionType) {
      // For editing interfaces, ensure connection display name is properly loaded
      const selectedConnection = topicOptions.find((group) => {
        return group.options.some(
          (option) => option.value === selectedSourceTopic
        );
      });
      
      // Only set connection if connection type matches topic type
      if (selectedConnection && selectedConnection.type === selectedConnectionType) {
        const connectionName = selectedConnection.label;
        if (connectionName && connectionName !== selectedConnectionName) {
          setSelectedConnectionName(connectionName);
        }
      }
    }
  }, [interfaceDetails, selectedSourceTopic, topicOptions, connectionDisplayName, selectedConnectionName, selectedConnectionType]);


  async function goToDelivery() {
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);
    
    try {
    // Define the type for the ref entries
    type RefEntry = {
      ref: RefObject<HTMLInputElement> | RefObject<HTMLSelectElement>;
      validators: string[];
    };

    // Array of refs to validate along with validators
    const refsToValidate: RefEntry[] = [
      { ref: interfaceNameRef, validators: ["required"] },
      { ref: triggerUserRef, validators: ["required"] },
      { ref: deliveryMethodRef, validators: [] },
    ];

    // Check if any ref is null or fails validation
    for (const { ref, validators } of refsToValidate) {
      if (ref && "current" in ref && ref.current) {
        const inputElement = ref.current;
        const inputValue = inputElement.value;
        const inputName = inputElement.name;

        // Perform validation
        const validationError = validateValueError(inputValue, validators);
        if (validationError) {
          setError({ inputName: inputName, errorMessage: validationError });
          setIsSubmitting(false);
          return;
        }
      }
    }

      // Validate selectedPackageName
      const packageNameError = validateValueError(selectedPackageName, [
        "required",
      ]);
      if (packageNameError) {
        setError({ inputName: "Package Name", errorMessage: packageNameError });
        setIsSubmitting(false);
        return;
      }
      const interfaceTypeError = validateValueError(selectedInterfaceType, ["required"]);
      if (interfaceTypeError) {
        setError({ inputName: "interface Type", errorMessage: interfaceTypeError });
        setIsSubmitting(false);
        return;
      }
      const connectionNameError = validateValueError(selectedConnectionName, [
        "required",
      ]);
      if (connectionNameError) {
        setError({ inputName: "Connection", errorMessage: connectionNameError });
        setIsSubmitting(false);
        return;
      }
      const interfaceEnvError = validateValueError(selectedEnv, ["required"]);
      if (interfaceEnvError) {
        setError({ inputName: "Environment", errorMessage: interfaceEnvError });
        setIsSubmitting(false);
        return;
      }
      const connectionTypeError = validateValueError(selectedConnectionType, [
        "required",
      ]);
      if (connectionTypeError) {
        setError({
          inputName: "Interface Type",
          errorMessage: connectionTypeError,
        });
        setIsSubmitting(false);
        return;
      }
      const sourceTopicError = validateValueError(selectedSourceTopic, [
        "required",
      ]);
      if (sourceTopicError) {
        setError({ inputName: "Source Topic", errorMessage: sourceTopicError });
        setIsSubmitting(false);
        return;
      }
      const globalPrefixError = validateValueError(globalPrefix, ["required"]);
      if (globalPrefixError) {
        setError({ inputName: "Global Prefix", errorMessage: globalPrefixError });
        setIsSubmitting(false);
        return;
      }

      // If all validations pass, prepare form data and submit
      const newInterfaceDetails: InterfaceDetails = {
        interface_name: interfaceNameRef.current?.value || "",
        interface_type:
        selectedConnectionType === 'UM'
            ? selectedConnectionType
            : selectedInterfaceType,
        package_name: selectedPackageName,
        um_connection: connectionDisplayName,
        global_prefix: globalPrefix,
        trigger_execution_user: triggerUserRef.current?.value,
        environment: selectedEnv,
        message_filter: selectedConnectionType === 'UM' ? messageFilter : "",
        delivery_method: deliveryMethodRef.current?.value,
        enabled: enabled,
        source_topic: selectedSourceTopic,
        messaging_hub_forwarding: messagingHubFor ? "true" : "false",
      };

      submitForm(newInterfaceDetails);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form>
      <h2 className="text-subtitle mb-6">Interface details</h2>
      <div className="mb-6 flex flex-col gap-2">
        <label>
          {interfaceEnv
            ? "Enable interface after editing"
            : "Enable after interface is created"}
        </label>
        <Toggle
          pressed={() => {
            setEnabled(!enabled);
          }}
          toggled={enabled}
        />
      </div>
      <Input
        type="text"
        label="Interface name"
        name="interfaceName"
        ref={interfaceNameRef}
        error={error}
        defaultValue={interfaceDetails ? interfaceDetails.interface_name : ""}
      />
      <Select
        options={connectionType_options}
        value={selectedConnectionType}
        onChange={(e) => setSelectedConnectionType(e.target.value)}
        label="Connection Type"
        disabled={interfaceDetails ? true : false}
      />
      {selectedConnectionType === "KAFKA" && (
        <Select
          options={interfaceType_options}
          value={selectedInterfaceType}
          onChange={(e) => setSelectedInterfaceType(e.target.value)}
          label="Interface Type"
          disabled={interfaceDetails ? true : false}
        />
      )}
      {flattenedTopicOptions.length === 0 ? (
          <div style={{ color: 'red', fontWeight: 'bold', marginTop: '0.5rem' }}>
            No topics available for selected connection type.
          </div>
      ) : (
          <SearchableSelect
              options={flattenedTopicOptions}
              value={selectedSourceTopic}
              onChange={(e) => handleTopicChange(e.target.value)}
              label="Source Topic"
              disabled={interfaceDetails?.enabled === false}
              placeholder="Search topics..."
          />
      )}
      <Input
        type="text"
        label={selectedConnectionType === "UM" ? "UM Connection" : "Kafka Connection"}
        name="connectionName"
        tooltip="Autofilled based on selected source topic."
        value={connectionDisplayName}
        error={error}
        disabled={true}
      />
      <Input
        type="text"
        label="Global Prefix"
        name="globalPrefix"
        tooltip="Autofilled based on selected source topic."
        value={globalPrefix}
        error={error}
        disabled={true}
      />
      <Select
        options={interface_options}
        label="Environment"
        value={selectedEnv}
        onChange={(e) => setSelectedEnv(e.target.value)}
      />
      <SearchableSelect
        options={packageOptions}
        label="Package name"
        value={selectedPackageName}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPackageName(e.target.value)}
        placeholder="Search packages..."
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label htmlFor="triggerUser" className="font-roboto flex gap-2 items-center">
          Trigger execution user
          <span className="text-red">*</span>
        </label>

        <div className="relative group inline-block" style={{ verticalAlign: 'middle', cursor: 'pointer' }} aria-label="Info">
          <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              className="text-gray-600"
          >
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m-1-7v2h2v-2zm2-1.645A3.502 3.502 0 0 0 12 6.5a3.501 3.501 0 0 0-3.433 2.813l1.962.393A1.5 1.5 0 1 1 12 11.5a1 1 0 0 0-1 1V14h2z" />
          </svg>

          <div className="absolute z-40 hidden px-1 min-w-48 max-w-56 text-sm text-gray-darker border border-gray-light bg-white shadow-lg opacity-0 group-hover:block group-hover:opacity-100 transition-opacity duration-300 left-full top-1/2 transform -translate-y-1/2 ml-6 rounded-sm">
            <div className="w-full h-full p-1.5 text-center">
              Trigger Execution User must be assigned to MessagingHub group on Integration Server.
            </div>
            <div className="absolute w-6 h-6 bg-white transform rotate-45 border-gray-light left-0 top-1/2 -translate-y-1/2 -ml-[0.78rem] border-l border-b"></div>
          </div>
        </div>
      </div>


      {messagingHubUserOptions.length === 0 ? (
          <div style={{ color: 'red', fontWeight: 'bold', marginTop: '0.5rem' }}>
            Messaging Hub has no available users.
          </div>
      ) : (
          <SearchableSelect
              options={messagingHubUserOptions}
              ref={triggerUserRef}
              name="triggerUser"
              id="triggerUser"
              value={triggerUser}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTriggerUser(e.target.value)}
              error={error}
              label=""
              optional={true}
              placeholder="Search users..."
          />

          // <Select
          //     options={messagingHubUserOptions}
          //     ref={triggerUserRef}
          //     name="triggerUser"
          //     id="triggerUser"
          //     value={interfaceDetails?.trigger_execution_user || ""}
          //     error={error}
          // />
      )}
      {selectedConnectionType === "UM" && (
        <FilterBuilder
          value={messageFilter}
          onChange={setMessageFilter}
          error={error}
          name="messageFilter"
          label="Message filter"
          disabled={false}
          schema={topicSchema}
        />
      )}
      <Select
        options={delivery_options}
        ref={deliveryMethodRef}
        label="Delivery Method"
        defaultValue={interfaceDetails ? interfaceDetails.delivery_method : ""}
      />
      <div className="mb-6 flex flex-col gap-2">
        <label>Save last message of the interface</label>
        <Toggle
          pressed={() => {
            setMessagingHubFor(!messagingHubFor);
          }}
          toggled={messagingHubFor}
        />
      </div>
      <div className="flex gap-2">
        <Link to="/interfaces">
          <Button text="Cancel" color="gray" type="button" />
        </Link>
        <Button
          text={isSubmitting ? "Processing..." : "Next"}
          type="button"
          color="green"
          onClick={goToDelivery}
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
};

export default InterfaceDetailsForm;
