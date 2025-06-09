import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import { Search } from "../../assets/icons/Search";
import { ChevronRight } from "../../assets/icons/ChevronRight";
import { ChevronLeft } from "../../assets/icons/ChevronLeft";
import { ConnectionHealth, TableRow } from "../../types";
import { Link} from "react-router-dom";

type TableProps = {
  columns: string[];
  connectionTypes?: string[];
  data: TableRow[];
  actionButtonColors: string[];
  actionButtonIcons?: React.FC<React.SVGProps<SVGSVGElement>>[];
  onVisibleRowsChange?: (visibleRows: TableRow[]) => void;
  healthData?: Record<string, ConnectionHealth>;
  redirectTo: string;
  onActionClick: (action: string, row: TableRow) => void;
  connection?: string;
};

const Table: React.FC<TableProps> = ({
  columns,
  connectionTypes,
  data,
  actionButtonColors,
  actionButtonIcons,
  onVisibleRowsChange,
  healthData = {},
  redirectTo,
  onActionClick,
  connection,
}) => {
  const [selectedConnType, setSelectedConnType] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(0);
  const prevVisibleRowsLengthRef = useRef<number>(0);

  const filteredData = data.filter(
    (row) =>
      (selectedConnType === "All" || row.parameters[1] === selectedConnType) &&
      row.parameters.some((param) =>
        param.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  useEffect(() => {
    if (onVisibleRowsChange) {
      const visibleRows = filteredData.slice(
        page * rowsPerPage,
        (page + 1) * rowsPerPage
      );

      if (visibleRows.length !== prevVisibleRowsLengthRef.current) {
        onVisibleRowsChange(visibleRows);
        prevVisibleRowsLengthRef.current = visibleRows.length;
      }
    }
  }, [
    page,
    rowsPerPage,
    selectedConnType,
    searchTerm,
    filteredData,
    onVisibleRowsChange,
  ]);

  return (
    <>
      {connectionTypes && (
        <div className="flex uppercase font-bold">
          {connectionTypes.map((connectionType: string, index: number) => (
            <button
              key={index}
              className={`uppercase px-4 py-2 border-b-2 ${
                selectedConnType === connectionType
                  ? "border-purple text-purple"
                  : "text-secondaryText border-primary"
              }`}
              onClick={() => setSelectedConnType(connectionType)}
            >
              {connectionType}
            </button>
          ))}
        </div>
      )}
      <div className="bg-white p-3 shadow-md overflow-auto">
        <div className="relative">
          <input
            className="border-2 border-primary rounded-md p-2 py-2.5 pl-10 w-1/4"
            type="text"
            placeholder="Search expression"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-6 w-6 text-secondaryText" />
          </span>
        </div>
        <table className="min-w-full mt-4">
          <colgroup>
            <col style={{ width: "30%" }} />
            {columns.slice(2).map((_, index) => (
              <col
                key={index}
                style={{ width: `${(50 / (columns.length - 2)).toFixed(2)}%` }}
              />
            ))}
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead className="text-left font-bold border-b-2 border-primary">
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="py-2 px-6">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y border-b-2 border-primary divide-primary">
            {filteredData.length > 0 ? (
              filteredData
                .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                .map((row, index) => (
                  <tr key={index} className="hover:bg-gray-lightest">
                    {row.parameters.map(
                      (parameter: string, parameterIndex: number) => (
                        <td key={parameterIndex} className="py-2 px-6">
                          {parameterIndex === 0 ? (
                            <Link
                              to={`/${redirectTo}/${
                                redirectTo === "topics"
                                  // ? row.parameters[2] + "/"
                                  ? (connection ? connection : row.parameters[2]) + "/"
                                  : ""
                              }${parameter}/detail`}
                              {...(redirectTo === "connections"
                                ? { state: { health: healthData[parameter] } }
                                : {})}
                              {...(redirectTo === "topics"
                                ? {
                                    state: {
                                      health: healthData[row.parameters[2]],
                                    },
                                  }
                                : {})}
                              className="underline font-semibold text-blue"
                            >
                              {parameter}
                            </Link>
                          ) : parameter === "Online" ||
                            parameter === "Offline" ? (
                            <span className="flex items-center space-x-2">
                              <span
                                className={`inline-block h-3 w-3 rounded-full bg-${
                                  parameter === "Online"
                                    ? "green"
                                    : "gray-lighter"
                                } mr-2`}
                              ></span>
                              {parameter}
                            </span>
                          ) : (
                            parameter
                          )}
                        </td>
                      )
                    )}
                    <td className="flex items-center space-x-2 py-2 px-4">
                      {row.actions.map(
                        (action: string, actionIndex: number) => {
                          return (
                            <Button
                              color={actionButtonColors[actionIndex]}
                              key={actionIndex}
                              text={action}
                              tableButton={true}
                              icon={
                                actionButtonIcons &&
                                actionButtonIcons[actionIndex]
                              }
                              onClick={() => onActionClick(action, row)}
                            />
                          );
                        }
                      )}
                    </td>
                  </tr>
                ))
            ) : (
              <tr className="text-center">
                <td colSpan={columns.length} className="py-2">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-end text-secondaryText text-sm space-x-10 px-10 pt-5 pb-1.5">
          <div className="text-primaryText flex items-center">
            <span className="text-secondaryText">Rows per page:</span>
            <select
              className="text-center cursor-pointer"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <span className="text-primaryText">
            {page * rowsPerPage + 1}-
            {Math.min((page + 1) * rowsPerPage, filteredData.length)} of{" "}
            {filteredData.length} results
          </span>
          <div className="flex items-center space-x-2">
            <button onClick={() => setPage(page - 1)} disabled={page === 0}>
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * rowsPerPage >= filteredData.length}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Table;
