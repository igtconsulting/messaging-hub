import { json } from "react-router-dom";
import { JSONTreeNode, TreeNode, TreeNodeMetadata } from "../types";

// Converting Array structure of the schema to JSON string
export function convertToJsonStructure(treeDataToConvert: TreeNode[]) {
  const rootData = handleChildrenRecursive(treeDataToConvert, 1);
  return {
    type: "object",
    properties: rootData.jsonStructure,
    additionalProperties: true,
    required: rootData.required,
  };
}

// Converting Array structure of the schema to JSON string: helper recursive function
function handleChildrenRecursive(
  treeDataToConvert: TreeNode[],
  parentId: number
): { jsonStructure: Record<string, JSONTreeNode>; required: string[] } {
  const jsonStructure: Record<string, JSONTreeNode> = {};
  const required: string[] = [];

  const currentChildren = treeDataToConvert.filter(
    (el) => el.parent == parentId
  );

  currentChildren.forEach((el) => {
    if (el.metadata.required == "yes") required.push(el.name);
    if (el.metadata.type === "object") {
      const parentData = handleChildrenRecursive(treeDataToConvert, el.id);
      jsonStructure[el.name] = {
        type: ["null", el.metadata.type],
        properties: parentData.jsonStructure,
        additionalProperties:
          el.metadata.additionalProperties == "yes" ? true : false,
        required: parentData.required,
      };
    } else if (el.metadata.type === "array") {
      if (el.metadata.array == "document") {
        const parentData = handleChildrenRecursive(treeDataToConvert, el.id);
        jsonStructure[el.name] = {
          type: ["null", el.metadata.type],
          items: [
            {
              type: "object",
              properties: parentData.jsonStructure,
              additionalProperties: false,
              required: parentData.required,
            },
          ],
        };
      } else {
        jsonStructure[el.name] = {
          type: ["null", el.metadata.type],
          items: [{ type: "string" }],
        };
      }
    } else {
      jsonStructure[el.name] = {
        type: ["null", el.metadata.type],
      };
    }
  });

  return { jsonStructure, required };
}

// output: Array structure of the schema without children filled with children
function fillChildren(objects: TreeNode[]): TreeNode[] {
  const idToChildrenMap: { [key: number]: number[] } = {};

  // Create a map from parent ID to an array of its children's IDs
  for (const object of objects) {
    if (!idToChildrenMap[object.parent]) {
      idToChildrenMap[object.parent] = [];
    }

    idToChildrenMap[object.parent].push(object.id);
  }

  // For each object, add its children's IDs to its children array
  for (const object of objects) {
    object.children = idToChildrenMap[object.id] || [];
  }

  return objects;
}

// Converting JSON string of the schema to Array structure. stal tam on
export function convertToArrayStructure(
  jsonStructure: Record<string, JSONTreeNode> | undefined,
  topicName: string
) {
  if (!jsonStructure) return []
  const arrayStructure: TreeNode[] = [];
  const arrayChildren: number[] = [];
  const rootId = 1;

  arrayStructure.push({
    id: rootId,
    parent: 0,
    name: topicName,
    children: arrayChildren,
    metadata: {
      type: "object",
      additionalProperties: jsonStructure.additionalProperties ? "yes" : "no",
    },
  });

  // Converting JSON string of the schema to Array structure: helper recursive function
  function handleChildren(
    jsonNode: JSONTreeNode,
    required: string[],
    parentId: number
  ) {
    let availableId = parentId + 1;
    Object.entries(jsonNode).forEach(([key, value]) => {
      const metadata: TreeNodeMetadata = { type: value?.type[1] };
      metadata["required"] = required
        ? required.find((el) => el == key)
          ? "yes"
          : "no"
        : "no";
      if (metadata.type == "array") {
        metadata["array"] =
          value?.items[0].type == "string" ? "string" : "document";
      }
      if (value?.additionalProperties)
        metadata["additionalProperties"] = value.additionalProperties
          ? "yes"
          : "no";
      arrayStructure.push({
        id: availableId,
        parent: parentId,
        name: key,
        children: [],
        metadata: metadata,
      });
      if (value?.properties)
        availableId = handleChildren(
          value?.properties,
          value?.required,
          availableId
        );
      if (metadata?.array == "document") {
        availableId = handleChildren(
          value?.items[0].properties,
          value?.items[0].required,
          availableId
        );
      }
      availableId++;
    });

    return availableId;
  }
  handleChildren(jsonStructure.properties, jsonStructure.required, rootId);
  return fillChildren(arrayStructure);
}

