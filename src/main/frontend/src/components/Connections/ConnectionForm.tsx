import { useRef, useState } from "react";
import Input from "../General/Form/Input";
import { Link } from "react-router-dom";
import Button from "../General/Button";
import { validateValueError } from "../../services/formValidations";
import { Connection, InputErrorProps } from "../../types";
import Select from "../General/Form/Select";

type NewConnectionFormProps = {
  submitForm: (formValue: Connection) => void;
  connection?: Connection | null;
};

const ConnectionForm: React.FC<NewConnectionFormProps> = ({
  submitForm,
  connection,
}) => {
  const connectionNameRef = useRef<HTMLInputElement>(null);
  const isResourceNameRef = useRef<HTMLInputElement>(null);
  const prometheusUrlRef = useRef<HTMLInputElement>(null);
  const documentTypePrefixRef = useRef<HTMLInputElement>(null);
  const connectionTypeRef = useRef<HTMLSelectElement>(null);
  const [error, setError] = useState<null | InputErrorProps>(null);

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
        label="Connection type"
        disabled={connection ? true : false}
        defaultValue={connection ? connection.connection_type : undefined}
      />
      <Input
        type="text"
        label="Connection name"
        name="connectionName"
        ref={connectionNameRef}
        error={error}
        defaultValue={connection ? connection.connection_name : ""}
      />
      <Input
        type="text"
        label="IS resource name"
        name="isResourceName"
        tooltip="Connection alias name from integration server."
        ref={isResourceNameRef}
        disabled={connection ? true : false}
        error={error}
        defaultValue={connection ? connection.is_resource_name : ""}
      />
      <Input
        type="text"
        label="Prometheus URL"
        name="prometheusUrl"
        tooltip="Must start with https://"
        ref={prometheusUrlRef}
        error={error}
        optional
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
