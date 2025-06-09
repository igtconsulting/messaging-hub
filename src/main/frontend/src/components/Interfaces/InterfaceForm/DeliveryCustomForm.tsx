import {useEffect, useRef, useState} from "react";
import { CustomServiceName, InputErrorProps, Interface, InterfaceDeliveryOptions } from "../../../types";
import Button from "../../General/Button";
import { validateValueError } from "../../../services/formValidations";
import {getCustomServices} from "../../../services/apiService.ts";
import SearchableSelect from "../../General/Form/SearchableSelect.tsx";

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
  const customServiceNameRef = useRef<HTMLSelectElement>(null);
  const [error, setError] = useState<null | InputErrorProps>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customServiceOptions, setCustomServiceOptions] = useState<
      { label: string; value: string }[]
  >([]);

  useEffect(() => {
    const fetchCustomServices = async () => {
      try {
        const services = await getCustomServices();
        const options = services.map((service: string) => ({
          label: service,
          value: service,
        }));
        setCustomServiceOptions(options);
      } catch (error) {
        console.error("Failed to fetch custom services", error);
        setCustomServiceOptions([]);
      }
    };

    fetchCustomServices();
  }, []);

  async function finishInterface(e: React.FormEvent) {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // Add minimum loading time to ensure user sees the feedback
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const refsToValidate = [
        { ref: customServiceNameRef, validators: ["required"] },
      ];

      // Check if any ref is null or fails validation
      for (const { ref, validators } of refsToValidate) {
        const inputElement = ref.current;
        if (!inputElement) {
          setIsSubmitting(false);
          return;
        }

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

      // If all validations pass, prepare form data and submit
      const newDeliveryOptions: InterfaceDeliveryOptions = {
        custom_service_name: customServiceNameRef.current?.value || "",
      };

      const submitPromise = submitForm(newDeliveryOptions);

      // Wait for both the submission and minimum loading time
      await Promise.all([submitPromise, minLoadingTime]);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={finishInterface}>
      <h2 className="text-subtitle mb-6">Delivery options - Custom Service</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label htmlFor="customServiceName">
          Custom Service Name
        </label>

        <div
            className="relative group inline-block"
            style={{ verticalAlign: 'middle', cursor: 'pointer' }}
            aria-label="Info"
        >
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
              Services executable by MessagingHub group.
            </div>
            <div className="absolute w-6 h-6 bg-white transform rotate-45 border-gray-light left-0 top-1/2 -translate-y-1/2 -ml-[0.78rem] border-l border-b"></div>
          </div>
        </div>
      </div>

      {customServiceOptions.length === 0 ? (
          <div style={{ color: 'red', fontWeight: 'bold', marginTop: '0.5rem' }}>
            No custom services available for MessagingHub group.
          </div>
      ) : (
          <SearchableSelect
              options={customServiceOptions}
              ref={customServiceNameRef}
              name="customServiceName"
              id="customServiceName"
              value={customServiceName || ""}
              error={error}
              label=""
              placeholder="Search services..."
          />
      )}
      <div className="flex gap-2">
        <Button text="Back" color="gray" type="button" onClick={goBack} />
        <Button
          text={isSubmitting ? "Processing..." : (interfaceEnv ? "Save changes" : "Create interface")}
          type="submit"
          color="green"
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
};

export default DeliveryCustomForm;
