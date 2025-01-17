import { useNavigate, useParams } from "react-router-dom";
import BreadCrumbs from "../../layouts/Breadcrumbs";
import Button from "../../components/General/Button";
import Card from "../../components/General/Card";
import { useContext, useEffect, useMemo, useState } from "react";
import { Interface } from "../../types";
import {
  deleteInterface,
  getInterface,
  showLastMessage,
} from "../../services/apiService";
import { AlertContext } from "../../contextapi/AlertContext";
import Loading from "../../components/General/Loading";
import DataConfirm from "../../components/General/DataConfirm";
import { Search } from "../../assets/icons/Search";
import Modal from "../../components/General/Modal";
import { parseObject } from "../../services/schemeFormating";
import SchemeTree from "../../components/Topics/Scheme/SchemeTree";

const InterfaceDetail = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { addAlert } = useContext(AlertContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false)
  const [interfaces, setInterfaces] = useState<Interface[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<number>(0);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const [confirmProps, setConfirmProps] = useState({
    show: false,
    title: "",
    description: "",
    confirmAction: () => {},
    buttonColor: "red",
  });

  useEffect(() => {
    async function getInterfaces() {
      try {
        if (!name) throw Error;
        const response = await getInterface(name);
        setInterfaces(response);
      } catch (error) {
        setError(true)
        addAlert("There was a problem loading the interface", "error");
      } finally {
        setLoading(false);
      }
    }

    getInterfaces();
  }, []);

  const handleDeleteInterface = async (interfaceName: string) => {
    try {
      await deleteInterface(interfaceName);
      navigate("/interfaces");
      addAlert("Interface deleted successfully", "success");
    } catch (error) {
      addAlert("Failed to delete interface", "error");
    } finally {
      setConfirmProps((prevProps) => ({ ...prevProps, show: false }));
    }
  };

  const openLastMessage = async (
    interfaceName?: string,
    environment?: string
  ) => {
    try {
      const response = await showLastMessage(interfaceName, environment);
      setLastMessage(response.pipelineJSONString);
    } catch (e) {
      addAlert("Failed to load last message", "error");
    }
  };

  const currentInterface = interfaces[selectedEnvironment];

  const lastMessageTreeData = useMemo(() => {
    if (!lastMessage) return null
    return parseObject(JSON.parse(lastMessage ?? ""), "", 0, 1)
  }, [lastMessage])

  return (
    <>
      <Modal
        title={
          "Last message for " + currentInterface?.environment + " environment"
        }
        show={!!lastMessage}
        cancelAction={() => setLastMessage(null)}
      >
        <div>{!!lastMessageTreeData && <SchemeTree treeData={lastMessageTreeData} />}</div>
      </Modal>
      <BreadCrumbs
        path={[
          { name: "Home", link: "/" },
          { name: "Interfaces", link: "/interfaces" },
          { name: name || "", link: `/interfaces/${name}/detail` },
        ]}
        backLink="/interfaces"
      />

      <div>
        <h1 className="text-heading dark:text-white mb-10">{name}</h1>
      </div>
      {loading ? <Loading /> : error ? <div className="text-center">Data couldnt be loaded</div> : <>
      <h2 className="text-title dark:text-white mb-4">Interface Details</h2>
      <div className="flex justify-between mb-8 gap-4 items-center">
        <Button
          color="green"
          text="show last message"
          icon={Search}
          iconPosition="left"
          onClick={() => openLastMessage(name, currentInterface.environment)}
        />
        <div className="flex items-center gap-4">
          <Button
            color="blue"
            text="Edit"
            onClick={() => {
              navigate(`/interfaces/${name}/edit`);
            }}
          />
          <Button
            color="red"
            text="Delete"
            onClick={() => {
              setConfirmProps({
                show: true,
                title: `Do you really want to delete the interface ${name}?`,
                description: `This action will delete the interface on all environments.`,
                confirmAction: () => handleDeleteInterface(name ?? ""),
                buttonColor: "red",
              });
            }}
          />
        </div>
      </div>
          <div className="flex uppercase font-bold">
            {interfaces.map((interfaceDetail: Interface, index: number) => (
              <button
                key={index}
                className={`uppercase px-4 py-2 border-b-2 ${
                  selectedEnvironment === index
                    ? "border-purple text-purple"
                    : "text-secondaryText border-primary"
                }`}
                onClick={() => setSelectedEnvironment(index)}
              >
                {interfaceDetail.environment}
              </button>
            ))}
          </div>
          <Card>
            <h2 className="text-subtitle uppercase text-gray mb-6">General</h2>
            <div className="flex gap-24 mb-10">
              <div className="w-[300px]">
                <h3 className="">Message Filter</h3>
                <h3 className="">Delivery Method</h3>
                <h3 className="">Messaging Hub Forwarding</h3>
              </div>
              <div>
                <h3 className="font-semibold">
                  {currentInterface.message_filter !== "" ? (
                    currentInterface.message_filter
                  ) : (
                    <span>&nbsp;</span>
                  )}
                </h3>
                <h3 className="font-semibold">
                  {currentInterface.delivery_method}
                </h3>
                <h3 className="font-semibold">
                  {currentInterface.messaging_hub_forwarding !== "false" ? "Enabled" : "Disabled"}
                </h3>
              </div>
            </div>

            <h2 className="text-subtitle uppercase text-gray mb-6">
              Generic delivery config
            </h2>
            <div className="flex gap-24">
              <div className="w-[300px]">
                <h3 className="">Endpoint</h3>
                <h3 className="">Authentication</h3>
                <h3 className="">Format</h3>
                <h3 className="">Excluded fields</h3>
              </div>
              <div>
                <h3 className="font-semibold">
                  {
                    currentInterface?.genericDeliveryConfig?.[0]
                      .delivery_endpoint
                  }
                </h3>
                <h3 className="font-semibold">
                  {currentInterface?.genericDeliveryConfig?.[0].auth?.auth_type}
                </h3>
                <h3 className="font-semibold">
                  {currentInterface?.genericDeliveryConfig?.[0].delivery_format}
                </h3>
                <h3 className="font-semibold">
                  {currentInterface?.genericDeliveryConfig?.[0].exclude_fields}
                </h3>
              </div>
            </div>
          </Card>
          <DataConfirm
            show={confirmProps.show}
            title={confirmProps.title}
            description={confirmProps.description}
            confirmAction={confirmProps.confirmAction}
            cancelAction={() =>
              setConfirmProps((prevProps) => ({ ...prevProps, show: false }))
            }
            buttonColor={confirmProps.buttonColor}
          />
        </>}
    </>
  );
};

export default InterfaceDetail;
