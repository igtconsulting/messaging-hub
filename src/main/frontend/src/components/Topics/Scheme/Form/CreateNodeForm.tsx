import { useEffect, useRef, useState } from "react";
import { X } from "../../../../assets/icons/X";
import { Check } from "../../../../assets/icons/Check";
import { Select } from "./CustomSelect";
import { TextField } from "../../../../assets/icons/TextField";
import { Folder } from "../../../../assets/icons/Folder";
import { SelectOption, TreeNode, TreeNodeMetadata } from "../../../../types";
import Button from "../../../General/Button";
import Input from "../../../General/Form/Input";
import Toggle from "../../../General/Toggle";
// import { DocumentList } from "../../../../assets/icons/DocumentList";

const CreateNodeForm: React.FC<{
  closeForm: () => void;
  createTreeNode?: (
    nodeName: string | undefined,
    nodeType: string | null,
    required: string | undefined,
    additionalProperties: string | undefined
  ) => void;
  nodeData?: TreeNode;
  editTreeNode?: (node: TreeNode) => void;
  expandParent: () => void;
}> = ({ closeForm, createTreeNode, nodeData, editTreeNode, expandParent }) => {
  const name = useRef<HTMLInputElement | null>(null);
  const typeOptions = [
    { label: "String", value: "string", icon: TextField },
    { label: "Object", value: "object", icon: Folder },
    { label: "String List", value: "stringlist", icon: TextField },
    { label: "Document List", value: "documentlist", icon: Folder },
  ];
  const [type, setType] = useState<SelectOption>(typeOptions[0]);
  const [required, setRequired] = useState(
    nodeData ? nodeData.metadata.required === "yes" : false
  );

  useEffect(() => {
    if (nodeData) {
      const nodeType = nodeData.metadata.type === "array" ? nodeData.metadata.array : nodeData.metadata.type;
      if (name.current) {
        name.current.value = nodeData.name;
      }
      setType(
        typeOptions.find((option) => option.value === (nodeType === "document" ? "documentlist" : nodeType)) ||
          typeOptions[0]
      );
      setRequired(nodeData.metadata.required === "yes");
    }
  }, [nodeData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nodeData && editTreeNode) {
      const metadata: TreeNodeMetadata = {
        ...nodeData.metadata,
        type: type?.value == "stringlist" || type?.value == "documentlist"
          ? "array"
          : type?.value,
        required: required ? "yes" : "no",
      };
  
      if (type?.value === "object" || type?.value === "documentlist") {
        metadata["additionalProperties"] = "yes";
      }
  
      if (type?.value == "stringlist") {
        metadata["array"] = "string";
      } else if (type?.value == "documentlist") {
        metadata["array"] = "document";
      }
  
      const updatedNode: TreeNode = {
        ...nodeData,
        name: name.current?.value || "",
        metadata: metadata,
      };
  
      editTreeNode(updatedNode);
    } else if (createTreeNode) {
      createTreeNode(
        name.current?.value,
        type?.value,
        required ? "yes" : "no",
        type?.value === "object" || type?.value === "documentlist"
          ? "yes"
          : "no"
      );
    }
    expandParent();
  };

  return (
    <div className="flex justify-between items-center bg-white px-4 py-2.5 my-2 rounded-md">
      <div className="flex items-center gap-2">
        <Select
          options={typeOptions}
          onChange={setType}
          value={type}
          label="Type"
          disabled={nodeData && nodeData.children.length > 0 ? true : false}
        />
        <Input
          label="Name"
          schemeSize={true}
          ref={name}
          type="text"
          autoFocus={true}
        />
        <div className="flex items-center gap-2">
          <Toggle
            toggled={required}
            pressed={() => setRequired(!required)}
            size="small"
          />
          <span className="text-sm">Required</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          color="red"
          icon={X}
          iconPosition="center"
          tableButton={true}
          padding={false}
          className="p-0.5"
          onClick={closeForm}
        />
        <Button
          type="button"
          color="green"
          icon={Check}
          iconPosition="center"
          tableButton={true}
          padding={false}
          className="p-0.5"
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
};

export default CreateNodeForm;