export const formatSchemaForPublish = (schema: JSONTreeNode): any => {
  if (schema.type?.includes("object")) {
    // Handle objects by recursively formatting their properties
    const formattedObject: any = {};
    if (schema.properties) {
      for (const key in schema.properties) {
        formattedObject[key] = formatSchemaForPublish(schema.properties[key]);
      }
    }
    return formattedObject;
  } else if (schema.type?.includes("array")) {
    // Handle arrays by returning an empty array
    return [];
  } else if (schema.type?.includes("string")) {
    // Handle strings by returning an empty string
    return "";
  } else {
    return null; // Default for other types
  }
};

export function convertTreeDataWithDefaultValues(treeData: TreeNode[]): TreeNode[] {
  // Clone each node and add the correct default value based on the type
  return treeData.map((node) => {
    let defaultValue;

    // Assign default value based on type
    if (node.metadata.type === "string") {
      defaultValue = ""; // Empty string for 'string' type
    } else if (node.metadata.type === "object") {
      defaultValue = {}; // Empty object for 'object' type
    } else if (node.metadata.type === "array") {
      defaultValue = []; // Empty array for 'array' type
    } else {
      defaultValue = null; // Default to null for unknown types
    }

    const updatedNode = {
      ...node,
      metadata: {
        ...node.metadata,
        value: defaultValue, // Add appropriate value based on type
      },
    };

    return updatedNode;
  });
}

export function parseObject(
  data: any,
  name: string,
  parentId: number,
  id: number
): TreeNode[] {
  const nodes: TreeNode[] = [];

  // Define the initial node for the current level
  const rootNode: TreeNode = {
    id: id,
    parent: parentId,
    name,
    children: [],
    metadata: {
      type:
        typeof data === "object"
          ? Array.isArray(data)
            ? "array"
            : "object"
          : typeof data,
      value: Array.isArray(data) ? [] : {},
    },
  };
  nodes.push(rootNode);

  // Process child nodes based on data type
  if (typeof data === "object" && !Array.isArray(data)) {
    rootNode.metadata.additionalProperties = "yes";
    for (const key in data) {
      const childId = Math.floor(Math.random() * 100000); // Generate unique ID for the child node

      // If the child is a string, use the string value itself as the name
      const childName = typeof data[key] === "string" ? data[key] : key;

      const childNodes = parseObject(
        data[key],
        childName,
        rootNode.id,
        childId
      );

      // Add only the direct child ID to the root node's children array
      rootNode.children.push(childId);
      nodes.push(...childNodes);
    }
  } else if (Array.isArray(data)) {
    rootNode.metadata.array = typeof data[0];
    data.forEach((item, index) => {
      const childId = Math.floor(Math.random() * 100000); // Generate unique ID for each array item

      // If the item is a string, use the item value itself as the name
      const childName = typeof item === "string" ? item : `${name}[${index}]`;

      const childNodes = parseObject(item, childName, rootNode.id, childId);

      // Add only the direct child ID to the root node's children array
      rootNode.children.push(childId);
      nodes.push(...childNodes);
    });
  } else {
    // If it's a primitive type, directly assign its value to metadata
    rootNode.metadata.value = data;
  }

  return nodes;
}
