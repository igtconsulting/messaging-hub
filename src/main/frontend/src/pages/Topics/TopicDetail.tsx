import { useParams, useNavigate, Link } from "react-router-dom";
import Button from "../../components/General/Button";
import BreadCrumbs from "../../layouts/Breadcrumbs";
import Card from "../../components/General/Card";
import Loading from "../../components/General/Loading";
import {
  Connection,
  Interface,
  TableRow,
  Topic,
  TopicDetails,
  TreeNode,
} from "../../types";
import {useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {
  deleteDurable,
  deleteInterface,
  deleteTopic,
  getConnection,
  getDurablesForTopic,
  getInterfaces,
  getTopic,
  getTopicDetail,
  publishTopicMessage,
} from "../../services/apiService";
import { AlertContext } from "../../contextapi/AlertContext";
import DataConfirm from "../../components/General/DataConfirm";
import Scheme from "../../components/Topics/Scheme/Scheme";
import Table from "../../components/General/Table";
import { EditPen } from "../../assets/icons/EditPen";
import { DeleteTrash } from "../../assets/icons/DeleteTrash";
import {
  formatDurablesDataForTable,
  formatInterfaceDataForTable,
  groupEnvironments,
} from "../../services/dataFormating";
import Modal from "../../components/General/Modal";
// import { formatSchemaForPublish } from "../../services/schemeFormating";

const TopicDetail = () => {
  const { name } = useParams<{ name: string }>();
  const { connection } = useParams<{ connection: string }>();
  const navigate = useNavigate();
  const [cpuData, setCPUData] = useState<TopicDetails | null>(null);
  const { addAlert } = useContext(AlertContext);
  const activeTabRef = useRef<"json" | "tree">("json");
  const rawJsonRef = useRef<string>("");
  // const [errorOccurred, setErrorOccurred] = useState(false);
  const [confirmProps, setConfirmProps] = useState({
    show: false,
    title: "",
    description: "",
    confirmAction: () => {},
    buttonColor: "red",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalProps, setModalProps] = useState({
    show: false,
    title: "",
    content: <>Some content</>,
    confirmAction: () => {},
    buttonColor: "green",
    isLoading: false,
  });
  const [topicDetails, setTopicDetails] = useState<(Topic & Connection) | null>(
    null
  );
  const [interfaceData, setInterfaceData] = useState<TableRow[]>([]);
  const [durablesData, setDurablesData] = useState<TableRow[]>([]);
  const [schemeDataToPublish, setSchemeDataToPublish] = useState<
    TreeNode[] | undefined
  >([]);
  
  // Individual loading states for lazy loading
  const [loadingStates, setLoadingStates] = useState({
    topicDetails: true,
    cpuData: true,
    durables: true,
    interfaces: true,
  });

  useEffect(() => {
    if (!name || !connection) {
      addAlert("Invalid parameters: 'name' or 'connection' missing.", "error");
      setLoadingStates({
        topicDetails: false,
        cpuData: false,
        durables: false,
        interfaces: false,
      });
      return;
    }

    // Function to load topic details (CPU data)
    async function loadTopicDetails(connectionName: string, topicName: string) {
      try {
        const response = await getTopicDetail(connectionName, topicName);
        setCPUData(JSON.parse(response));
      } catch (error) {
        addAlert("There was a problem loading CPU details", "error");
      } finally {
        setLoadingStates(prev => ({ ...prev, cpuData: false }));
      }
    }

    // Function to load topic schema and connection data
    async function loadTopicScheme(connectionName: string, topicName: string) {
      try {
        const connectionData = await getConnection(connection);
        const response = await getTopic(connectionName, topicName);
        const parsedSchema = JSON.parse(response.schema);

        setTopicDetails({ ...response, ...connectionData });
        setSchemeDataToPublish(parsedSchema);
      } catch (error) {
        addAlert("There was a problem loading topic schema", "error");
      } finally {
        setLoadingStates(prev => ({ ...prev, topicDetails: false }));
      }
    }

    // Function to load durables data if connection type is not Kafka
    async function loadDurablesData(connectionName: string, topicName: string) {
      try {
        const connectionData = await getConnection(connectionName);
        if (connectionData.connection_type.toLowerCase() === "kafka") {
          setLoadingStates(prev => ({ ...prev, durables: false }));
          return;
        }

        const data = await getDurablesForTopic(connectionName, topicName);
        setDurablesData(formatDurablesDataForTable(data));
      } catch (error) {
        addAlert(
          "Failed to load durables data. Please try again later.",
          "error"
        );
      } finally {
        setLoadingStates(prev => ({ ...prev, durables: false }));
      }
    }

    const getInterfaceData = async (topicName: string) => {
      try {
        const data: Interface[] = await getInterfaces();
        if (!data || data.length === 0) {
          setInterfaceData([]);
        } else {
          const groupedData = groupEnvironments(data);
          const formattedData = formatInterfaceDataForTable(groupedData);
          const filteredData = formattedData.filter(
            (row) => row.parameters[3] === topicName
          );
          setInterfaceData(filteredData);
        }
      } catch (error) {
        addAlert(
          "Failed to load interfaces data. Please try again later.",
          "error"
        );
      } finally {
        setLoadingStates(prev => ({ ...prev, interfaces: false }));
      }
    };

    // Load all data concurrently for better performance
    loadTopicDetails(connection, name);
    loadTopicScheme(connection, name);
    loadDurablesData(connection, name);
    getInterfaceData(name);
  }, [name, connection, addAlert]);

  const onPublish = useCallback(async () => {
    const collectChildValues = (parentId: number): Record<string, unknown> => {
        if (!schemeDataToPublish) return {};
        
        const parentNode = schemeDataToPublish.find((node) => node.id === parentId);
        if (!parentNode) return {};
  
        const childObject: Record<string, unknown> = {};
        const isKafkaConnection = topicDetails?.connection_type?.toLowerCase() === "kafka";
  
        // Get direct children in the order they appear in the parent's children array
        const children = parentNode?.children
          ?.map(childId => schemeDataToPublish.find(node => node.id === childId))
          .filter((node): node is TreeNode => node != null && !node.metadata.replicaOf) || [];
  
        for (const child of children) {
          const { name, metadata } = child;
  
          if (metadata.type === "string") {
            // Only include non-empty string values
            const value = metadata.value ?? "";
            if (value !== "") {
              childObject[name] = value;
            }
          } else if (metadata.type === "object") {
            // For objects, recursively collect child values
            const objectValue = collectChildValues(child.id);
            // Only include non-empty objects
            if (Object.keys(objectValue).length > 0) {
              // Special handling for Kafka "value" field - stringify it
              if (isKafkaConnection && name === "value") {
                childObject[name] = JSON.stringify(objectValue);
              } else {
                childObject[name] = objectValue;
              }
            }
          } else if (metadata.type === "array") {
            if (metadata.array === "string") {
              // For string arrays, use the value directly from metadata
              const arrayValue = Array.isArray(metadata.value) ? metadata.value.filter(item => item !== "") : [];
              // Only include non-empty arrays
              if (arrayValue.length > 0) {
                childObject[name] = arrayValue;
              }
            } else if (metadata.array && ["document", "object"].includes(metadata.array)) {
              // For document/object arrays, use the value from metadata
              const arrayValue = Array.isArray(metadata.value) ? metadata.value.filter(item =>
                item && typeof item === 'object' && Object.keys(item).length > 0
              ) : [];
              // Only include non-empty arrays
              if (arrayValue.length > 0) {
                childObject[name] = arrayValue;
              }
            }
          }
        }
  
        return childObject;
      };

    try {
      let formattedMessage: unknown;

      if (activeTabRef.current === "json") {
        // Check if raw JSON is empty or just whitespace
        if (!rawJsonRef.current || rawJsonRef.current.trim() === "") {
          addAlert("JSON must be provided before publishing.", "error");
          return;
        }
        
        formattedMessage = JSON.parse(rawJsonRef.current);
        
        // Check if JSON is empty object
        if (typeof formattedMessage === 'object' && formattedMessage !== null && Object.keys(formattedMessage).length === 0) {
          addAlert("JSON must be provided before publishing.", "error");
          return;
        }
      } else {
        // Start from root node (id: 1) and collect all values
        formattedMessage = collectChildValues(1);
        
        // Check if the collected data is empty
        if (typeof formattedMessage === 'object' && formattedMessage !== null && Object.keys(formattedMessage).length === 0) {
          addAlert("Scheme needs to be filled before publishing.", "error");
          return;
        }
      }

      await publishTopicMessage(connection, name, formattedMessage);
      addAlert("Topic message published successfully", "success");
      
      // Close modal on success
      setModalProps((prevProps) => ({
        ...prevProps,
        show: false,
      }));
    } catch (e: any) {
      console.error("Publish error:", e);
      
      // Check if it's a 400 validation error
      if (e.response?.status === 400 && e.response?.data?.errorMessage) {
        // Parse the error message: "/bottleDetails/mls - [ISC.0082.9030] Type mismatch, String expected;"
        const errorMessage = e.response.data.errorMessage;
        
        // Extract field path and error description
        const parts = errorMessage.split(' - ');
        const fieldPath = parts[0]; // "/bottleDetails/mls"
        
        let errorDescription = "is invalid";
        if (parts.length > 1) {
          // Remove ISC error codes like "[ISC.0082.9030]" and get the actual error
          const errorPart = parts.slice(1).join(' - ');
          const cleanError = errorPart.replace(/\[ISC\.[^\]]+\]\s*/, '').trim();
          
          if (cleanError) {
            // Convert technical errors to user-friendly messages
            if (cleanError.toLowerCase().includes('type mismatch')) {
              errorDescription = "has incorrect data type";
            } else if (cleanError.toLowerCase().includes('required') || cleanError.toLowerCase().includes('mandatory')) {
              errorDescription = "is mandatory";
            } else if (cleanError.toLowerCase().includes('format')) {
              errorDescription = "has invalid format";
            } else {
              // Use the clean error as-is but make it more readable
              errorDescription = cleanError.replace(/[;,]$/, '').toLowerCase();
            }
          }
        }
        
        // Show user-friendly message
        addAlert(`Bad request - ${fieldPath} ${errorDescription}`, "error");
        
        // DON'T close modal - user keeps their data
        return;
      }
      
      // Handle other errors
      addAlert("Failed to publish message", "error");
      
      // Close modal for other types of errors
      setModalProps((prevProps) => ({
        ...prevProps,
        show: false,
      }));
    }
  }, [schemeDataToPublish, name, connection, addAlert]);



  // const onPublish = useCallback(async () => {
  //   const collectChildValues = (parentId: number): any => {
  //     const parentNode = schemeDataToPublish.find((node) => node.id === parentId);
  //     if (!parentNode) return {};
  //
  //     const childObject: any = [];
  //
  //     const childIds = Array.isArray(parentNode.children) && parentNode.children.length > 0
  //         ? parentNode.children
  //         : parentNode.metadata?.childs?.map((child) => child.id) || [];
  //
  //     const children = schemeDataToPublish.filter((node) => childIds.includes(node.id));
  //
  //     for (const child of children) {
  //       const { name, metadata } = child;
  //
  //       if (metadata.type === "string") {
  //         childObject[name] = metadata.value ?? "";
  //       } else if (metadata.type === "object") {
  //         childObject[name] = collectChildValues(child.id);
  //       } else if (metadata.type === "array") {
  //         if (metadata.array === "string") {
  //           childObject[name] = Array.isArray(metadata.value) ? [...metadata.value] : [];
  //         } else if (["document", "object"].includes(metadata.array)) {
  //           const replicas = metadata.childs || [];
  //           childObject[name] = replicas.map((replica) => collectChildValues(replica.id));
  //         }
  //       }
  //     }
  //
  //     return childObject;
  //   };
  //
  //
  //
  //
  //
  //
  //   try {
  //     const formattedMessage = collectChildValues(1);
  //     await publishTopicMessage(connection, name, formattedMessage);
  //     addAlert("Topic message published successfully", "success");
  //   } catch (e) {
  //     addAlert("Failed to publish message", "error");
  //   } finally {
  //     setModalProps({
  //       show: false,
  //       title: "",
  //       content: <>Some content</>,
  //       confirmAction: () => {},
  //       buttonColor: "green",
  //     });
  //   }
  // }, [schemeDataToPublish, name, connection, addAlert]);

  useEffect(() => {
    setModalProps((previous) => {
      return { ...previous, confirmAction: onPublish };
    });
  }, [onPublish]);

  const schemeData = useMemo(() => {
    return topicDetails?.schema ? JSON.parse(topicDetails?.schema) : null;
  }, [topicDetails]);

  const handleDeleteTopic = async () => {
    setIsDeleting(true);
    try {
      if (!name || !connection) throw new Error("Invalid parameters");
      await deleteTopic(connection, name);
      addAlert("Topic deleted successfully", "success");
      navigate("/topics");
    } catch (error) {
      addAlert("Failed to delete topic", "error");
      setIsDeleting(false);
    }
  };

  const handleDeleteButtonClick = () => {
    setConfirmProps({
      show: true,
      title: "Are you sure?",
      description: `Do you really want to delete the topic ${name}?`,
      confirmAction: handleDeleteTopic,
      buttonColor: "red",
    });
  };

  const handleDeleteInterface = async (interfaceName: string) => {
    setIsDeleting(true);
    try {
      await deleteInterface(interfaceName);
      addAlert("Interface deleted successfully", "success");
      setConfirmProps((prevProps) => ({ ...prevProps, show: false }));
    } catch (error) {
      addAlert("Failed to delete interface", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteDurable = async (durable: string) => {
    setIsDeleting(true);
    try {
      await deleteDurable(connection, name, durable);
      addAlert("Durable deleted successfully", "success");
      setConfirmProps((prevProps) => ({ ...prevProps, show: false }));
    } catch (error) {
      addAlert("Failed to delete durable", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActionClick = (action: string, row: TableRow) => {
    switch (action) {
      case "Edit":
        navigate(`/interfaces/${row.parameters[0]}/edit`);
        break;
      case "Delete":
        setConfirmProps({
          show: true,
          title: `Do you really want to delete the interface ${row.parameters[0]}?`,
          description: `This action will delete the interface on all environments.`,
          confirmAction: () => handleDeleteInterface(row.parameters[0]),
          buttonColor: "red",
        });
        break;
      default:
        console.error("Unknown action for interfaces");
    }
  };

  const handleActionClickDurable = (action: string, row: TableRow) => {
    switch (action) {
      case "Delete":
        setConfirmProps({
          show: true,
          title: `Do you really want to delete the durable ${row.parameters[0]}?`,
          description: `This action will delete the interface on all environments.`,
          confirmAction: () => handleDeleteDurable(row.parameters[0]),
          buttonColor: "red",
        });
        break;
      default:
        console.error("Unknown action for interfaces");
    }
  };

  const handlePublishButtonClick = () => {
    const setModalTab = (tab: "json" | "tree") => {
      activeTabRef.current = tab;
    };
    const setRawJsonText = (text: string) => {
      rawJsonRef.current = text;
    };

    const ModalContent = () => {
      const [tab, setTab] = useState<"json" | "tree">("json");
      const [rawJson, setRawJson] = useState("");
      const [touched, setTouched] = useState(false);

      const defaultExample = JSON.stringify({ put: "jsonHere" }, null, 2);

      const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setTouched(true);
        setRawJson(value);
      };

      useEffect(() => {
        setModalTab(tab);
        setRawJsonText(touched ? rawJson : "");
      }, [tab, rawJson, touched]);

      return (
          <div className="flex flex-col h-[70vh]">
            <div className="flex mb-4 border-b">
              <button
                  className={`px-4 py-2 ${tab === "json" ? "font-bold border-b-2 border-green-600" : ""}`}
                  onClick={() => setTab("json")}
              >
                Raw JSON
              </button>
              <button
                  className={`px-4 py-2 ${tab === "tree" ? "font-bold border-b-2 border-green-600" : ""}`}
                  onClick={() => setTab("tree")}
              >
                Scheme Tree
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {tab === "json" ? (
                  <div className="relative h-full">
                    {!touched && rawJson === "" && (
                        <pre className="absolute inset-0 text-gray-400 pointer-events-none p-2 whitespace-pre-wrap font-mono">
                  {defaultExample}
                </pre>
                    )}
                    <textarea
                        className="w-full h-full border p-2 font-mono resize-none bg-transparent relative z-10"
                        value={rawJson}
                        onChange={handleChange}
                        onFocus={() => setTouched(true)}
                    />
                  </div>
              ) : schemeData ? (
                  <Scheme
                      topicName={name || ""}
                      editable={false}
                      data={schemeData}
                      publishable={true}
                      onChangePublish={setSchemeDataToPublish}
                  />
              ) : (
                  <div className="flex items-center justify-center h-full">
                    Failed to load scheme details. Please try again later.
                  </div>
              )}
            </div>
          </div>
      );
    };

    const confirmAction = async () => {
      // Set loading state
      setModalProps((prevProps) => ({
        ...prevProps,
        isLoading: true,
      }));

      try {
        let messageToSend: unknown;

        if (activeTabRef.current === "json") {
          // Check if raw JSON is empty or just whitespace
          if (!rawJsonRef.current || rawJsonRef.current.trim() === "") {
            addAlert("JSON must be provided before publishing.", "error");
            setModalProps((prevProps) => ({ ...prevProps, isLoading: false }));
            return;
          }
          
          messageToSend = JSON.parse(rawJsonRef.current);
          
          // Check if JSON is empty object
          if (typeof messageToSend === 'object' && messageToSend !== null && Object.keys(messageToSend).length === 0) {
            addAlert("JSON must be provided before publishing.", "error");
            setModalProps((prevProps) => ({ ...prevProps, isLoading: false }));
            return;
          }
        } else {
          const collectChildValues = (parentId: number): Record<string, unknown> => {
            if (!schemeDataToPublish) return {};
            
            const thisParentNode = schemeDataToPublish.find((node) => node.id === parentId);
            if (!thisParentNode) return {};

            const childObject: Record<string, unknown> = {};
            const isKafkaConnection = topicDetails?.connection_type?.toLowerCase() === "kafka";

            // Get direct children in the order they appear in the parent's children array
            const currentParentNode = schemeDataToPublish.find((node) => node.id === parentId);
            const children = currentParentNode?.children
              ?.map(childId => schemeDataToPublish.find(node => node.id === childId))
              .filter((node): node is TreeNode => node != null && !node.metadata.replicaOf) || [];

            for (const child of children) {
              const { name, metadata } = child;

              if (metadata.type === "string") {
                // Only include non-empty string values
                const value = metadata.value ?? "";
                if (value !== "") {
                  childObject[name] = value;
                }
              } else if (metadata.type === "object") {
                // For objects, recursively collect child values
                const objectValue = collectChildValues(child.id);
                // Only include non-empty objects
                if (Object.keys(objectValue).length > 0) {
                  // Special handling for Kafka "value" field - stringify it
                  if (isKafkaConnection && name === "value") {
                    childObject[name] = JSON.stringify(objectValue);
                  } else {
                    childObject[name] = objectValue;
                  }
                }
              } else if (metadata.type === "array") {
                if (metadata.array === "string") {
                  // For string arrays, use the value directly from metadata
                  const arrayValue = Array.isArray(metadata.value) ? metadata.value.filter((item: any) => item !== "") : [];
                  // Only include non-empty arrays
                  if (arrayValue.length > 0) {
                    childObject[name] = arrayValue;
                  }
                } else if (metadata.array && ["document", "object"].includes(metadata.array)) {
                  // For document/object arrays, use the value from metadata
                  const arrayValue = Array.isArray(metadata.value) ? metadata.value.filter((item: any) =>
                    item && typeof item === 'object' && Object.keys(item).length > 0
                  ) : [];
                  // Only include non-empty arrays
                  if (arrayValue.length > 0) {
                    childObject[name] = arrayValue;
                  }
                }
              }
            }

            return childObject;
          };

          messageToSend = collectChildValues(1);
          
          // Check if the collected data is empty
          if (typeof messageToSend === 'object' && messageToSend !== null && Object.keys(messageToSend).length === 0) {
            addAlert("Scheme needs to be filled before publishing.", "error");
            setModalProps((prevProps) => ({ ...prevProps, isLoading: false }));
            return;
          }
        }

        await publishTopicMessage(connection, name, messageToSend);
        addAlert("Topic message published successfully", "success");
        
        // Close modal on success
        setModalProps((prevProps) => ({
          ...prevProps,
          show: false,
          isLoading: false,
        }));
      } catch (e: any) {
        console.error("Publish error:", e);
        
        // Check if it's a 400 validation error
        if (e.response?.status === 400 && e.response?.data?.errorMessage) {
          // Parse the error message: "/bottleDetails/mls - [ISC.0082.9030] Type mismatch, String expected;"
          const errorMessage = e.response.data.errorMessage;
          
          // Extract field path and error description
          const parts = errorMessage.split(' - ');
          const fieldPath = parts[0]; // "/bottleDetails/mls"
          
          let errorDescription = "is invalid";
          if (parts.length > 1) {
            // Remove ISC error codes like "[ISC.0082.9030]" and get the actual error
            const errorPart = parts.slice(1).join(' - ');
            const cleanError = errorPart.replace(/\[ISC\.[^\]]+\]\s*/, '').trim();
            
            if (cleanError) {
              // Convert technical errors to user-friendly messages
              if (cleanError.toLowerCase().includes('type mismatch')) {
                errorDescription = "has incorrect data type";
              } else if (cleanError.toLowerCase().includes('required') || cleanError.toLowerCase().includes('mandatory')) {
                errorDescription = "is mandatory";
              } else if (cleanError.toLowerCase().includes('format')) {
                errorDescription = "has invalid format";
              } else {
                // Use the clean error as-is but make it more readable
                errorDescription = cleanError.replace(/[;,]$/, '').toLowerCase();
              }
            }
          }
          
          // Show user-friendly message
          addAlert(`Bad request - ${fieldPath} ${errorDescription}`, "error");
          
          // DON'T close modal - user keeps their data, but reset loading state
          setModalProps((prevProps) => ({
            ...prevProps,
            isLoading: false,
          }));
          return;
        }
        
        // Handle other errors
        addAlert("Failed to publish message", "error");
        
        // Close modal for other types of errors
        setModalProps((prevProps) => ({
          ...prevProps,
          show: false,
          isLoading: false,
        }));
      }
    };

    setModalProps({
      show: true,
      title: "Publish message to topic",
      content: <ModalContent />,
      confirmAction,
      buttonColor: "green",
      isLoading: false,
    });
  };






  // const handlePublishButtonClick = () => {
  //   setModalProps({
  //     show: true,
  //     title: "Publish message to topic",
  //     content:
  //       schemeData && schemeDataToPublish ? (
  //         <Scheme
  //           topicName={name || ""}
  //           editable={false}
  //           data={schemeData}
  //           publishable={true}
  //           onChangePublish={setSchemeDataToPublish}
  //         />
  //       ) : (
  //         <div className="flex items-center justify-center h-full">
  //           Failed to load scheme details. Please try again later.
  //         </div>
  //       ),
  //     confirmAction: onPublish,
  //     buttonColor: "green",
  //   });
  // };

  return (
    <div className="container mx-auto">
      <BreadCrumbs
        path={[
          { name: "Home", link: "/" },
          { name: "Topics", link: "/topics" },
          { name: name || "", link: `/topics/${connection}/${name}/detail` },
        ]}
        backLink="/topics"
      />

      <div>
        <h1 className="text-heading dark:text-white mb-10">{name}</h1>
      </div>
      
      <h2 className="text-title dark:text-white">Topic Details</h2>
      <div className="flex justify-between my-6">
        <Button
          color="green"
          text="+ Publish message to topic"
          onClick={handlePublishButtonClick}
          disabled={loadingStates.topicDetails}
        />
        <div className="flex gap-4">
          <Button
            color="blue"
            text="Edit"
            disabled={loadingStates.topicDetails}
            onClick={() => {
              navigate(`/topics/${connection}/${name}/edit`);
            }}
          />
          <Button
            color="red"
            text="Delete"
            disabled={loadingStates.topicDetails}
            onClick={handleDeleteButtonClick}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Card className="flex-1">
          {loadingStates.topicDetails ? (
            <div className="flex items-center justify-center h-48">
              <Loading />
            </div>
          ) : schemeData ? (
            <>
              <h2 className="text-subtitle uppercase text-gray mb-2">
                Schema
              </h2>
              <Scheme
                topicName={name || ""}
                editable={false}
                data={schemeData}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              Failed to load scheme details. Please try again later.
            </div>
          )}
        </Card>
        <Card className="flex-1">
          {loadingStates.cpuData ? (
            <div className="flex items-center justify-center h-48">
              <Loading />
            </div>
          ) : cpuData ? (
            <>
              <h2 className="text-subtitle uppercase text-gray">
                Messages
              </h2>
              <div className="flex w-full text-redactor">
                <p className="w-2/3 xl:w-2/5">
                  {cpuData.total_consumed !== undefined
                    ? "Consumed"
                    : "Partitions"}
                </p>
                <p>
                  {cpuData["total_consumed"] ??
                    cpuData.describeTopicPartitions ??
                    0}
                </p>
              </div>
              <div className="flex w-full text-redactor">
                <p className="w-2/3 xl:w-2/5">
                  {cpuData.total_published !== undefined
                    ? "Published"
                    : "Replications"}
                </p>
                <p>
                  {cpuData?.total_published ??
                    cpuData.describeTopicReplications ??
                    0}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              Failed to load CPU details. Please try again later.
            </div>
          )}
        </Card>
      </div>
      
      {/* Durables Section - Only show for non-Kafka connections */}
      {topicDetails?.connection_type?.toLowerCase() === "kafka" ? null : (
        <Card className="mb-10">
          <h2 className="text-subtitle uppercase text-gray">Durables</h2>
          {loadingStates.durables ? (
            <div className="flex items-center justify-center h-32">
              <Loading />
            </div>
          ) : (
            <Table
              columns={[
                "Durable name",
                "Type",
                "Selector",
                "Processing",
                "Retrieval",
                "Actions",
              ]}
              data={durablesData}
              actionButtonColors={["red"]}
              actionButtonIcons={[DeleteTrash]}
              redirectTo="durables"
              onActionClick={handleActionClickDurable}
            />
          )}
        </Card>
      )}
      
      {/* Interfaces Section */}
      <h2 className="text-title dark:text-white mb-6">Interfaces</h2>
      <Link to={"/interfaces/new"} className="inline-block">
        <Button color="green" text="+ Add New Interface" />
      </Link>
      <div className="mt-6">
        {loadingStates.interfaces ? (
          <div className="flex items-center justify-center h-32">
            <Loading />
          </div>
        ) : (
          <Table
            connectionTypes={["All", "UM", "KAFKA"]}
            columns={[
              "Interface name",
              "Type",
              "Environments",
              "Topic source",
              "Actions",
            ]}
            data={interfaceData}
            actionButtonColors={["blue", "red"]}
            actionButtonIcons={[EditPen, DeleteTrash]}
            redirectTo="interfaces"
            onActionClick={handleActionClick}
          />
        )}
      </div>

      <DataConfirm
        show={confirmProps.show}
        title={confirmProps.title}
        description={confirmProps.description}
        confirmAction={confirmProps.confirmAction}
        cancelAction={() =>
          setConfirmProps((prevProps) => ({ ...prevProps, show: false }))
        }
        buttonColor={confirmProps.buttonColor}
        isLoading={isDeleting}
      />

      <Modal
        show={modalProps.show}
        title={modalProps.title}
        content={modalProps.content}
        buttonColor={modalProps.buttonColor}
        confirmAction={modalProps.confirmAction}
        cancelAction={() =>
          setModalProps((prevProps) => ({ ...prevProps, show: false }))
        }
        isLoading={modalProps.isLoading}
      />
    </div>
  );
};

export default TopicDetail;
