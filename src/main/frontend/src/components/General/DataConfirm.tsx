import Button from "./Button";
import { Error } from "../../assets/icons/Error";

type DataConfirmProps = {
  title: string;
  description: string;
  buttonColor?: string;
  show: boolean;
  cancelAction: () => void;
  confirmAction: () => void;
};

const DataConfirm: React.FC<DataConfirmProps> = ({
  title,
  description,
  buttonColor,
  show,
  cancelAction,
  confirmAction
}) => {
  return (
    <div className={`fixed inset-0 z-40 ${!show ? "hidden" : ""}`}>
      <div className="fixed inset-0 bg-black opacity-75"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto">
        <div className="flex bg-white w-1/2">
          <div className="w-4 bg-purple"></div>
          <div className="flex py-10">
            <div className="px-6 py-1">
              <Error className="text-purple w-10 h-10" />
            </div>
            <div className="pr-8">
              <h1 className="text-title mb-4">{title}</h1>
              <p className="text-redactor text-black mb-6">{description}</p>
              <div className="flex gap-4">
                <Button color="gray" text="Back" onClick={cancelAction} type="button" />
                <Button color={buttonColor ? buttonColor : "red"} text="Delete" onClick={confirmAction} type="button" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataConfirm;
