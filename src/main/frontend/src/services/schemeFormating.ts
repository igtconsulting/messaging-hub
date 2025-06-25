import { JSONTreeNode, TreeNode, TreeNodeMetadata, JsonSchema } from "../types";

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

  // Get children in the order specified by the parent's children array
  const parent = treeDataToConvert.find(el => el.id === parentId);
  const currentChildren = parent?.children
    ?.map(childId => treeDataToConvert.find(node => node.id === childId))
    .filter((node): node is TreeNode => node != null) ||
    treeDataToConvert.filter((el) => el.parent == parentId);

  // Process children in the correct order and build object with ordered keys
  const orderedEntries: Array<[string, JSONTreeNode]> = [];
  
  currentChildren.forEach((el) => {
    if (el.metadata.required == "yes") required.push(el.name);
    
    let nodeValue: JSONTreeNode;
    
    if (el.metadata.type === "object") {
      const parentData = handleChildrenRecursive(treeDataToConvert, el.id);
      nodeValue = {
        type: ["null", el.metadata.type],
        properties: parentData.jsonStructure,
        additionalProperties:
          el.metadata.additionalProperties == "yes" ? true : false,
        required: parentData.required,
      };
    } else if (el.metadata.type === "array") {
      if (el.metadata.array == "document") {
        const parentData = handleChildrenRecursive(treeDataToConvert, el.id);
        nodeValue = {
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
        nodeValue = {
          type: ["null", el.metadata.type],
          items: [{ type: "string" }],
        };
      }
    } else {
      nodeValue = {
        type: ["null", el.metadata.type],
      };
    }
    
    // Add to ordered entries instead of directly to object
    orderedEntries.push([el.name, nodeValue]);
  });

  // Create object from ordered entries to preserve insertion order
  const orderedJsonStructure = Object.fromEntries(orderedEntries);

  return { jsonStructure: orderedJsonStructure, required };
}

// output: Array structure of the schema without children filled with children
function fillChildren(objects: TreeNode[]): TreeNode[] {
  const idToChildrenMap: { [key: number]: number[] } = {};

  // Create a map from parent ID to an array of its children's IDs
  for (const object of objects) {
    const parentId = object.parent;
    if (parentId !== null) {
      if (!idToChildrenMap[parentId]) {
        idToChildrenMap[parentId] = [];
      }
      idToChildrenMap[parentId].push(object.id);
    }
  }

  // For each object, add its children's IDs to its children array
  for (const object of objects) {
    object.children = idToChildrenMap[object.id] || [];
  }

  return objects;
}

export const extractPathsFromSchema = (schema: JsonSchema, parentPath = ''): string[] => {
  const paths: string[] = [];

  if (!schema?.properties) return paths;

  for (const key in schema.properties) {
    const property = schema.properties[key];
    const currentPath = parentPath ? `${parentPath}/${key}` : key;

    if (
        (Array.isArray(property.type) ? property.type.includes('object') : property.type === 'object') &&
        property.properties
    ) {
      paths.push(...extractPathsFromSchema(property, currentPath));
    } else if (
        (Array.isArray(property.type) ? property.type.includes('array') : property.type === 'array') &&
        Array.isArray(property.items) &&
        property.items[0]?.type === 'object'
    ) {
      paths.push(...extractPathsFromSchema(property.items[0], currentPath));
    } else {
      paths.push(currentPath);
    }
  }

  return paths;
};

