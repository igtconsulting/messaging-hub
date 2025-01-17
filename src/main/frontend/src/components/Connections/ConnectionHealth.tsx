import { ConnectionHealth } from "../../types";
import HealthCard from "./HelathCard";

const Connectionhealth = ({ data, type }: { data: ConnectionHealth, type: string }) => {
  const generalNames = ["Name", "Realm Size", "Server Time", "Update Interval"];
  const generalValues = [
    data?.AliasName,
    data?.size,
    data?.serverTime,
    data?.updateInterval,
  ];
  const cpuNames = ["CPU Usage", "Number of channels", "Total published", "Total nodes"];
  const cpuValues = [
    data?.CPUUsage,
    data?.numberOfChannels,
    data?.totalPublished,
    data?.totalNodes,
  ];
  const memoryNames = ["Free memory", "Physical memory", "Max heap memory", "Buffers created"];
  const memoryValues = [
    data?.freeMemory,
    data?.physicalMemory,
    data?.maxHeapMemory,
    data?.buffersCreated,
  ];
  const memoryIndices = [0, 1, 2];
  const kafkaNames = ["Describe host", "Describe port", "Describe node ID", "Describe rack"];
  const kafkaValues = [
    data?.describeHost,
    data?.describePort,
    data?.describeNodeID,
    data?.describeRack,
  ];
  return (
    <div className="mb-8">
      {type === "UM" ? (
      <div className="flex flex-col space-y-6">
        <HealthCard
          heading="General"
          rowNames={generalNames}
          rowValues={generalValues}
        />
        <HealthCard
          heading="CPU"
          rowNames={cpuNames}
          rowValues={cpuValues}
        />
        <HealthCard
          heading="Memory"
          rowNames={memoryNames}
          rowValues={memoryValues}
          byteValuesIndices={memoryIndices}
        />
      </div>
      ) : (
        <HealthCard heading="General" rowNames={kafkaNames} rowValues={kafkaValues} />
      )}
    </div>
  );
};

export default Connectionhealth;
