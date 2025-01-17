import { useRef, useState } from "react";
import { CustomServiceName, InputErrorProps, Interface, InterfaceDeliveryOptions } from "../../../types";
import Button from "../../General/Button";
import Input from "../../General/Form/Input";
import { validateValueError } from "../../../services/formValidations";

type InterfaceFormProps = {
  submitForm: (formValue: InterfaceDeliveryOptions) => void;
  goBack: () => void;
  interfaceEnv?: Interface | null;
  customServiceName?: CustomServiceName 
};

const DeliveryCustomForm: React.FC<InterfaceFormProps> = ({
  submitForm,
  goBack,
  interfaceEnv,
  customServiceName
}) => {
  const customServiceNameRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<null | InputErrorProps>(null);

  function finishInterface(e: React.FormEvent) {
    e.preventDefault();
    const refsToValidate = [
      { ref: customServiceNameRef, validators: ["required"] },
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

    // If all validations pass, prepare form data and submit
    const newDeliveryOptions: InterfaceDeliveryOptions = {
      custom_service_name: customServiceNameRef.current?.value || "",
    };

    submitForm(newDeliveryOptions);
  }

  return (
    <form onSubmit={finishInterface}>
      <h2 className="text-subtitle mb-6">Delivery options - Custom Service</h2>

      <Input
        type="text"
        label="Custom Service Name"
        name="customServiceName"
        ref={customServiceNameRef}
        defaultValue={customServiceName ? customServiceName : []}
        error={error}
      />
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

export default DeliveryCustomForm;
