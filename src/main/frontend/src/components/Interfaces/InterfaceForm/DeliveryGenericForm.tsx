import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  GenericDeliveryConfig,
  InputErrorProps,
  Interface,
  InterfaceDeliveryOptions,
  Topic,
} from "../../../types";
import Button from "../../General/Button";
import Input from "../../General/Form/Input";
import Select from "../../General/Form/Select";
import { validateValueError } from "../../../services/formValidations";
import MultiSelect from "../../General/Form/MultiSelect";
import { convertToArrayStructure } from "../../../services/schemeFormating";

type InterfaceFormProps = {
  submitForm: (formValue: InterfaceDeliveryOptions) => void;
  goBack: () => void;
  interfaceEnv?: Interface | null;
  interfaceGenericOptions?: GenericDeliveryConfig[];
  sourceTopic?: Topic;
};

const authTypeOptions = [
  { label: "Basic", value: "Basic" },
  { label: "None", value: "None" },
  { label: "Bearer", value: "Bearer" },
];

const deliveryFormatOptions = [
  { label: "application/json", value: "application/json" },
  { label: "xml", value: "xml" },
];

type AuthType = "None" | "Basic" | "Bearer";

const DeliveryGenericForm: React.FC<InterfaceFormProps> = ({
  submitForm,
  goBack,
  interfaceEnv,
  interfaceGenericOptions,
  sourceTopic,
}) => {
  const genericDeliveryConfig = interfaceGenericOptions
    ? interfaceGenericOptions[0]
    : null;
  const [authType, setAuthType] = useState<AuthType>(
    genericDeliveryConfig ? genericDeliveryConfig.auth.auth_type : "Basic"
  );
  const deliveryEndpointRef = useRef<HTMLInputElement>(null);
  const deliveryFormatRef = useRef<HTMLSelectElement>(null);
  const authUsernameRef = useRef<HTMLInputElement>(null);
  const authPasswordRef = useRef<HTMLInputElement>(null);
  const tokenServiceRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<null | InputErrorProps>(null);
  const [excludedFields, setExcludedFields] = useState<string[]>([]);

  function finishInterface(e: React.FormEvent) {
    e.preventDefault();

    const authProperties =
      authType == "Basic"
        ? [
            { ref: authUsernameRef, validators: ["required"] },
            { ref: authPasswordRef, validators: ["required"] },
          ]
        : authType == "Bearer"
        ? [{ ref: tokenServiceRef, validators: ["required"] }]
        : [];

    const refsToValidate = [
      { ref: deliveryEndpointRef, validators: ["required"] },
      { ref: deliveryFormatRef, validators: ["required"] },
      ...authProperties,
    ];

    // Check if any ref is null or fails validation
    for (const { ref, validators } of refsToValidate) {
      const inputElement = ref.current;
      if (!inputElement) {
        return;
      }

      const inputValue = inputElement.value;
      const inputName = inputElement.name;
      // Perform validation
      const validationError = validateValueError(inputValue, validators);
      if (validationError) {
        setError({ inputName: inputName, errorMessage: validationError });
        return;
      }
    }

    const authSettings =
      authType == "Basic"
        ? {
            auth_user_name: authUsernameRef.current?.value || "",
            auth_password: authPasswordRef.current?.value || "",
          }
        : authType == "Bearer"
        ? { auth_tokan_service: tokenServiceRef.current?.value }
        : {};

    // If all validations pass, prepare form data and submit
    const newDeliveryOptions: InterfaceDeliveryOptions = {
      genericDeliveryConfig: [
        {
          delivery_endpoint: deliveryEndpointRef.current?.value || "",
          delivery_format: deliveryFormatRef.current?.value || "",
          exclude_fields: excludedFields.join(","),
          auth: {
            auth_type: authType,
            ...authSettings,
          },
        },
      ],
    };

    submitForm({
      ...newDeliveryOptions,
      custom_service_name: import.meta.env.VITE_GI_CUSTOM_SERVICE_NAME,
    });
  }

  const authInputs: { [key in AuthType]: JSX.Element } = {
    None: <></>,
    Basic: (
      <>
        <Input
          type="text"
          label="Username"
          ref={authUsernameRef}
          error={error}
          name="authUsername"
          defaultValue={
            genericDeliveryConfig
              ? genericDeliveryConfig.auth.auth_user_name
              : ""
          }
        />
        <Input
          type="password"
          label="Password"
          ref={authPasswordRef}
          error={error}
          name="authPassword"
          defaultValue={
            genericDeliveryConfig
              ? genericDeliveryConfig.auth.auth_password
              : ""
          }
        />
      </>
    ),
    Bearer: (
      <>
        <Input
          type="text"
          label="Token Service"
          ref={tokenServiceRef}
          error={error}
          name="authTokenService"
          defaultValue={
            genericDeliveryConfig
              ? genericDeliveryConfig.auth.auth_token_service
              : ""
          }
        />
      </>
    ),
  };

  const excludeFields = useMemo(() => {
    const fields = convertToArrayStructure(
      sourceTopic?.schema ? JSON.parse(sourceTopic.schema) : [],
      sourceTopic?.topicName || ""
    );
    fields.shift();
    return [
      ...[
        { label: "esbDocid", value: "esbDocid" },
        { label: "_env", value: "_env" },
      ],
      ...fields.map((el) => ({ value: el.name, label: el.name })),
    ];
  }, [sourceTopic?.topicName, sourceTopic?.schema]);

  return (
    <form onSubmit={finishInterface}>
      <h2 className="text-subtitle mb-6">Delivery - Generic</h2>

      <Input
        type="text"
        label="Delivery Endpoint"
        ref={deliveryEndpointRef}
        error={error}
        name="deliveryEndpoint"
        defaultValue={
          genericDeliveryConfig ? genericDeliveryConfig.delivery_endpoint : ""
        }
      />
      <Select
        options={deliveryFormatOptions}
        ref={deliveryFormatRef}
        label="deliveryFormat"
        defaultValue={
          genericDeliveryConfig ? genericDeliveryConfig.delivery_format : ""
        }
      />
      {/* <Input
        type="text"
        label="Delivery Format"
        ref={deliveryFormatRef}
        error={error}
        name="deliveryFormat"
        defaultValue={
          genericDeliveryConfig ? genericDeliveryConfig.delivery_format : ""
        }
      /> */}
      {/*<div className="flex items-center gap-2">
        <Input type="text" label="Excluded Fields" ref={excludedFieldRef} />
        <Button
          text="add"
          color="green"
          onClick={addExcludedField}
          type="button"
        />
      </div>

      <div className="flex gap-2 w-full max-w-[659px] mb-6 flex-wrap">
        {excludedFieldsElement}
      </div> */}

      <MultiSelect
        label="Excluded fields"
        options={excludeFields}
        onChange={setExcludedFields}
      />

      <h2 className="text-subtitle mb-6">Authentication</h2>
      <Select
        options={authTypeOptions}
        label="Auth Type"
        value={authType}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          setAuthType(e.target.value as AuthType)
        }
      />

      {authInputs[authType]}

      <div className="flex gap-2">
        <Button text="Back" color="gray" type="button" onClick={goBack} />
        <Button
          text={interfaceEnv ? "Save changes" : "Create interface"}
          type="submit"
          color="green"
        />
      </div>
    </form>
  );
};

export default DeliveryGenericForm;
