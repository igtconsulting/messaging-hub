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
import { convertToArrayStructure } from "../../services/schemeFormating";
// import { formatSchemaForPublish } from "../../services/schemeFormating";

const TopicDetail = () => {
  const { name } = useParams<{ name: string }>();
  const { connection } = useParams<{ connection: string }>();
  const navigate = useNavigate();
  const [cpuData, setCPUData] = useState<TopicDetails | null>(null);
  const { addAlert } = useContext(AlertContext);
  const activeTabRef = useRef<"json" | "tree">("json");
  const rawJsonRef = useRef<string>("");
  const [showAdvancedMode, setShowAdvancedMode] = useState(false);
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
  const [schemeDataToPublish, setSchemeDataToPublish] = useState<TreeNode[]>([]);
  const schemeDataRef = useRef<TreeNode[]>([]);
  
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
        // Note: schemeDataToPublish will be populated by handleTreeDataChange when Scheme component initializes
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
            // Only include non-empty string values with robust filtering
            const value = metadata.value ?? "";
            const stringValue = typeof value === 'string' ? value : String(value);
            if (stringValue.trim() !== "") {
              childObject[name] = stringValue;
            }
          } else if (metadata.type === "object") {
            // For objects, recursively collect child values
            const objectValue = collectChildValues(child.id);
            // Only include objects with meaningful content (non-empty and not just empty strings)
            if (Object.keys(objectValue).length > 0) {
              // Check if the object contains only empty values
              const hasNonEmptyValues = Object.values(objectValue).some(val => {
                if (typeof val === 'string') {
                  return val.trim() !== "";
                } else if (Array.isArray(val)) {
                  return val.length > 0;
                } else if (typeof val === 'object' && val !== null) {
                  return Object.keys(val).length > 0;
                }
                return val != null;
              });
              
              if (hasNonEmptyValues) {
                // Special handling for Kafka "value" field - stringify it
                if (isKafkaConnection && name === "value") {
                  childObject[name] = JSON.stringify(objectValue);
                } else {
                  childObject[name] = objectValue;
                }
              }
            }
          } else if (metadata.type === "array") {
            if (metadata.array === "string") {
              // For string arrays, only process if there's actual content
              if (Array.isArray(metadata.value) && metadata.value.length > 0) {
                const arrayValue = metadata.value.filter(item => {
                  if (typeof item === 'string') {
                    return item && item.trim() !== "";
                  }
                  return item != null && String(item).trim() !== "";
                });
                // Only include non-empty arrays with meaningful content
                if (arrayValue.length > 0) {
                  childObject[name] = arrayValue;
                }
              }
            } else if (metadata.array && ["document", "object"].includes(metadata.array)) {
              // For document/object arrays, collect values from actual replica structures in the tree
              const replicaNodes = schemeDataToPublish.filter(node => node.metadata.replicaOf === child.id && node.metadata.type === "object");
              
              if (replicaNodes.length > 0) {
                const arrayValue = replicaNodes.map(replicaNode => {
                  // Collect values from replica's children
                  const replicaObject: Record<string, unknown> = {};
                  const replicaChildren = replicaNode.children
                    ?.map(childId => schemeDataToPublish.find(node => node.id === childId))
                    .filter((node): node is TreeNode => node != null) || [];
                  
                  // Get all children that belong to nested objects to skip them in main processing
                  const nestedObjectChildren = new Set<number>();
                  replicaChildren.forEach(child => {
                    if (child.metadata.type === "object" && child.children) {
                      child.children.forEach(nestedChildId => nestedObjectChildren.add(nestedChildId));
                    }
                  });
                  
                  replicaChildren.forEach(replicaChild => {
                    // Skip children that belong to nested objects - they'll be processed within their parent object context
                    if (nestedObjectChildren.has(replicaChild.id)) {
                      return;
                    }
                    
                    const { name: fieldName, metadata: replicaMetadata } = replicaChild;
                    
                    if (replicaMetadata.type === "string") {
                      const value = replicaMetadata.value ?? "";
                      const stringValue = typeof value === 'string' ? value : String(value);
                      if (stringValue.trim() !== "") {
                        replicaObject[fieldName] = stringValue;
                      }
                    } else if (replicaMetadata.type === "array" && replicaMetadata.array === "string") {
                      if (Array.isArray(replicaMetadata.value) && replicaMetadata.value.length > 0) {
                        const arrayValue = replicaMetadata.value.filter(v => {
                          if (typeof v === 'string') return v.trim() !== "";
                          return v != null && String(v).trim() !== "";
                        });
                        if (arrayValue.length > 0) {
                          replicaObject[fieldName] = arrayValue;
                        }
                      }
                    } else if (replicaMetadata.type === "object") {
                      // For nested objects within replicas, collect from their children
                      const nestedObjectValue: Record<string, unknown> = {};
                      const nestedChildren = replicaChild.children
                        ?.map(childId => schemeDataToPublish.find(node => node.id === childId))
                        .filter((node): node is TreeNode => node != null) || [];
                      
                      nestedChildren.forEach(nestedChild => {
                        const { name: nestedFieldName, metadata: nestedMetadata } = nestedChild;
                        
                        if (nestedMetadata.type === "string") {
                          const value = nestedMetadata.value ?? "";
                          const stringValue = typeof value === 'string' ? value : String(value);
                          if (stringValue.trim() !== "") {
                            nestedObjectValue[nestedFieldName] = stringValue;
                          }
                        } else if (nestedMetadata.type === "array" && nestedMetadata.array === "string") {
                          if (Array.isArray(nestedMetadata.value) && nestedMetadata.value.length > 0) {
                            const arrayValue = nestedMetadata.value.filter(v => {
                              if (typeof v === 'string') return v.trim() !== "";
                              return v != null && String(v).trim() !== "";
                            });
                            if (arrayValue.length > 0) {
                              nestedObjectValue[nestedFieldName] = arrayValue;
                            }
                          }
                        }
                        // Handle further nesting if needed
                      });
                      
                      if (Object.keys(nestedObjectValue).length > 0) {
                        replicaObject[fieldName] = nestedObjectValue;
                      }
                    }
                  });
                  
                  return replicaObject;
                }).filter(item => Object.keys(item).length > 0); // Remove empty objects
                
                // Only include non-empty arrays with meaningful content
                if (arrayValue.length > 0) {
                  childObject[name] = arrayValue;
                }
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
      resetModalState();
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

  // Function to reset modal to default state
  const resetModalState = useCallback(() => {
    // Reset scheme data to original schema without any filled values
    if (schemeData && name) {
      const originalSchemaArray = convertToArrayStructure(schemeData, name);
      setSchemeDataToPublish(originalSchemaArray);
      schemeDataRef.current = originalSchemaArray;
    } else {
      setSchemeDataToPublish([]);
      schemeDataRef.current = [];
    }
    
    // Reset tab and JSON refs
    activeTabRef.current = "tree";
    rawJsonRef.current = "";
  }, [schemeData, name]);

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

  // Generate JSON from tree data
  const generateJsonFromTree = useCallback((treeData?: TreeNode[]) => {
    const dataToUse = treeData || schemeDataToPublish || schemeDataRef.current;
    if (!dataToUse || dataToUse.length === 0) {
      return "{}";
    }
    
    const collectChildValues = (parentId: number): Record<string, unknown> => {
      const parentNode = dataToUse.find((node) => node.id === parentId);
      if (!parentNode) {
        return {};
      }

      const childObject: Record<string, unknown> = {};
      const isKafkaConnection = topicDetails?.connection_type?.toLowerCase() === "kafka";

      // Get direct children in the order they appear in the parent's children array
      const children = parentNode?.children
        ?.map(childId => dataToUse.find(node => node.id === childId))
        .filter((node): node is TreeNode => node != null && !node.metadata.replicaOf) || [];

      for (const child of children) {
        const { name, metadata } = child;

        if (metadata.type === "string") {
          // Only include non-empty string values for cleaner JSON with robust filtering
          const value = metadata.value ?? "";
          const stringValue = typeof value === 'string' ? value : String(value);
          if (stringValue.trim() !== "") {
            childObject[name] = stringValue;
          }
        } else if (metadata.type === "object") {
          // For objects, recursively collect child values
          const objectValue = collectChildValues(child.id);
          // Only include objects with meaningful content (non-empty and not just empty strings)
          if (Object.keys(objectValue).length > 0) {
            // Check if the object contains only empty values
            const hasNonEmptyValues = Object.values(objectValue).some(val => {
              if (typeof val === 'string') {
                return val.trim() !== "";
              } else if (Array.isArray(val)) {
                return val.length > 0;
              } else if (typeof val === 'object' && val !== null) {
                return Object.keys(val).length > 0;
              }
              return val != null;
            });
            
            if (hasNonEmptyValues) {
              if (isKafkaConnection && name === "value") {
                childObject[name] = JSON.stringify(objectValue);
              } else {
                childObject[name] = objectValue;
              }
            }
          }
        } else if (metadata.type === "array") {
          if (metadata.array === "string") {
            // For string arrays, only process if there's actual content
            if (Array.isArray(metadata.value) && metadata.value.length > 0) {
              const arrayValue = metadata.value.filter(v => {
                if (typeof v === 'string') {
                  return v && v.trim() !== "";
                }
                return v != null && String(v).trim() !== "";
              });
              // Only include non-empty arrays with meaningful content
              if (arrayValue.length > 0) {
                childObject[name] = arrayValue;
              }
            }
          } else if (metadata.array && ["document", "object"].includes(metadata.array)) {
            // For document/object arrays, collect values from actual replica structures in the tree
            const replicaNodes = dataToUse.filter(node => node.metadata.replicaOf === child.id && node.metadata.type === "object");
            
            if (replicaNodes.length > 0) {
              
              const arrayValue = replicaNodes.map(replicaNode => {
                // Collect values from replica's children
                const replicaObject: Record<string, unknown> = {};
                const replicaChildren = replicaNode.children
                  ?.map(childId => dataToUse.find(node => node.id === childId))
                  .filter((node): node is TreeNode => node != null) || [];
                
                // Get all children that belong to nested objects to skip them in main processing
                const nestedObjectChildren = new Set<number>();
                replicaChildren.forEach(child => {
                  if (child.metadata.type === "object" && child.children) {
                    child.children.forEach(nestedChildId => nestedObjectChildren.add(nestedChildId));
                  }
                });
                
                replicaChildren.forEach(replicaChild => {
                  // Skip children that belong to nested objects - they'll be processed within their parent object context
                  if (nestedObjectChildren.has(replicaChild.id)) {
                    return;
                  }
                  
                  const { name: fieldName, metadata: replicaMetadata } = replicaChild;
                  
                  if (replicaMetadata.type === "string") {
                    const value = replicaMetadata.value ?? "";
                    const stringValue = typeof value === 'string' ? value : String(value);
                    if (stringValue.trim() !== "") {
                      replicaObject[fieldName] = stringValue;
                    }
                  } else if (replicaMetadata.type === "array" && replicaMetadata.array === "string") {
                    if (Array.isArray(replicaMetadata.value) && replicaMetadata.value.length > 0) {
                      const arrayValue = replicaMetadata.value.filter(v => {
                        if (typeof v === 'string') return v.trim() !== "";
                        return v != null && String(v).trim() !== "";
                      });
                      if (arrayValue.length > 0) {
                        replicaObject[fieldName] = arrayValue;
                      }
                    }
                  } else if (replicaMetadata.type === "object") {
                    // For nested objects within replicas, collect from their children
                    const nestedObjectValue: Record<string, unknown> = {};
                    const nestedChildren = replicaChild.children
                      ?.map(childId => dataToUse.find(node => node.id === childId))
                      .filter((node): node is TreeNode => node != null) || [];
                    
                    nestedChildren.forEach(nestedChild => {
                      const { name: nestedFieldName, metadata: nestedMetadata } = nestedChild;
                      
                      if (nestedMetadata.type === "string") {
                        const value = nestedMetadata.value ?? "";
                        const stringValue = typeof value === 'string' ? value : String(value);
                        if (stringValue.trim() !== "") {
                          nestedObjectValue[nestedFieldName] = stringValue;
                        }
                      } else if (nestedMetadata.type === "array" && nestedMetadata.array === "string") {
                        if (Array.isArray(nestedMetadata.value) && nestedMetadata.value.length > 0) {
                          const arrayValue = nestedMetadata.value.filter(v => {
                            if (typeof v === 'string') return v.trim() !== "";
                            return v != null && String(v).trim() !== "";
                          });
                          if (arrayValue.length > 0) {
                            nestedObjectValue[nestedFieldName] = arrayValue;
                          }
                        }
                      }
                      // Handle further nesting if needed
                    });
                    
                    if (Object.keys(nestedObjectValue).length > 0) {
                      replicaObject[fieldName] = nestedObjectValue;
                    }
                  }
                });
                
                return replicaObject;
              }).filter(item => Object.keys(item).length > 0); // Remove empty objects
              
              // Only include non-empty arrays with meaningful content
              if (arrayValue.length > 0) {
                childObject[name] = arrayValue;
              }
            }
          }
        }
      }

      return childObject;
    };

    try {
      const result = collectChildValues(1);
      const jsonString = JSON.stringify(result, null, 2);
      return jsonString;
    } catch (error) {
      console.error('Failed to generate JSON from tree:', error);
      return "{}";
    }
  }, [schemeDataToPublish, topicDetails]);

  // Parse JSON and populate tree data
  const parseJsonToTree = useCallback((jsonString: string, forceSchemeRerender?: () => void) => {
    // Use existing tree data that we have preserved
    const treeDataToUse = schemeDataToPublish.length > 0 ? schemeDataToPublish : schemeDataRef.current;
    
    if (!jsonString.trim() || !treeDataToUse || treeDataToUse.length === 0) {
      return;
    }
    
    try {
      const parsedJson = JSON.parse(jsonString);
      
      // Create a deep copy of the current tree data to work with
      const newTreeData = JSON.parse(JSON.stringify(treeDataToUse));
      
      // Clear existing replicas and array items before populating to prevent duplicates
      const clearExistingReplicas = () => {
        const nodesToRemove: number[] = [];
        newTreeData.forEach((node: TreeNode) => {
          if (node.metadata.replicaOf || node.metadata.originalKey !== undefined) {
            nodesToRemove.push(node.id);
          }
        });
        
        // Remove replica nodes and clean up parent references
        nodesToRemove.forEach(nodeId => {
          const nodeIndex = newTreeData.findIndex((n: TreeNode) => n.id === nodeId);
          if (nodeIndex !== -1) {
            const node = newTreeData[nodeIndex];
            // Remove from parent's children array
            const parent = newTreeData.find((n: TreeNode) => n.id === node.parent);
            if (parent) {
              parent.children = parent.children.filter((childId: number) => childId !== nodeId);
            }
            // Remove the node itself
            newTreeData.splice(nodeIndex, 1);
          }
        });
        
        // Reset array metadata values
        newTreeData.forEach((node: TreeNode) => {
          if (node.metadata.type === "array") {
            node.metadata.value = [];
          }
        });
      };
      
      clearExistingReplicas();
      
      // Function to populate tree nodes with JSON values
      const populateTreeFromJson = (data: any, nodeId: number = 1) => {
        const node = newTreeData.find((n: TreeNode) => n.id === nodeId);
        if (!node) {
          return;
        }

        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
          // Handle object data
          Object.entries(data).forEach(([key, value]) => {
            const childNode = newTreeData.find((n: TreeNode) =>
              n.parent === nodeId && n.name === key && !n.metadata.replicaOf
            );
            
            if (childNode) {
              if (childNode.metadata.type === "string") {
                // Handle string fields
                childNode.metadata.value = String(value);
                
              } else if (childNode.metadata.type === "object") {
                // Handle object fields - recurse into nested object
                populateTreeFromJson(value, childNode.id);
                
              } else if (childNode.metadata.type === "array") {
                // Handle array fields based on the array type
                if (Array.isArray(value)) {
                  if (childNode.metadata.array === "string") {
                    // String array - create individual string nodes for each item
                    const stringValues = value.map(v => String(v)).filter(v => v.trim() !== "");
                    childNode.metadata.value = stringValues;
                    
                    // Create individual string nodes for the UI
                    stringValues.forEach((stringValue, index) => {
                      const stringNodeId = Date.now() + Math.random() + index;
                      const stringNode: TreeNode = {
                        id: stringNodeId,
                        parent: childNode.id,
                        name: `${childNode.name}[${index}]: "${stringValue}"`,
                        children: [],
                        metadata: {
                          type: "string",
                          value: stringValue,
                          originalKey: String(index)
                        }
                      };
                      newTreeData.push(stringNode);
                      childNode.children.push(stringNodeId);
                    });
                    
                  } else if (childNode.metadata.array === "document" || childNode.metadata.array === "object") {
                    // Document/object array - create replica structures for each array item
                    const filteredObjects = value.filter(v => v && typeof v === 'object');
                    childNode.metadata.value = filteredObjects;
                    
                    // Get the template structure (direct children of the array node that are not replicas)
                    const templateNodes = newTreeData.filter((n: TreeNode) => n.parent === childNode.id && !n.metadata.replicaOf);
                    
                    // Create replica structures for each object in the array
                    filteredObjects.forEach((objValue, index) => {
                      
                      // Create the replica document node
                      const replicaDocId = Date.now() + Math.random() + index * 1000;
                      const replicaDocNode: TreeNode = {
                        id: replicaDocId,
                        parent: childNode.id,
                        name: `${childNode.name}[${index}]`,
                        children: [],
                        metadata: {
                          type: "object",
                          value: objValue,
                          replicaOf: childNode.id
                        }
                      };
                      newTreeData.push(replicaDocNode);
                      childNode.children.push(replicaDocId);
                      
                      // Create replica child nodes for each field in the template
                      templateNodes.forEach((templateNode: TreeNode) => {
                        const fieldValue = objValue[templateNode.name];
                        const replicaFieldId = Date.now() + Math.random() + index * 1000 + Math.random();
                        const replicaFieldNode: TreeNode = {
                          id: replicaFieldId,
                          parent: replicaDocId,
                          name: templateNode.name,
                          children: [],
                          metadata: {
                            type: templateNode.metadata.type,
                            value: fieldValue !== undefined ? fieldValue : (templateNode.metadata.type === "array" ? [] : ""),
                            // Don't set replicaOf for field nodes within replica - they are children of the replica document
                            required: templateNode.metadata.required,
                            ...(templateNode.metadata.array && { array: templateNode.metadata.array })
                          }
                        };
                        newTreeData.push(replicaFieldNode);
                        replicaDocNode.children.push(replicaFieldId);
                        
                        // Handle nested structures for ALL template fields (so users can fill them in visual builder)
                        if (templateNode.metadata.type === "object") {
                          // Find template children of this object node
                          const objectTemplateChildren = newTreeData.filter((n: TreeNode) =>
                            n.parent === templateNode.id && !n.metadata.replicaOf
                          );
                          
                          // Create replica children for ALL template children (not just those with values)
                          objectTemplateChildren.forEach((objectTemplateChild: TreeNode) => {
                            const nestedValue = fieldValue && typeof fieldValue === 'object' ? fieldValue[objectTemplateChild.name] : undefined;
                            const nestedReplicaId = Date.now() + Math.random() + Math.random();
                            const nestedReplicaNode: TreeNode = {
                              id: nestedReplicaId,
                              parent: replicaFieldId,
                              name: objectTemplateChild.name,
                              children: [],
                              metadata: {
                                type: objectTemplateChild.metadata.type,
                                value: nestedValue !== undefined ? nestedValue : (objectTemplateChild.metadata.type === "array" ? [] : ""),
                                // Don't set replicaOf for nested children - they belong to their parent object, not the array
                                required: objectTemplateChild.metadata.required,
                                ...(objectTemplateChild.metadata.array && { array: objectTemplateChild.metadata.array })
                              }
                            };
                            newTreeData.push(nestedReplicaNode);
                            replicaFieldNode.children.push(nestedReplicaId);
                            
                            // Handle further nesting only if there are actual values
                            if (nestedValue !== undefined && objectTemplateChild.metadata.type === "object" && typeof nestedValue === 'object' && nestedValue !== null) {
                              populateTreeFromJson(nestedValue, nestedReplicaId);
                            }
                          });
                        } else if (templateNode.metadata.type === "array" && fieldValue !== undefined && Array.isArray(fieldValue)) {
                          // Handle nested arrays within replica structures (only if there are values)
                          if (templateNode.metadata.array === "string") {
                            const stringValues = fieldValue.map(v => String(v)).filter(v => v.trim() !== "");
                            replicaFieldNode.metadata.value = stringValues;
                            // Create string array items
                            stringValues.forEach((stringValue, strIndex) => {
                              const stringNodeId = Date.now() + Math.random() + strIndex + Math.random();
                              const stringNode: TreeNode = {
                                id: stringNodeId,
                                parent: replicaFieldId,
                                name: `${templateNode.name}[${strIndex}]: "${stringValue}"`,
                                children: [],
                                metadata: {
                                  type: "string",
                                  value: stringValue,
                                  originalKey: String(strIndex)
                                  // Don't set replicaOf for string array items within nested objects
                                }
                              };
                              newTreeData.push(stringNode);
                              replicaFieldNode.children.push(stringNodeId);
                            });
                          }
                        }
                      });
                    });
                    
                    // Template fields should remain empty for new entries
                    
                  } else {
                    // Fallback for other array types
                    childNode.metadata.value = value;
                  }
                } else {
                  // Expected array but got different type
                }
              }
            }
          });
        }
      };

      populateTreeFromJson(parsedJson);
      
      // Update both state and ref immediately
      setSchemeDataToPublish(newTreeData);
      schemeDataRef.current = newTreeData;
      
      // Force Scheme component to re-render with new data after state update
      if (forceSchemeRerender) {
        // Use setTimeout to ensure state is updated before re-render
        setTimeout(() => {
          forceSchemeRerender();
        }, 0);
      }
    } catch (error) {
      console.warn('Failed to parse JSON to tree:', error);
      addAlert("Invalid JSON format", "error");
    }
  }, [schemeDataToPublish, addAlert]);

  const handlePublishButtonClick = () => {
    const setModalTab = (tab: "json" | "tree") => {
      activeTabRef.current = tab;
    };
    const setRawJsonText = (text: string) => {
      rawJsonRef.current = text;
    };

    const ModalContent = () => {
      const [tab, setTab] = useState<"json" | "tree">("tree");
      const [rawJson, setRawJson] = useState("");
      const [touched, setTouched] = useState(false);
      const [schemeKey, setSchemeKey] = useState(0); // Force Scheme component re-render
      const [isParsingJson, setIsParsingJson] = useState(false); // Flag to prevent callback during parsing

      const defaultExample = JSON.stringify({ put: "jsonHere" }, null, 2);

      const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setTouched(true);
        setRawJson(value);
      };

      const handleTreeDataChange = (newTreeData?: TreeNode[]) => {
        // Skip updates during JSON parsing to prevent overwriting parsed data
        if (isParsingJson) {
          return;
        }
        
        // Prevent data corruption by rejecting smaller tree structures when we have parsed data
        if (newTreeData && schemeDataRef.current.length > 1 && newTreeData.length === 1) {
          return;
        }
        
        if (newTreeData) {
          setSchemeDataToPublish(newTreeData);
          schemeDataRef.current = newTreeData; // Keep ref in sync
        }
      };

      const handleTabChange = (newTab: "json" | "tree") => {
        const currentTreeData = schemeDataToPublish?.length > 0 ? schemeDataToPublish : schemeDataRef.current;
        
        if (newTab === "json" && tab === "tree") {
          // Switching from tree to JSON - generate JSON from current tree state
          if (currentTreeData && currentTreeData.length > 0) {
            const generatedJson = generateJsonFromTree(currentTreeData);
            if (generatedJson && generatedJson.trim() !== "" && generatedJson !== "{}") {
              setRawJson(generatedJson);
              setTouched(true);
            } else {
              // If no meaningful data in tree, show empty so placeholder is visible
              setRawJson("");
              setTouched(false);
            }
          } else {
            setRawJson("");
            setTouched(false);
          }
        } else if (newTab === "tree" && tab === "json") {
          // Switching from JSON to tree - parse JSON and populate tree
          if (rawJson.trim()) {
            setIsParsingJson(true); // Set flag to prevent callback interference
            
            parseJsonToTree(rawJson, () => {
              setSchemeKey(prev => prev + 1);
              // Reset flag after component stabilizes but maintain the parsed data
              setTimeout(() => {
                // Always keep the flag active longer to prevent final callback corruption
                setTimeout(() => setIsParsingJson(false), 500);
              }, 100);
            });
          } else {
            // JSON is empty - clear the tree data back to original schema without values
            setIsParsingJson(true);
            
            // Parse empty JSON to clear all values
            parseJsonToTree('{}', () => {
              setSchemeKey(prev => prev + 1);
              setTimeout(() => {
                setTimeout(() => setIsParsingJson(false), 500);
              }, 100);
            });
          }
        }
        setTab(newTab);
      };

      useEffect(() => {
        setModalTab(tab);
        setRawJsonText(touched ? rawJson : "");
      }, [tab, rawJson, touched]);

      return (
          <div className="flex flex-col h-[70vh]">
            {/* Toggle buttons similar to FilterBuilder */}
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                color={tab === "tree" ? "blue" : "gray"}
                text="Visual Builder"
                onClick={() => handleTabChange("tree")}
              />
              <Button
                type="button"
                color={tab === "json" ? "blue" : "gray"}
                text="Raw JSON"
                onClick={() => handleTabChange("json")}
              />
            </div>

            <div className="flex-1 overflow-auto">
              {tab === "json" ? (
                  <div className="relative h-full">
                    <textarea
                        className="w-full h-full border p-2 font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={rawJson}
                        onChange={handleChange}
                        onFocus={() => setTouched(true)}
                        placeholder={defaultExample}
                    />
                    <div className="text-xs text-gray-600 mt-2">
                      <strong>Tip:</strong> Edit JSON directly or switch to Visual Builder to use the schema editor.
                    </div>
                  </div>
              ) : schemeData ? (
                  <div>
                    <Scheme
                        key={schemeKey} // Force re-render when JSON is parsed
                        topicName={name || ""}
                        editable={false}
                        data={schemeData}
                        publishable={true}
                        onChangePublish={handleTreeDataChange}
                        publishDataArray={(() => {
                          // Use schemeDataToPublish if available, otherwise use schemeDataRef
                          const dataToUse = schemeDataToPublish.length > 0 ? schemeDataToPublish : schemeDataRef.current;
                          return dataToUse.length > 0 ? dataToUse : undefined;
                        })()}
                    />
                    <div className="text-xs text-gray-600 mt-2">
                      <strong>Tip:</strong> Fill in the schema fields or switch to Raw JSON to edit directly.
                    </div>
                  </div>
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
                // Only include non-empty string values with robust filtering
                const value = metadata.value ?? "";
                const stringValue = typeof value === 'string' ? value : String(value);
                if (stringValue.trim() !== "") {
                  childObject[name] = stringValue;
                }
              } else if (metadata.type === "object") {
                // For objects, recursively collect child values
                const objectValue = collectChildValues(child.id);
                // Only include objects with meaningful content (non-empty and not just empty strings)
                if (Object.keys(objectValue).length > 0) {
                  // Check if the object contains only empty values
                  const hasNonEmptyValues = Object.values(objectValue).some(val => {
                    if (typeof val === 'string') {
                      return val.trim() !== "";
                    } else if (Array.isArray(val)) {
                      return val.length > 0;
                    } else if (typeof val === 'object' && val !== null) {
                      return Object.keys(val).length > 0;
                    }
                    return val != null;
                  });
                  
                  if (hasNonEmptyValues) {
                    // Special handling for Kafka "value" field - stringify it
                    if (isKafkaConnection && name === "value") {
                      childObject[name] = JSON.stringify(objectValue);
                    } else {
                      childObject[name] = objectValue;
                    }
                  }
                }
              } else if (metadata.type === "array") {
                if (metadata.array === "string") {
                  // For string arrays, only process if there's actual content
                  if (Array.isArray(metadata.value) && metadata.value.length > 0) {
                    const arrayValue = metadata.value.filter((item: any) => {
                      if (typeof item === 'string') {
                        return item && item.trim() !== "";
                      }
                      return item != null && String(item).trim() !== "";
                    });
                    // Only include non-empty arrays with meaningful content
                    if (arrayValue.length > 0) {
                      childObject[name] = arrayValue;
                    }
                  }
                } else if (metadata.array && ["document", "object"].includes(metadata.array)) {
                  // For document/object arrays, collect values from actual replica structures in the tree
                  const replicaNodes = schemeDataToPublish.filter(node => node.metadata.replicaOf === child.id && node.metadata.type === "object");
                  
                  if (replicaNodes.length > 0) {
                    const arrayValue = replicaNodes.map(replicaNode => {
                      // Collect values from replica's children
                      const replicaObject: Record<string, unknown> = {};
                      const replicaChildren = replicaNode.children
                        ?.map(childId => schemeDataToPublish.find(node => node.id === childId))
                        .filter((node): node is TreeNode => node != null) || [];
                      
                      // Get all children that belong to nested objects to skip them in main processing
                      const nestedObjectChildren = new Set<number>();
                      replicaChildren.forEach(child => {
                        if (child.metadata.type === "object" && child.children) {
                          child.children.forEach(nestedChildId => nestedObjectChildren.add(nestedChildId));
                        }
                      });
                      
                      replicaChildren.forEach(replicaChild => {
                        // Skip children that belong to nested objects - they'll be processed within their parent object context
                        if (nestedObjectChildren.has(replicaChild.id)) {
                          return;
                        }
                        
                        const { name: fieldName, metadata: replicaMetadata } = replicaChild;
                        
                        if (replicaMetadata.type === "string") {
                          const value = replicaMetadata.value ?? "";
                          const stringValue = typeof value === 'string' ? value : String(value);
                          if (stringValue.trim() !== "") {
                            replicaObject[fieldName] = stringValue;
                          }
                        } else if (replicaMetadata.type === "array" && replicaMetadata.array === "string") {
                          if (Array.isArray(replicaMetadata.value) && replicaMetadata.value.length > 0) {
                            const arrayValue = replicaMetadata.value.filter((v: any) => {
                              if (typeof v === 'string') return v.trim() !== "";
                              return v != null && String(v).trim() !== "";
                            });
                            if (arrayValue.length > 0) {
                              replicaObject[fieldName] = arrayValue;
                            }
                          }
                        } else if (replicaMetadata.type === "object") {
                          // For nested objects within replicas, collect from their children
                          const nestedObjectValue: Record<string, unknown> = {};
                          const nestedChildren = replicaChild.children
                            ?.map(childId => schemeDataToPublish.find(node => node.id === childId))
                            .filter((node): node is TreeNode => node != null) || [];
                          
                          nestedChildren.forEach(nestedChild => {
                            const { name: nestedFieldName, metadata: nestedMetadata } = nestedChild;
                            
                            if (nestedMetadata.type === "string") {
                              const value = nestedMetadata.value ?? "";
                              const stringValue = typeof value === 'string' ? value : String(value);
                              if (stringValue.trim() !== "") {
                                nestedObjectValue[nestedFieldName] = stringValue;
                              }
                            } else if (nestedMetadata.type === "array" && nestedMetadata.array === "string") {
                              if (Array.isArray(nestedMetadata.value) && nestedMetadata.value.length > 0) {
                                const arrayValue = nestedMetadata.value.filter(v => {
                                  if (typeof v === 'string') return v.trim() !== "";
                                  return v != null && String(v).trim() !== "";
                                });
                                if (arrayValue.length > 0) {
                                  nestedObjectValue[nestedFieldName] = arrayValue;
                                }
                              }
                            }
                            // Handle further nesting if needed
                          });
                          
                          if (Object.keys(nestedObjectValue).length > 0) {
                            replicaObject[fieldName] = nestedObjectValue;
                          }
                        }
                      });
                      
                      return replicaObject;
                    }).filter((item: any) => Object.keys(item).length > 0); // Remove empty objects
                    
                    // Only include non-empty arrays with meaningful content
                    if (arrayValue.length > 0) {
                      childObject[name] = arrayValue;
                    }
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
        
        // Reset modal state and close modal on success
        resetModalState();
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
        
        // Reset modal state and close modal for other types of errors
        resetModalState();
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
        cancelAction={() => {
          resetModalState();
          setModalProps((prevProps) => ({ ...prevProps, show: false }));
        }}
        isLoading={modalProps.isLoading}
      />
    </div>
  );
};

export default TopicDetail;
