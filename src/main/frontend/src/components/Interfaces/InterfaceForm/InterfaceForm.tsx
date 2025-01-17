import {
  Connection,
  Interface,
  InterfaceDeliveryOptions,
  InterfaceDetails,
  Package,
  Topic,
} from "../../../types";
import { useContext, useEffect, useMemo, useState } from "react";
import InterfaceDetailsForm from "./InterfaceDetailsForm";
import DeliveryGenericForm from "./DeliveryGenericForm";
import DeliveryCustomForm from "./DeliveryCustomForm";
import {
  getConnections,
  getPackages,
  getTopics,
} from "../../../services/apiService";
import { AlertContext } from "../../../contextapi/AlertContext";
import {
  formatConnectionDataForSelect,
  formatTopicDataForSelect,
} from "../../../services/dataFormating";
import Loading from "../../General/Loading";

type InterfaceFormProps = {
  submitForm: (formValue: Interface) => void;
  interfaceEnv?: Interface | null;
};

const InterfaceForm: React.FC<InterfaceFormProps> = ({
  submitForm,
  interfaceEnv,
}) => {
  const [interfaceDetails, setInterfaceDetails] =
    useState<InterfaceDetails | null>(interfaceEnv ?? null);
  const [currentState, setCurrentState] = useState(0);
  const [packageData, setPackageData] = useState<
    { label: string; value: string }[]
  >([]);
  const [connectionData, setConnectionData] = useState<
    { label: string; value: string }[]
  >([]);
  const [topicData, setTopicData] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { addAlert } = useContext(AlertContext);

  useEffect(() => {
    const getPackageData = async () => {
      const data: Package[] = await getPackages();
      const formattedData = data.map(({ name }) => ({
        label: name,
        value: name,
      }));
      setPackageData(formattedData);
    };

    const getConnectionData = async () => {
      const data: Connection[] = await getConnections();
      const formattedData = formatConnectionDataForSelect(data);
      setConnectionData(formattedData);
    };

    const getTopicData = async () => {
      const data: Topic[] = await getTopics();
      setTopicData(data);
    };

    Promise.all([getPackageData(), getConnectionData(), getTopicData()])
      .catch(() => {
        setError(true);
        addAlert("Failed to load neccessary data", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [addAlert]);

  function goToDelivery(newInterfaceDetails: InterfaceDetails) {
    setInterfaceDetails(newInterfaceDetails);
    setCurrentState(1);
  }

  function finishInterface(deliveryOptions: InterfaceDeliveryOptions) {
    if (interfaceDetails)
      submitForm({ ...interfaceDetails, ...deliveryOptions });
  }

  const formattedTopicData = useMemo(() => {
    return formatTopicDataForSelect(topicData);
  }, [topicData]);

  const components = [
    <InterfaceDetailsForm
      submitForm={goToDelivery}
      interfaceDetails={interfaceDetails}
      interfaceEnv={interfaceEnv}
      packageOptions={packageData}
      connectionOptions={connectionData}
      topicOptions={formattedTopicData}
    />,
    interfaceDetails &&
    interfaceDetails.delivery_method == "genericHTTPDelivery" ? (
      <DeliveryGenericForm
        submitForm={finishInterface}
        sourceTopic={topicData.find(
          (el) => el.topicName == interfaceDetails.source_topic
        )}
        interfaceEnv={interfaceEnv}
        interfaceGenericOptions={interfaceEnv?.genericDeliveryConfig}
        goBack={() => setCurrentState(0)}
      />
    ) : (
      <DeliveryCustomForm
        submitForm={finishInterface}
        interfaceEnv={interfaceEnv}
        customServiceName={interfaceEnv?.custom_service_name}
        goBack={() => setCurrentState(0)}
      />
    ),
  ];

  const currentComponent = components[currentState];

  return (
    <>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="text-center">Data for interface couldnt be loaded. Try again.</div>
      ) : (
        currentComponent
      )}
    </>
  );
};

export default InterfaceForm;
