export type Connection = {
  connection_name: string;
  connection_type: string;
  global_prefix: string;
  is_resource_name: string;
  prometheus_url: string;
};

export type ConnectionHealth = {
  // UM-specific fields
  AliasName?: string;
  CPUUsage?: number;
  buffersCreated?: number;
  buffersReused?: number;
  currentConnection?: number;
  fanoutBacklot?: number;
  freeDirectMemory?: number;
  freeMemory?: number;
  heapPercentage?: number;
  internalSchedulerSize?: number;
  maxHeapMemory?: number;
  numberOfChannels?: number;
  numberOfQueues?: number;
  numberOfThreads?: number;
  physicalMemory?: number;
  queuedThreads?: number;
  reusedThreads?: number;
  serverTime?: string;
  size?: number;
  startTime?: string;
  totalConnections?: number;
  totalDirectMemory?: number;
  totalGCCount?: number;
  totalMemory?: number;
  totalNodes?: number;
  totalPublished?: number;
  totalSubscribed?: number;
  updateInterval?: number;
  usedEventMemory?: number;

  // Kafka-specific fields
  describeHost?: string;
  describePort?: string;
  describeNodeID?: string;
  describeRack?: string;
}

export type ConnectionWithHealth = Connection & {health?: ConnectionHealth}

export type Topic = {
  topicName: string;
  packageName: string;
  schema: string;
  connectionType?: string;
  connectionName?: string;
  umAlias?: string;
  documentType?: string
  triggerPrefix?: string;
};

export type Interface = InterfaceDeliveryOptions & InterfaceDetails

export type InterfaceDetails = {
  interface_type: string
  interface_name: string
  environment: string
  enabled: boolean
  source_topic: string
  message_filter?: string
  delivery_method?: string
  package_name?: string
  um_connection?: string
  global_prefix?: string
  trigger_execution_user?: string
  messaging_hub_forwarding?: "false" | "true"
}

export type InterfaceDeliveryOptions = {
  genericDeliveryConfig?: GenericDeliveryConfig[]
  custom_service_name?: CustomServiceName
}

export type GenericDeliveryConfig = {
  delivery_endpoint: string
  delivery_format: string
  exclude_fields: string
  auth: InterfaceAuth
}

export type InterfaceAuth = {
  auth_type: AuthTypes
  auth_user_name?: string
  auth_password?: string
  auth_token_service?: string
}

export type AuthTypes = 'Basic' | 'None' | 'Bearer'

export type CustomServiceName = string

export type TableRow = {
  parameters: string[];
  actions: string[];
};

export type InputErrorProps = {
  inputName: string | null | undefined;
  errorMessage: string;
}

export type SelectOption = {
  label: string;
  value: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
};

export type TreeNode = {
  name: string
  parent: number
  id: number
  children: number[]
  metadata: TreeNodeMetadata
}

export type TreeNodeMetadata = {
  type: string | undefined
  additionalProperties?: string
  required?: string
  array?: string
  value?: any
  replicaOf?: number
}

export type JSONTreeNode = {
  type: (string | undefined)[] | undefined | string
  additionalProperties?: boolean
  properties?: Record<string, JSONTreeNode>
  required?: string[]
  items?: JSONTreeNode[]
}

export type TopicDetails = {
  // TODO
  total_consumed?: number;
  total_published?: number;
  describeTopicPartitions?: number;
  describeTopicReplications?: number;
}

export type Package = {
  name: string;
};

export type GroupedOption = {
  [key: string]: { value: string; label: string; type: string }[]
}

export type SelectTopicOption = {
  label: string;
  type: string;
  options: {
    value: string;
    label: string;
  }[];
};

export type TopicWithType = {
  connectionName: string;
  topicName: string;
  connectionType: string;
};

export type Durable = {
  durableName: string;
  durableType: string;
  durableSelector: string;
  processingStatus: string;
  retrievalStatus: string;
};