// Converting JSON string of the schema to Array structure. stal tam on
export function convertToArrayStructure(
  jsonStructure: Record<string, JSONTreeNode> | undefined,
  topicName: string
) {
  if (!jsonStructure) return []
  const arrayStructure: TreeNode[] = [];
  const arrayChildren: number[] = [];
  const rootId = 1;

  // Handle case where the structure has a single root object
  let actualStructure = jsonStructure;
  let rootMetadata: any = { type: "object", additionalProperties: "yes" };
  
  // Check if we have a single root object like {orderTest: {...}}
  // This should NOT match normal schema format {type: 'object', properties: {...}}
  const rootKeys = Object.keys(jsonStructure);
  const isNormalSchema = jsonStructure.hasOwnProperty('type') && jsonStructure.hasOwnProperty('properties');
  
  if (rootKeys.length === 1 && !isNormalSchema && jsonStructure[rootKeys[0]].properties) {
    const rootObject = jsonStructure[rootKeys[0]];
    actualStructure = rootObject.properties as Record<string, JSONTreeNode>;
    rootMetadata = {
      type: "object",
      additionalProperties: rootObject.additionalProperties ? "yes" : "no",
    };
  } else if (isNormalSchema) {
    // Normal schema format - use the properties directly
    actualStructure = jsonStructure.properties as unknown as Record<string, JSONTreeNode>;
    rootMetadata = {
      type: "object",
      additionalProperties: jsonStructure.additionalProperties ? "yes" : "no",
    };
  }

  arrayStructure.push({
    id: rootId,
    parent: 0,
    name: topicName,
    children: arrayChildren,
    metadata: rootMetadata,
  });

  // Converting JSON string of the schema to Array structure: helper recursive function
  function handleChildren(
    jsonNode: Record<string, JSONTreeNode>,
    required: string[],
    parentId: number
  ) {
    let availableId = parentId + 1;
    Object.entries(jsonNode).forEach(([key, value]) => {
      const jsonTreeNode = value as unknown as JSONTreeNode;
      const nodeType = Array.isArray(jsonTreeNode.type) ? jsonTreeNode.type[1] : jsonTreeNode.type;
      const metadata: TreeNodeMetadata = { type: nodeType };
      metadata["required"] = required
        ? required.find((el) => el == key)
          ? "yes"
          : "no"
        : "no";
      if (metadata.type == "array") {
        const items = jsonTreeNode.items as JSONTreeNode[];
        metadata["array"] =
          items?.[0]?.type == "string" ? "string" : "document";
      }
      if (jsonTreeNode.additionalProperties !== undefined)
        metadata["additionalProperties"] = jsonTreeNode.additionalProperties
          ? "yes"
          : "no";
      
      // Preserve values if they exist in the JSONTreeNode
      if ((jsonTreeNode as any).value !== undefined) {
        metadata["value"] = (jsonTreeNode as any).value;
      }
      
      arrayStructure.push({
        id: availableId,
        parent: parentId,
        name: key,
        children: [],
        metadata: metadata,
      });
      if (jsonTreeNode.properties)
        availableId = handleChildren(
          jsonTreeNode.properties,
          jsonTreeNode.required || [],
          availableId
        );
      if (metadata?.array == "document") {
        const items = jsonTreeNode.items as JSONTreeNode[];
        const firstItem = items?.[0];
        if (firstItem?.properties) {
          availableId = handleChildren(
            firstItem.properties,
            firstItem.required || [],
            availableId
          );
        }
      }
      availableId++;
    });

    return availableId;
  }
  if (actualStructure) {
    handleChildren(actualStructure as unknown as Record<string, JSONTreeNode>, [], rootId);
  }
  return fillChildren(arrayStructure);
}

export const formatSchemaForPublish = (schema: JSONTreeNode): unknown => {
  if (schema.type?.includes("object")) {
    // Handle objects by recursively formatting their properties
    const formattedObject: Record<string, unknown> = {};
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
    data: unknown,
    name: string,
    parentId: number,
    id: number
): TreeNode[] {
  const nodes: TreeNode[] = [];

  // Define the initial node for the current level
  const rootNode: TreeNode = {
    id,
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
      value: Array.isArray(data) ? [] : (typeof data === "object" ? data as Record<string, unknown> : data as string | number | boolean),
    },
  };
  nodes.push(rootNode);

  // Handle object (non-array)
  if (typeof data === "object" && !Array.isArray(data) && data !== null) {
    rootNode.metadata.additionalProperties = "yes";
    const dataObj = data as Record<string, unknown>;
    for (const key in dataObj) {
      if (key === "id") {
        // Mark this node as schema-generated id to skip later
        // We still create a node for it, but mark specially:
        const childId = Math.floor(Math.random() * 100000);
        const childNode: TreeNode = {
          id: childId,
          parent: rootNode.id,
          name: key,
          children: [],
          metadata: {
            type: typeof dataObj[key],
            value: dataObj[key] as string | number | boolean | null,
            isGeneratedId: true,  // mark as internal id
            originalKey: key,
          },
        };
        nodes.push(childNode);
        rootNode.children.push(childId);
        continue;
      }

      const childId = Math.floor(Math.random() * 100000);

      const value = dataObj[key];
      const isPrimitive =
          value === null || ["string", "number", "boolean"].includes(typeof value);

      // Show variable name AND its primitive value (if primitive)
      const childName = isPrimitive ? `${key}: ${value}` : key;

      const childNodes = parseObject(value, childName, rootNode.id, childId);

      nodes.push(...childNodes);
      rootNode.children.push(childId);
    }
  }
  // Handle array
  else if (Array.isArray(data)) {
    rootNode.metadata.array = data.length > 0 ? typeof data[0] : "unknown";
    data.forEach((item, index) => {
      const childId = Math.floor(Math.random() * 100000);

      const isPrimitive =
          item === null || ["string", "number", "boolean"].includes(typeof item);

      const childName = isPrimitive
          ? `${name}[${index}]: ${item}`
          : `${name}[${index}]`;

      const childNodes = parseObject(item, childName, rootNode.id, childId);

      nodes.push(...childNodes);
      rootNode.children.push(childId);
    });
  }

  // Handle primitives (string, number, boolean, etc.)
  else {
    rootNode.metadata.value = data as string | number | boolean | null;
  }

  return nodes;
}




