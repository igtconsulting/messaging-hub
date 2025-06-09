import Button from "./Button";

type ModalProps = {
  title: string;
  content?: JSX.Element;
  buttonColor?: string;
  show: boolean;
  confirmAction?: () => void;
  confirmButtonText?: string;
  cancelAction?: () => void;
  children?: JSX.Element;
};

const Modal: React.FC<ModalProps> = ({
  title,
  content,
  buttonColor,
  show,
  confirmAction,
  cancelAction,
  children,
  confirmButtonText,
}) => {
  return (
    <div className={`fixed inset-0 z-40 ${!show ? "hidden" : ""}`}>
      <div className="fixed inset-0 bg-black opacity-75"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto">
        <div className="flex bg-white w-3/4 max-h-3/4 overflow-y-auto">
          <div className="flex flex-col justify-between px-8 py-10 w-full">
            <div className="mb-8">
              <h1 className="text-title mb-4">{title}</h1>
              <div className="text-redactor text-black mb-4">
                {content ? content : children}
              </div>
            </div>
            <div className="flex justify-end gap-4 pb-4">
              <Button color="gray" text="Back" onClick={cancelAction} />
              {confirmAction && (
                <Button
                  color={buttonColor ? buttonColor : "green"}
                  text={confirmButtonText ?? "Confirm"}
                  onClick={confirmAction}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
