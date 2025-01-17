import { useContext, useEffect, useMemo, useState } from "react";
import { DeleteTrash } from "../../assets/icons/DeleteTrash";
import { EditPen } from "../../assets/icons/EditPen";
import Button from "../../components/General/Button";
import Table from "../../components/General/Table";
import BreadCrumbs from "../../layouts/Breadcrumbs";
import { deleteInterface, getInterfaces } from "../../services/apiService";
import { AlertContext } from "../../contextapi/AlertContext";
import { Interface, TableRow } from "../../types";
import {
  formatInterfaceDataForTable,
  groupEnvironments,
} from "../../services/dataFormating";
import Loading from "../../components/General/Loading";
import { Link, useNavigate } from "react-router-dom";
import DataConfirm from "../../components/General/DataConfirm";

const Interfaces = () => {
  const [interfaceData, setInterfaceData] = useState<Interface[]>([]);
  const [loading, setLoading] = useState(true);
  const { addAlert } = useContext(AlertContext);
  const [confirmProps, setConfirmProps] = useState({
    show: false,
    title: "",
    description: "",
    confirmAction: () => {},
    buttonColor: "red",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const getInterfaceData = async () => {
      try {
        const data: Interface[] = await getInterfaces();
        setInterfaceData(data);
      } catch (error) {
        addAlert(
          "Failed to load interfaces data. Please try again later.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    getInterfaceData();
  }, []);

  const handleDeleteInterface = async (interfaceName: string) => {
    try {
      await deleteInterface(interfaceName);
      setInterfaceData((previous) =>
        previous.filter((el) => el.interface_name !== interfaceName)
      );
      addAlert("Interface deleted successfully", "success");
    } catch (error) {
      addAlert("Failed to delete interface", "error");
    } finally {
      setConfirmProps((prevProps) => ({ ...prevProps, show: false }));
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

  const formattedInterfaces = useMemo(() => {
    const groupedData = groupEnvironments(interfaceData);
    return formatInterfaceDataForTable(groupedData);
  }, [interfaceData]);

  return (
    <>
      <div className="container mx-auto">
        <BreadCrumbs
          path={[
            { name: "Home", link: "/" },
            { name: "Interfaces", link: "/interfaces" },
          ]}
        />
        <h1 className="text-title dark:text-white mb-10">Interfaces</h1>

        <Link to={"/interfaces/new"} className="inline-block">
          <Button color="green" text="+ Add New Interface" />
        </Link>

        <div className="mt-6">
          {!loading ? (
            <Table
              connectionTypes={["All", "UM", "KAFKA"]}
              columns={[
                "Interface name",
                "Type",
                "Environments",
                "Topic source",
                "Actions",
              ]}
              data={formattedInterfaces}
              actionButtonColors={["blue", "red"]}
              actionButtonIcons={[EditPen, DeleteTrash]}
              redirectTo="interfaces"
              onActionClick={handleActionClick}
            />
          ) : (
            <Loading />
          )}
        </div>
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
      />
    </>
  );
};

export default Interfaces;
