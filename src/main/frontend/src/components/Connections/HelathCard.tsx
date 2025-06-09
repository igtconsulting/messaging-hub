import React from "react";
import { formatBytes } from "../../services/dataFormating";

type HealthCardProps = {
  heading: string;
  rowNames: string[];
  rowValues: (string | number | React.ReactNode)[];
  byteValuesIndices?: number[];
};

const HealthCard: React.FC<HealthCardProps> = ({ heading, rowNames, rowValues, byteValuesIndices = [] }) => {
  const isByteValue = (index: number) => byteValuesIndices.includes(index);

  const renderRow = (label: string, value: React.ReactNode, index: number) => (
    <div className="flex flex-row" key={index}>
      <div className="flex w-full text-redactor">
        <span className="w-1/2 lg:w-1/3">{label}</span>
        <span>
          {isByteValue(index) && typeof value === "number" ? `${value} B (approx. ${formatBytes(value)})` : value}
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-5 shadow-md">
      <h1 className="text-subtitle dark:text-white text-gray-lighter uppercase mb-4">
        {heading}
      </h1>
      {rowNames.map((name, index) => renderRow(name, rowValues[index], index))}
    </div>
  );
};

export default HealthCard;
