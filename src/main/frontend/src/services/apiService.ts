import axios from "axios";
import { Connection, Interface, Topic } from "../types";

let auth = undefined;
if (import.meta.env.MODE !== 'production') {
  auth = {
    username: import.meta.env.VITE_API_USERNAME,
    password: import.meta.env.VITE_API_PASSWORD,
  };
}

const metadata = {
  headers: {
    Accept: "application/json",
  },
  auth: auth
};

export const getConnections = async () => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/connections`,
    metadata
  );
  return response.data;
};

export const getConnection = async (name: string | undefined) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/connections/${name}`,
    metadata
  );
  return response.data;
};

export const createConnection = async (connection: Connection) => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/connections`,
    connection,
    metadata
  );
  return response.data;
};

export const updateConnection = async (name: string, connection: Connection) => {
  const response = await axios.put(
    `${import.meta.env.VITE_API_URL}/connections/${name}`,
    connection,
    metadata
  );
  return response.data;
};

export const deleteConnection = async (name: string) => {
  const response = await axios.delete(
    `${import.meta.env.VITE_API_URL}/connections/${name}`,
    metadata
  );
  return response.data;
};

export const getConnectionHealth = async (name: string) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/${name}/health`,
    metadata
  );
  return JSON.parse(response.data.data);
};

export const getTopics = async () => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/topics`,
    metadata
  );
  return response.data;
};

export const getTopic = async (connectionName: string, topicName: string) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/${connectionName}/topics/${topicName}`,
    metadata
  );
  return response.data;
};

export const getTopicDetail = async (connectionName: string, topicName: string) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/${connectionName}/topics/${topicName}/detail`,
    metadata
  );
  return response.data.data;
};

export const getTopicsForConnection = async (name: string) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/${name}/topics`,
    metadata
  );
  return response.data;
};

export const createTopic = async (topic: Topic, connectionName: string) => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/${connectionName}/topics`,
    topic,
    metadata
  );
  return response.data;
};

export const updateTopic = async (topic: Topic, connectionName: string, topicName: string) => {
  const response = await axios.put(
    `${import.meta.env.VITE_API_URL}/${connectionName}/topics/${topicName}`,
    topic,
    metadata
  );
  return response.data;
};

export const deleteTopic = async (connectionName: string, topicName: string) => {
  const response = await axios.delete(
    `${import.meta.env.VITE_API_URL}/${connectionName}/topics/${topicName}`,
    metadata
  );
  return response.data;
};

export const getInterfaces = async () => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/interfaces`,
    metadata
  );
  return response.data;
};

export const getInterface = async (name: string) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/interfaces/${name}`,
    metadata
  );
  return response.data;
};


export const getEnvInterface = async (name: string | undefined, env: string | undefined) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/interfaces/${env}/${name}`,
    metadata
  );
  return response.data;
}

export const editEnvInterface = async (name: string | undefined, env: string | undefined, editedInterface: Interface) => {
  const response = await axios.put(
    `${import.meta.env.VITE_API_URL}/interfaces/${env}/${name}`,
    editedInterface,
    metadata
  );
  return response.data;
}

export const createEnvInterface = async (editedInterface: Interface) => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/interfaces`,
    editedInterface,
    metadata
  );
  return response.data;
}

export const deleteInterface = async (name: string) => {
  const response = await axios.delete(
    `${import.meta.env.VITE_API_URL}/interfaces/${name}`,
    metadata
  );
  return response.data;
};

export const deleteEnvInterface = async (name: string, env: string) => {
  const response = await axios.delete(
    `${import.meta.env.VITE_API_URL}/interfaces/${env}/${name}`,
    metadata
  );
  return response.data;
};

export const getPackages = async () => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/packages`,
    metadata
  );
  return response.data;
};

export const getDurablesForTopic = async (connectionName: string, topicName: string) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/${connectionName}/${topicName}/durables`,
    metadata
  );
  return response.data;
};

export const deleteDurable = async (connectionName?: string, topicName?: string, durableName?: string) => {
  const response = await axios.delete(
    `${import.meta.env.VITE_API_URL}/${connectionName}/${topicName}/durables/${durableName}`,
    metadata
  );
  return response.data;
}

export const publishTopicMessage = async (connectionName?: string, topicName?: string, message?: unknown) => {
  const formattedBody = {
    jsonStream: message
  }

  const response = await axios.post(
    `${import.meta.env.VITE_API_URL}/${connectionName}/topics/${topicName}`,
    formattedBody,
    metadata
  );
  return response.data;
}

export const showLastMessage = async (interfaceName?: string, environment?: string): Promise<{pipelineJSONString: string}> => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/interfaces/${environment}/${interfaceName}/getPipeline`,
    metadata
  );
  return response.data;
}
