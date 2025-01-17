import { Connection, Topic, TableRow, Interface, GroupedOption, SelectTopicOption, Durable, ConnectionWithHealth } from "../types";

export const formatConnectionDataForTable = (data: ConnectionWithHealth[]): TableRow[] => {
  return data.map(connection => ({
    parameters: [
      connection.connection_name, 
      connection.connection_type, 
      connection.connection_type.toUpperCase() == "KAFKA" ? connection.health?.describeHost ?? "" : connection.health?.AliasName ?? "",
      // connection.is_resource_name,
      connection.health ? "Online" : "Offline",
    ],
    actions: ["Edit", "Delete"],
  }));
};

export const formatConnectionDataForSelect = (data: Connection[]): {label: string, value: string}[] => {
  return data.map(connection => ({
    label: connection.connection_name,
    value: connection.connection_name,
  }));
};

export const formatTopicDataForTable = (data: Topic[], connection?: string): TableRow[] => {
  return data.map(topic => ({
    parameters: [
      topic.topicName,
      topic.connectionType,
      connection ?? topic.connectionName,
    ] as string[],
    actions: ["Edit", "Delete"],
  }));
};

export const formatTopicDataForSelect = (data: Topic[]): SelectTopicOption[] => {
  const groupedOptions: GroupedOption = data.reduce((acc: GroupedOption, topic: Topic) => {
    const { connectionName, topicName, connectionType } = topic;
    if (!connectionName) return acc;
    if (!acc[connectionName]) {
      acc[connectionName] = [];
    }
    acc[connectionName].push({ value: topicName, label: topicName, type: connectionType || "" });
    return acc;
  }, {});

  return Object.entries(groupedOptions).map(
    ([connectionName, options]) => ({
      label: connectionName,
      type: options[0].type,
      options: options.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    })
  );
};

export const formatTopicDataForTableInConnectionDetails = (data: Topic[]): TableRow[] => {
  return data.map(topic => ({
    parameters: [
      topic.topicName,
      topic.packageName,
    ] as string[],
    actions: ["Edit", "Delete"],
  }));
};

export const formatInterfaceDataForTable = (
  data: {
    interface_name: string;
    interface_type: string;
    source_topic: string;
    environments: string[];
  }[]
): TableRow[] => {
  return data.map((item) => ({
    parameters: [
      item.interface_name,
      (item.interface_type === "KAFKA_PRODUCER" || item.interface_type === "KAFKA_CONSUMER") ? "KAFKA" : item.interface_type,
      item.environments.join('|'),
      item.source_topic,
    ],
    actions: ["Edit", "Delete"],
  }));
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const roundedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${roundedValue} ${sizes[i]}`;
};

export const groupEnvironments = (data: Interface[]) => {
  if (!data) return [];
  const groupedData = data.reduce((acc, curr) => {
    const { environment, interface_name, interface_type, source_topic } = curr;

    const existingInterface = acc.find(
      (item) => item.interface_name === interface_name
    );

    if (existingInterface) {
      existingInterface.environments.push(environment);
    } else {
      acc.push({
        interface_name,
        interface_type,
        source_topic,
        environments: [environment],
      });
    }

    return acc;
  }, [] as {
    interface_name: string;
    interface_type: string;
    source_topic: string;
    environments: string[];
  }[]);

  return groupedData;
};

export const formatDurablesDataForTable = (data: Durable[]): TableRow[] => {
  return data.map((item) => ({
    parameters: [
      item.durableName,
      item.durableType,
      item.durableSelector,
      item.processingStatus,
      item.retrievalStatus
    ],
    actions: ["Delete"],
  }));
};