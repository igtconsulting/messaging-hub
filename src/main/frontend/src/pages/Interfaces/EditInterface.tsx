import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/General/Card";
import { useContext, useEffect, useState } from "react";
import { AlertContext } from "../../contextapi/AlertContext";
import BreadCrumbs from "../../layouts/Breadcrumbs";
import InterfaceForm from "../../components/Interfaces/InterfaceForm/InterfaceForm";
import { editEnvInterface, getInterface } from "../../services/apiService";
import { Interface } from "../../types";
import Loading from "../../components/General/Loading";

const EditInterface = () => {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const { addAlert } = useContext(AlertContext);
  const [interfaces, setInterfaces] = useState<Interface[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function getInterfaces() {
      try {
        if (!name) throw Error;
        const response = await getInterface(name);
        setInterfaces(response);
        setLoading(false);
      } catch (error) {
        addAlert(
          "There was a problem loading the interface. Try again later",
          "error"
        );
        navigate("/interfaces");
      }
    }
    getInterfaces();
  }, [name, addAlert, navigate]);

  const currentInterface = interfaces[selectedEnvironment];

  async function onEditInterface(editedInterface: Interface) {
    try {
      await editEnvInterface(
        name,
        currentInterface.environment,
        editedInterface
      );
      navigate("/interfaces");
      addAlert("Interface updated successfully", "success");
    } catch (error) {
      addAlert(
        "There was a problem updating the interface. Try again later",
        "error"
      );
    }
  }

  return (
    <>
      <BreadCrumbs
        path={[
          { name: "Home", link: "/" },
          { name: "Interfaces", link: "/interfaces" },
          { name: `Edit interface`, link: `/interfaces/${name}/edit` },
        ]}
        backLink="/interfaces"
      />

      <div className="container mx-auto">
        <h1 className="text-title dark:text-white mb-10">Edit {name}</h1>

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

        <div className="">
          <Card>
            {loading ? (
              <Loading />
            ) : (
              <InterfaceForm
                submitForm={onEditInterface}
                interfaceEnv={currentInterface}
              />
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default EditInterface;
