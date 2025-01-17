import { useEffect, useRef, useState } from "react";
import { JSONTreeNode, TreeNode } from "../../../types";
import SchemeTree from "./SchemeTree";
import { convertToArrayStructure, convertTreeDataWithDefaultValues } from "../../../services/schemeFormating";
import Loading from "../../General/Loading";
import DataConfirm from "../../General/DataConfirm";
import { defaultKafkaScheme } from "./variables";

const Scheme = ({
  topicName,
  editable = false,
  publishable = false,
  data,
  onChange,
  isDefaultKafkaSchema,
  onChangePublish,
}: {
  topicName: string;
  editable?: boolean;
  publishable?: boolean;
  data?: Record<string, JSONTreeNode>;
  onChange?: (treeData: TreeNode[]) => void;
  isDefaultKafkaSchema?: boolean;
  onChangePublish?: (newPublishData?: TreeNode[]) => void;
  publishData?: Record<string, JSONTreeNode>;
}) => {
  function isDataEmpty(data?: Record<string, JSONTreeNode>): boolean {
    if (!data) {
      return true;
    }
    return Object.keys(data).length === 0;
  }
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [confirmProps, setConfirmProps] = useState({
    show: false,
    title: "",
    description: "",
    confirmAction: () => {},
    buttonColor: "red",
  });
  const dataInitialized = useRef(false);
  // const [ publishData, setPublishData ] = useState({})
  const [publishDataArray, setPublishDataArray] = useState<TreeNode[]>([]);

  useEffect(() => {
    if (!dataInitialized.current) {
      const convertedData = !isDataEmpty(data)
        ? convertToArrayStructure(data!, topicName)
        : [
            {
              name: topicName,
              id: 1,
              parent: 0,
              metadata: { type: "object" },
              children: treeData
                .filter((el) => el.parent === 1)
                .map((el) => el.id),
            },
          ];
      setTreeData(convertedData);
      // Convert publishData to array structure as well
      const convertedPublishData = convertTreeDataWithDefaultValues(convertedData);
      setPublishDataArray(convertedPublishData);
      dataInitialized.current = true;
    }

    if (isDefaultKafkaSchema) {
      const convertedData = convertToArrayStructure(
        JSON.parse(defaultKafkaScheme),
        topicName
      );
      setTreeData(convertedData);
    }
  }, [data, topicName, isDefaultKafkaSchema]);

  // console.log(treeData)
  // console.log(publishDataArray)

  useEffect(() => {
    onChange && onChange(treeData);
  }, [treeData, onChange]);

  useEffect(() => {
    setTreeData((prevTreeData) => {
      if (prevTreeData.length > 0) {
        return prevTreeData.map((node, index) => {
          if (index === 0) {
            return { ...node, name: topicName };
          }
          return node;
        });
      }
      return prevTreeData;
    });
  }, [topicName]);

  const addToTreeHandler = (treeNode: TreeNode) => {
    setTreeData((previous) => {
      const updatedTreeData = previous.map((el) => {
        return el.id == treeNode.parent
          ? { ...el, children: [...el.children, treeNode.id] }
          : el;
      });
      return [...updatedTreeData, treeNode];
    });
  };

  const deleteNodeHandler = (idToRemove: number) => {
    // Helper function to get all descendant IDs
    const getDescendantIds = (nodeId: number, nodes: TreeNode[]): number[] => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return [];
      let descendantIds = [nodeId];
      node.children.forEach((childId) => {
        descendantIds = descendantIds.concat(getDescendantIds(childId, nodes));
      });
      return descendantIds;
    };

    const nodeToDelete = treeData.find((node) => node.id === idToRemove);
    if ((nodeToDelete?.children ?? []).length > 0) {
      // If node has children, show confirmation modal
      setConfirmProps({
        show: true,
        title: "Confirm Deletion",
        description:
          "This node has children. Are you sure you want to delete it?",
        confirmAction: () => {
          // Get all IDs to remove (the node itself and all its descendants)
          const idsToRemove = getDescendantIds(idToRemove, treeData);
          // Create a new filtered tree excluding the nodes to remove
          const newTree = treeData.filter(
            (node) => !idsToRemove.includes(node.id)
          );
          // Update the children arrays of the remaining nodes
          const updatedTreeData = newTree.map((node) => ({
            ...node,
            children: node.children.filter(
              (childId) => !idsToRemove.includes(childId)
            ),
          }));
          setTreeData(updatedTreeData);
          setConfirmProps((prevProps) => ({ ...prevProps, show: false }));
        },
        buttonColor: "red",
      });
    } else {
      // If node has no children, delete directly
      const idsToRemove = getDescendantIds(idToRemove, treeData);
      const newTree = treeData.filter((node) => !idsToRemove.includes(node.id));
      const updatedTreeData = newTree.map((node) => ({
        ...node,
        children: node.children.filter(
          (childId) => !idsToRemove.includes(childId)
        ),
      }));
      setTreeData(updatedTreeData);
    }
  };

  const editNodeHandler = (updatedNode: TreeNode) => {
    setTreeData((previous) => {
      return previous.map((node) => {
        if (node.id === updatedNode.id) {
          return updatedNode; // Replace with updated node
        }
        return node;
      });
    });
  };

  // console.log(data)
  // console.log(treeData)
  // console.log(updatedTreeData)

  return (
    <div className="px-6 py-3 bg-primary rounded-md shadow-md">
      {treeData.length > 0 ? (
        <>
          <SchemeTree
            editable={editable}
            publishable={publishable}
            treeData={treeData}
            publishData={publishDataArray}
            addToTree={addToTreeHandler}
            deleteNode={deleteNodeHandler}
            editNode={editNodeHandler}
            onChangeLocalPublishData={onChangePublish}
          />
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
      ) : (
        <Loading />
      )}
    </div>
  );
};

export default Scheme;
