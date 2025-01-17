import { Link } from "react-router-dom";
import Button from "../../General/Button";
import Toggle from "../../General/Toggle";
import Select from "../../General/Form/Select";
import Input from "../../General/Form/Input";
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
import { getConnection } from "../../../services/apiService";
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
  const triggerUserRef = useRef<HTMLInputElement>(null);
  const messageFilterRef = useRef<HTMLInputElement>(null);
  const deliveryMethodRef = useRef<HTMLSelectElement>(null);
  const [enabled, setEnabled] = useState<boolean>(
    interfaceDetails ? interfaceDetails.enabled : true
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
    ""
  );
  const [selectedEnv, setSelectedEnv] = useState<string>(
    (interfaceEnv && interfaceEnv.environment) || interface_options[0]?.value
  );
  const [selectedConnectionType, setSelectedConnectionType] = useState<string>(
    interfaceDetails ? (interfaceDetails?.interface_type == "UM" ? "UM" : "KAFKA") : connectionType_options[0]?.value
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
  const [globalPrefix, setGlobalPrefix] = useState<string>("");

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
        if (!selectedConnectionName) return
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

    getConnectionData();
  }, [selectedConnectionName, addAlert]);

  const handleTopicChange = useCallback(
    (selectedOption: string) => {
      setSelectedSourceTopic(selectedOption);
      if (selectedOption) {
        const selectedConnection = topicOptions.find((group) => {
          return group.options.some(
            (option) => option.value === selectedOption
          );
        });
        setSelectedConnectionName(selectedConnection?.label || "");
      }
    },
    [topicOptions]
  );

  useEffect(() => {
    if (selectedSourceTopic) {
      handleTopicChange(selectedSourceTopic);
    }
  }, [selectedSourceTopic, handleTopicChange]);


  function goToDelivery() {
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
      return;
    }
    const interfaceTypeError = validateValueError(selectedInterfaceType, ["required"]);
    if (interfaceTypeError) {
      setError({ inputName: "interface Type", errorMessage: interfaceTypeError });
      return;
    }
    const connectionNameError = validateValueError(selectedConnectionName, [
      "required",
    ]);
    if (connectionNameError) {
      setError({ inputName: "Connection", errorMessage: connectionNameError });
      return;
    }
    const interfaceEnvError = validateValueError(selectedEnv, ["required"]);
    if (interfaceEnvError) {
      setError({ inputName: "Environment", errorMessage: interfaceEnvError });
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
      return;
    }
    const sourceTopicError = validateValueError(selectedSourceTopic, [
      "required",
    ]);
    if (sourceTopicError) {
      setError({ inputName: "Source Topic", errorMessage: sourceTopicError });
      return;
    }
    const globalPrefixError = validateValueError(globalPrefix, ["required"]);
    if (globalPrefixError) {
      setError({ inputName: "Global Prefix", errorMessage: globalPrefixError });
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
      message_filter: selectedConnectionType === 'UM' ? messageFilterRef.current?.value : "",
      delivery_method: deliveryMethodRef.current?.value,
      enabled: enabled,
      source_topic: selectedSourceTopic,
      messaging_hub_forwarding: messagingHubFor ? "true" : "false",
    };

    submitForm(newInterfaceDetails);
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
      <Select
        options={topicOptions.filter(
          (topic) => topic.type === selectedConnectionType
        )}
        value={selectedSourceTopic}
        onChange={(e) => handleTopicChange(e.target.value)}
        label="Source Topic"
        disabled={interfaceDetails ? true : false}
      />
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
      <Select
        options={packageOptions}
        label="Package name"
        value={selectedPackageName}
        onChange={(e) => setSelectedPackageName(e.target.value)}
      />
      <Input
        type="text"
        label="Trigger execution user"
        name="triggerUser"
        ref={triggerUserRef}
        error={error}
        defaultValue={
          interfaceDetails ? interfaceDetails.trigger_execution_user : ""
        }
      />
      {selectedConnectionType === "UM" && (
        <Input
        type="text"
        label="Message filter"
        name="messageFilter"
        ref={messageFilterRef}
        error={error}
        defaultValue={interfaceDetails ? interfaceDetails.message_filter : ""}
      />
      )}
      <Select
        options={delivery_options}
        ref={deliveryMethodRef}
        label="deliveryMethod"
        defaultValue={interfaceDetails ? interfaceDetails.delivery_method : ""}
      />
      <div className="mb-6 flex flex-col gap-2">
        <label>Messaging hub forwarding</label>
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
          text="Next"
          type="button"
          color="green"
          onClick={goToDelivery}
        />
      </div>
    </form>
  );
};

export default InterfaceDetailsForm;
