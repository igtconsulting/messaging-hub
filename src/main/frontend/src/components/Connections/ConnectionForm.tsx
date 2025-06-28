import React, {useEffect, useRef, useState} from "react";
import Input from "../General/Form/Input";
import { Link } from "react-router-dom";
import Button from "../General/Button";
import { validateValueError } from "../../services/formValidations";
import { Connection, InputErrorProps } from "../../types";
import Select from "../General/Form/Select";
import SearchableSelect from "../General/Form/SearchableSelect";
import {getServerConnections} from "../../services/apiService.ts";

type NewConnectionFormProps = {
  submitForm: (formValue: Connection) => void;
  connection?: Connection | null;
};



const ConnectionForm: React.FC<NewConnectionFormProps> = ({
  submitForm,
  connection,
}) => {
  const connectionNameRef = useRef<HTMLInputElement>(null);
  // const isResourceNameRef = useRef<HTMLInputElement>(null);
  const isResourceNameRef = useRef<HTMLSelectElement>(null);
  const prometheusUrlRef = useRef<HTMLInputElement>(null);
  const documentTypePrefixRef = useRef<HTMLInputElement>(null);
  const connectionTypeRef = useRef<HTMLSelectElement>(null);
  const [error, setError] = useState<null | InputErrorProps>(null);
  const [isResourceNameOptions, setIsResourceNameOptions] = useState<
      { label: string; value: string }[]
  >([]);
  const [selectedConnectionType, setSelectedConnectionType] = useState(
      connection?.connection_type || "UM"
  );

  useEffect(() => {
    const fetchAliases = async () => {
      if (!selectedConnectionType) return;

      try {
        const aliases = await getServerConnections(selectedConnectionType);
        const options = aliases.map((item: { is_resource_name: string }) => ({
          label: item.is_resource_name,
          value: item.is_resource_name,
        }));
        setIsResourceNameOptions(options);
      } catch (error) {
        console.error("Failed to fetch aliases", error);
        setIsResourceNameOptions([]);
      }
    };

    fetchAliases();
  }, [selectedConnectionType]);

  function formSubmittion(e: React.FormEvent) {
    e.preventDefault();
    if (
      !connectionNameRef.current ||
      !isResourceNameRef.current ||
      !prometheusUrlRef.current ||
      !documentTypePrefixRef.current ||
      !connectionTypeRef.current
    ) {
      // handle error
      return;
    }
    const error = validateForm();
    if (error) {
      setError(error);
      return;
    }

    const formValues = {
      connection_name: connectionNameRef.current.value,
      is_resource_name: isResourceNameRef.current.value,
      prometheus_url: prometheusUrlRef.current.value,
      global_prefix: documentTypePrefixRef.current.value,
      connection_type: connectionTypeRef.current.value,
    };

    submitForm(formValues);
  }

  function validateForm() {
    // Connection type
    let inputValue = connectionTypeRef.current?.value;
    let inputName = connectionTypeRef.current?.name;

    let validationError = validateValueError(inputValue, ["required"]);
    if (validationError)
      return { inputName: inputName, errorMessage: validationError };

    // Connection name validation
    inputValue = connectionNameRef.current?.value;
    inputName = connectionNameRef.current?.name;

    validationError = validateValueError(inputValue, ["required"]);
    if (validationError)
      return { inputName: inputName, errorMessage: validationError };


    // IS Resource Name validation
    inputValue = isResourceNameRef.current?.value;
    inputName = isResourceNameRef.current?.name;

    validationError = validateValueError(inputValue, ["required"]);
    if (validationError)
      return { inputName: inputName, errorMessage: validationError };

    // Prometheus url validation
    inputValue = prometheusUrlRef.current?.value;
    inputName = prometheusUrlRef.current?.name;

    if (inputValue !== "") {
      validationError = validateValueError(inputValue, ["required", "url"]);
    }
    if (validationError)
      return { inputName: inputName, errorMessage: validationError };

    // Document type prefix validation
    inputValue = documentTypePrefixRef.current?.value;
    inputName = documentTypePrefixRef.current?.name;

    validationError = validateValueError(inputValue, ["required"]);
    if (validationError)
      return { inputName: inputName, errorMessage: validationError };

    return null;
  }

  const connection_options = [
    { label: "UM", value: "UM" },
    { label: "Kafka", value: "KAFKA" },
  ];

  return (
    <form onSubmit={formSubmittion}>
      <Select
          options={connection_options}
          ref={connectionTypeRef}
          name="connectionType"
          label="Connection type"
          disabled={!!connection}
          value={selectedConnectionType}
          error={error}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setSelectedConnectionType(e.target.value);
          }}
      />
      <Input
        type="text"
        label="Connection name"
        name="connectionName"
        tooltip="Name of the connection in MessagingHub"
        ref={connectionNameRef}
        error={error}
        disabled={connection ? true : false}
        defaultValue={connection ? connection.connection_name : ""}
      />
      {isResourceNameOptions.length === 0 ? (
          <div style={{ color: 'red', fontWeight: 'bold', marginTop: '0.5rem' }}>
            Integration Server has no existing connection for selected connection type.
          </div>
      ) : (
          <SearchableSelect
              options={isResourceNameOptions}
              ref={isResourceNameRef}
              name="isResourceName"
              label="IS resource name"
              disabled={connection ? true : !selectedConnectionType}
              value={connection?.is_resource_name || ""}
              error={error}
              placeholder="Search IS resources..."
          />
      )}
      <Input
        type="text"
        label="Prometheus URL"
        name="prometheusUrl"
        tooltip="Must start with https://"
        ref={prometheusUrlRef}
        error={error}
        optional
        disabled={connection ? true : false}
        defaultValue={connection ? connection.prometheus_url : ""}
      />
      <Input
        type="text"
        label="Document type prefix"
        name="documentTypePrefix"
        tooltip="Used as namespace for topics and interfaces. Must be unique for each connection."
        ref={documentTypePrefixRef}
        error={error}
        disabled={connection ? true : false}
        defaultValue={connection ? connection.global_prefix : ""}
      />
      <div className="flex gap-2">
        <Link to="/connections">
          <Button text="Cancel" color="gray" type="button" />
        </Link>
        <Button
          text={connection ? "Save changes" : "Create connection"}
          type="submit"
          color="green"
        />
      </div>
    </form>
  );
};

export default ConnectionForm;
