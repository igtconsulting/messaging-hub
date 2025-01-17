import TreeView, { INode, NodeId } from "react-accessible-treeview";
import { useEffect, useMemo, useState } from "react";
import { Folder } from "../../../assets/icons/Folder";
import Button from "../../General/Button";
import { TreeNode, TreeNodeMetadata } from "../../../types";
import { Plus } from "../../../assets/icons/Plus";
import { EditPen } from "../../../assets/icons/EditPen";
import { DeleteTrash } from "../../../assets/icons/DeleteTrash";
import { FolderOpen } from "../../../assets/icons/FolderOpen";
import CreateNodeForm from "./Form/CreateNodeForm";
import { TextField } from "../../../assets/icons/TextField";
import { DocumentList } from "../../../assets/icons/DocumentList";
import { X } from "../../../assets/icons/X";
import { IFlatMetadata } from "react-accessible-treeview/dist/TreeView/utils";
import { parseObject } from "../../../services/schemeFormating";

const SchemeTree: React.FC<{
  editable?: boolean;
  publishable?: boolean;
  treeData: TreeNode[];
  publishData?: TreeNode[];
  addToTree?: (treeNode: TreeNode, required: string) => void;
  deleteNode?: (id: number) => void;
  editNode?: (updatedNode: TreeNode) => void;
  onChangeLocalPublishData?: (newPublishData?: TreeNode[]) => void;
}> = ({
  editable,
  treeData,
  publishData,
  addToTree,
  deleteNode,
  editNode,
  publishable,
  onChangeLocalPublishData,
}) => {
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<number[]>([
    ...treeData.map((el) => el.id),
  ]);
  const [elementIdsToEdit, setElementIdsToEdit] = useState<number[]>([]);
  const treeDataCorrected = [
    {
      name: "",
      id: 0,
      parent: null,
      metadata: { type: "object" },
      children: [1],
    },
    ...treeData,
  ];
  const [localPublishData, setLocalPublishData] = useState(publishData || []);
  const publishDataCorrected = [
    {
      name: "",
      id: 0,
      parent: null,
      metadata: { type: "object" },
      children: [1],
    },
    ...localPublishData,
  ];
  const [inputValues, setInputValues] = useState<{ [key: NodeId]: string }>({});
  const [showDocumentList, setShowDocumentList] = useState<null | NodeId>(null);

  useEffect(() => {
    onChangeLocalPublishData && onChangeLocalPublishData(localPublishData);
  }, [localPublishData]);

  const handleExpandParent = (elementId: NodeId) => {
    setExpandedIds((prevExpandedIds) => {
      const newId = Number(elementId);
      if (!prevExpandedIds.includes(newId)) {
        const newExpandedIds = [...prevExpandedIds, newId];
        // console.log(newExpandedIds)
        return newExpandedIds;
      } else {
        // console.log(prevExpandedIds)
        return prevExpandedIds;
      }
    });
  };

  const removeElementIdFromEdit = (elementId: NodeId) => {
    setElementIdsToEdit((prevElementIdsToEdit) => {
      const newId = Number(elementId);
      return prevElementIdsToEdit.filter((id) => id !== newId);
    });
  };

  const handleElementIdsToEdit = (elementId: NodeId) => {
    setElementIdsToEdit((prevElementIdsToEdit) => {
      const newId = Number(elementId);
      if (!prevElementIdsToEdit.includes(newId)) {
        return [...prevElementIdsToEdit, newId];
      } else {
        return prevElementIdsToEdit;
      }
    });
  };

  const deleteNodeHandler = (id: number) => {
    if (deleteNode) deleteNode(id);
  };

  const createTreeNodeHandler = (
    nodeName: string | undefined,
    nodeType: string | null,
    required: string | undefined,
    additProps: string | undefined
  ) => {
    if (
      !nodeName ||
      nodeName == "" ||
      !nodeType ||
      !required ||
      !createParentId
    )
      return;

    const metadata: TreeNodeMetadata = {
      type:
        nodeType == "stringlist" || nodeType == "documentlist"
          ? "array"
          : nodeType,
    };
    if (nodeType == "object") {
      metadata["additionalProperties"] = additProps;
    }

    if (nodeType == "stringlist") metadata["array"] = "string";
    if (nodeType == "documentlist") metadata["array"] = "document";

    if (required) metadata["required"] = required;

    if (addToTree)
      addToTree(
        {
          name: nodeName,
          id: Math.floor(Math.random() * (10000 - 50 + 1)) + 50,
          parent: createParentId,
          metadata: metadata,
          children: [],
        },
        required
      );
    setCreateParentId(null);
  };

  const editTreeNodeHandler = (updatedNode: TreeNode) => {
    if (editNode) {
      editNode(updatedNode);
      removeElementIdFromEdit(updatedNode.id);
    }
  };

  /* console.log(publishDataCorrected);
  console.log("publishData", publishData);
  console.log("localPublishData", localPublishData);
  console.log(inputValues);*/

  const handleStringChange = (id: NodeId, value: string, type: string) => {
    setInputValues((prev) => ({ ...prev, [id]: value }));
    if (type == "string") {
      setLocalPublishData((prevData) => {
        if (!prevData) return prevData;

        const updatedData = [...prevData];
        const node = updatedData.find((item) => item.id === id);

        if (node) {
          node.metadata.value = value;
        }

        return updatedData;
      });
    }
  };

  const handleArrayPush = (id: NodeId) => {
    setLocalPublishData((prevData) => {
      if (!prevData) return prevData;

      const inputValue = inputValues[id]?.trim();
      if (!inputValue) return prevData;

      const updatedData = [...prevData];
      const node = updatedData.find((item) => item.id === id);

      if (node) {
        if (!Array.isArray(node.metadata.value)) {
          node.metadata.value = [];
        }

        node.metadata.value.push(inputValue);

        const newArrayIndexNode = {
          id: Math.floor(Math.random() * 10000),
          parent: id,
          name: `${node.name}[${node.metadata.value.length - 1}]`,
          children: [],
          metadata: { type: "string", value: inputValue },
        };

        updatedData.push(newArrayIndexNode);

        node.children = [...node.children, newArrayIndexNode.id];

        setInputValues((prev) => ({ ...prev, [id]: "" }));
      }

      return updatedData;
    });
  };

  const handleArrayPushForDocument = (id: NodeId) => {
    // Step 1: Get child IDs for the specified node ID
    let childIds = localPublishData
      ? getChildIdsByNodeId(id, localPublishData)
      : [];

    childIds =
      localPublishData
        ?.filter((el) => childIds.includes(el.id) && !el.metadata.replicaOf)
        .map((el) => el.id) || [];
    // Step 2: Determine missing IDs
    const missingIds = publishData ? getMissingIds(childIds, publishData) : [];

    // Step 3: Update localPublishData by handling the document creation first
    setLocalPublishData((prevData) => {
      if (!prevData) return prevData;

      let updatedData = [...prevData];
      const parentNode = updatedData.find((item) => item.id === id);

      if (parentNode) {
        if (!Array.isArray(parentNode.metadata.value)) {
          parentNode.metadata.value = []; // Ensure parent node's value is initialized as an array
        }

        const collectChildValues = (parentId: NodeId): any => {
          const childObject: any = {};
          const children = updatedData.filter(
            (item) => item.parent === parentId && !item.metadata.replicaOf
          );

          children.forEach((child) => {
            const childValue = inputValues[child.id]?.trim();
            if (child.metadata.type === "string") {
              childObject[child.name] = childValue || "";
            } else if (
              child.metadata.type === "array" &&
              child.metadata.array === "string"
            ) {
              childObject[child.name] = child.metadata.value;
            } else if (child.metadata.type === "object") {
              childObject[child.name] = collectChildValues(child.id);
            }
          });

          return childObject;
        };

        const documentObject = collectChildValues(id);

        if (Object.keys(documentObject).length > 0) {
          const newDocumentNodeId = Math.floor(Math.random() * 100000);
          parentNode.metadata.value.push({
            ...documentObject,
            id: newDocumentNodeId,
          });

          const newDocumentNode = {
            id: newDocumentNodeId,
            parent: id,
            name: `${parentNode.name}[${parentNode.metadata.value.length - 1}]`,
            children: [],
            metadata: {
              type: "object",
              value: documentObject,
              replicaOf: parentNode.id,
            },
          };

          updatedData.push(newDocumentNode);

          parentNode.children = [...parentNode.children, newDocumentNodeId];

          updatedData.forEach((item) => {
            if (item.parent === id || item.id === id) {
              setInputValues((prev) => ({ ...prev, [item.id]: "" }));
            }
          });
        }
      }

      // Step 4: Now remove each missing ID from the tree
      for (const idToRemove of missingIds) {
        updatedData = removeIdFromTree(idToRemove, updatedData);
      }

      return updatedData;
    });
  };

  // Function to remove an ID and update parent values
  function removeIdFromTree(idToRemove: number, data: TreeNode[]) {
    const newData = data.filter((node) => node.id !== idToRemove);

    const removedNode = data.find((node) => node.id === idToRemove);

    for (const node of newData) {
      node.children = node.children.filter((childId) => childId !== idToRemove);

      if (removedNode && node.id === removedNode.parent) {
        if (node.metadata && node.metadata.value) {
          node.metadata.value = [];
        }
      }
    }

    return newData;
  }

  const getChildIdsByNodeId = (nodeId: NodeId, data: TreeNode[]): number[] => {
    const result: number[] = [];

    const findNodeAndCollectChildren = (id: NodeId) => {
      const node = data.find((item) => item.id === id);
      if (node) {
        result.push(...node.children);
        node.children.forEach((childId) => {
          findNodeAndCollectChildren(childId); // Recursively find child nodes
        });
      }
    };

    findNodeAndCollectChildren(nodeId);
    return result;
  };

  const deleteChildOfStringList = (element: INode<IFlatMetadata>) => {
    setLocalPublishData((previous) => {
      const filteredElements = previous?.filter((el) => el.id != element.id);
      return filteredElements?.map((el) => {
        if (el.id == element.parent)
          return {
            ...el,
            children: el.children.filter((child) => child != element.id),
            metadata: {
              ...el.metadata,
              value: el.metadata.value.filter(
                (stringVal: string) => stringVal != element.metadata?.value
              ),
            },
          };
        else return el;
      });
    });
  };

  const deleteChildOfDOcumentList = (element: INode<IFlatMetadata>) => {
    setLocalPublishData((previous) => {
      const filteredElements = previous?.filter((el) => el.id != element.id);
      return filteredElements?.map((el) => {
        if (el.id == element.parent)
          return {
            ...el,
            children: el.children.filter((child) => child != element.id),
            metadata: {
              ...el.metadata,
              value: el.metadata.value.filter(
                (document: any) => document.id != element.id
              ),
            },
          };
        else return el;
      });
    });
  };

  const getMissingIds = (
    childIds: number[],
    publishData: TreeNode[]
  ): number[] => {
    const existingIds = new Set(publishData.map((node) => node.id));

    const missingIds = childIds.filter((childId) => !existingIds.has(childId));

    return missingIds;
  };

  const Icon: React.FC<{
    isOpen: boolean;
    OpenIcon: React.FC<React.SVGProps<SVGSVGElement>>;
    CloseIcon: React.FC<React.SVGProps<SVGSVGElement>>;
    className?: string;
  }> = ({ isOpen, OpenIcon, CloseIcon, className }) => {
    const IconComponent = isOpen ? OpenIcon : CloseIcon;
    return <IconComponent className={`text-gray-dark text-2xl ${className}`} />;
  };

  return (
    <>
      {/* Tree */}
      <TreeView
        data={publishable ? publishDataCorrected : treeDataCorrected}
        aria-label="directory tree"
        expandedIds={expandedIds}
        onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
        nodeRenderer={({
          element,
          isExpanded,
          isDisabled,
          getNodeProps,
          level,
          handleExpand,
        }) => {
          return (
            <>
              {!elementIdsToEdit.includes(Number(element.id)) ? (
                <div
                  {...getNodeProps({ onClick: handleExpand })}
                  className={`flex justify-between items-center bg-white rounded-md relative ${
                    element.children.length > 0 ? "cursor-pointer" : ""
                  } ${editable ? "px-4 py-2.5 my-2" : "px-3 py-1.5 my-1"}`}
                  style={{
                    marginLeft: 40 * (level - 1),
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                >
                  <div className="flex items-center gap-2">
                    {element.metadata?.type === "object" ? (
                      <Icon
                        isOpen={isExpanded}
                        OpenIcon={FolderOpen}
                        CloseIcon={Folder}
                      />
                    ) : element.metadata?.type === "array" &&
                      element.metadata.array === "document" ? (
                      <Icon
                        isOpen={isExpanded}
                        OpenIcon={FolderOpen}
                        CloseIcon={Folder}
                      />
                    ) : (
                      <Icon
                        isOpen={isExpanded}
                        OpenIcon={TextField}
                        CloseIcon={TextField}
                        className=" min-w-6"
                      />
                    )}
                    <span className="text-small">
                      {element.name}{" "}
                      <span className="text-xs">
                        {element.metadata?.type == "array"
                          ? element.metadata.array == "document"
                            ? "(doc)"
                            : "(list)" //"(str)"
                          : ""}
                      </span>
                    </span>
                  </div>
                  {publishable && publishData && (
                    <div>
                      {publishData.some((item) => item.id === element.id) ? (
                        element.metadata?.type != "object" &&
                        (element.metadata?.type == "array" ? (
                          element.metadata?.array == "string" ? (
                            <span className="flex gap-2">
                              <input
                                type="text"
                                className="bg-gray-lightest rounded-md px-2 py-0 text-md"
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  handleStringChange(
                                    element.id,
                                    e.target.value,
                                    "array"
                                  )
                                }
                              ></input>
                              <Button
                                type="button"
                                color="green"
                                icon={Plus}
                                iconPosition="center"
                                tableButton={true}
                                padding={false}
                                className="p-0.5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArrayPush(element.id);
                                  console.log(
                                    "store the input field value in element id as index 0 of array and reset the input field"
                                  );
                                }}
                              />
                            </span>
                          ) : (
                            <Button
                              type="button"
                              color="green"
                              icon={Plus}
                              iconPosition="center"
                              tableButton={true}
                              padding={false}
                              className="p-0.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArrayPushForDocument(element.id);
                                console.log(
                                  "store the input field values from all children of this element in element id as index 0 of array and reset the input fields of all children"
                                );
                              }}
                            />
                          )
                        ) : (
                          <input
                            type="text"
                            className="bg-gray-lightest rounded-md px-2 py-0 text-md"
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleStringChange(
                                element.id,
                                e.target.value,
                                "string"
                              )
                            }
                          ></input>
                        ))
                      ) : (
                        <>
                          {element.metadata?.type == "string" ? (
                            <div className="flex gap-1 items-center">
                              {element.metadata?.value}{" "}
                              <DeleteTrash
                                onClick={() => deleteChildOfStringList(element)}
                              />
                            </div> //TODO: delete for sure, maybe edit?
                          ) : element.metadata?.type === "array" ? (
                            // Render arrays by iterating over the array elements
                            <>
                              {Array.isArray(element.metadata.value) &&
                              element.metadata.value.length > 0 ? (
                                element.metadata.value.map(
                                  (arrayItem, index) => (
                                    <div
                                      key={index}
                                      style={{ marginLeft: "20px" }}
                                    >
                                      <span>
                                        {element.name}[{index}]:
                                      </span>
                                      {typeof arrayItem === "object" ? (
                                        <div>
                                          {Object.entries(arrayItem).map(
                                            ([key, value]) => (
                                              <div
                                                key={key}
                                                style={{ marginLeft: "20px" }}
                                              >
                                                <strong>{key}:</strong>{" "}
                                                {typeof value === "object"
                                                  ? JSON.stringify(value)
                                                  : value}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      ) : (
                                        <span>{arrayItem}</span>
                                      )}
                                    </div>
                                  )
                                )
                              ) : (
                                <div>No elements in the array</div>
                              )}
                            </>
                          ) : element.metadata?.type === "object" ? (
                            <div className="flex gap-2 items-center">
                              {/* {element.metadata?.value &&
                              Object.keys(element.metadata.value).length > 0 ? (
                                Object.entries(element.metadata.value).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      style={{ marginLeft: "20px" }}
                                    >
                                      <strong>{key}:</strong>{" "}
                                      {typeof value === "object"
                                        ? JSON.stringify(value)
                                        : value}
                                    </div>
                                  )
                                )
                              ) : (
                                <div>No properties in the object</div>
                              )} */}
                              {showDocumentList === element.id && (
                                <div
                                  className="animate-slide-in-bottom-left absolute bottom-[40px] right-0 bg-white p-2 rounded-lg shadow-md w-96 max-h-96 overflow-auto z-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <p className="flex justify-end">
                                    <X
                                      className="text-small cursor-pointer"
                                      onClick={() => setShowDocumentList(null)}
                                    />
                                  </p>
                                  <SchemeTree
                                    // eslint-disable-next-line react-hooks/rules-of-hooks
                                    treeData={useMemo(
                                      () =>
                                        parseObject(
                                          element.metadata?.value,
                                          element.name,
                                          0,
                                          1
                                        ),
                                      [element.metadata.value, element.name]
                                    )}
                                  />
                                </div>
                              )}
                              <DocumentList
                                className="cursor-pointer"
                                onClick={() => setShowDocumentList(previous => previous == element.id ? null : element.id)}
                              />
                              <DeleteTrash
                                className="cursor-pointer text-red"
                                onClick={() =>
                                  deleteChildOfDOcumentList(element)
                                }
                              />
                            </div>
                          ) : (
                            <div>Unsupported type</div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {editable && (
                    <div className="flex items-center gap-2">
                      {(element.metadata?.type === "object" ||
                        element.metadata?.array === "document") && (
                        <Button
                          type="button"
                          color="green"
                          icon={Plus}
                          iconPosition="center"
                          tableButton={true}
                          padding={false}
                          className="p-0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCreateParentId(Number(element.id));
                          }}
                        />
                      )}
                      {element.parent !== 0 && (
                        <>
                          <Button
                            type="button"
                            color="blue"
                            icon={EditPen}
                            iconPosition="center"
                            tableButton={true}
                            padding={false}
                            className="p-0.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleElementIdsToEdit(Number(element.id));
                            }}
                          />
                          <Button
                            type="button"
                            color="red"
                            icon={DeleteTrash}
                            iconPosition="center"
                            tableButton={true}
                            padding={false}
                            className="p-0.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNodeHandler(Number(element.id));
                            }}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    marginLeft: 40 * (level - 1),
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                >
                  <CreateNodeForm
                    closeForm={() =>
                      removeElementIdFromEdit(Number(element.id))
                    }
                    expandParent={() =>
                      handleExpandParent(element?.parent || "")
                    }
                    editTreeNode={editTreeNodeHandler}
                    nodeData={element}
                  />
                </div>
              )}
              {createParentId === element.id && (
                <div
                  style={{
                    marginLeft: 40 * level,
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                >
                  <CreateNodeForm
                    closeForm={() => setCreateParentId(null)}
                    createTreeNode={createTreeNodeHandler}
                    expandParent={() => handleExpandParent(element.id)}
                  />
                </div>
              )}
            </>
          );
        }}
      />
    </>
  );
};

export default SchemeTree;
