import React, { useState, useEffect, useCallback } from "react";
import { TreeNode, TreeNodeMetadata } from "../../../types";
import { Folder } from "../../../assets/icons/Folder";
import { FolderOpen } from "../../../assets/icons/FolderOpen";
import { TextField } from "../../../assets/icons/TextField";
import { DocumentList } from "../../../assets/icons/DocumentList";
import { Plus } from "../../../assets/icons/Plus";
import { EditPen } from "../../../assets/icons/EditPen";
import { DeleteTrash } from "../../../assets/icons/DeleteTrash";
import { X } from "../../../assets/icons/X";
import Button from "../../General/Button";
import CreateNodeForm from "./Form/CreateNodeForm";
import { parseObject } from "../../../services/schemeFormating";

interface SchemeTreeProps {
  editable?: boolean;
  publishable?: boolean;
  treeData: TreeNode[];
  publishData?: TreeNode[];
  addToTree?: (treeNode: TreeNode, required: string) => void;
  deleteNode?: (id: number) => void;
  editNode?: (updatedNode: TreeNode) => void;
  onChangeLocalPublishData?: (newPublishData?: TreeNode[]) => void;
}

const SchemeTree: React.FC<SchemeTreeProps> = ({
  editable,
  publishable,
  treeData,
  publishData,
  addToTree,
  deleteNode,
  editNode,
  onChangeLocalPublishData,
}) => {
  // State management
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [editingNode, setEditingNode] = useState<number | null>(null);
  const [creatingChildFor, setCreatingChildFor] = useState<number | null>(null);
  const [localPublishData, setLocalPublishData] = useState<TreeNode[]>(publishData || []);
  const [inputValues, setInputValues] = useState<Record<number, string>>({});
  const [arrayInputs, setArrayInputs] = useState<Record<number, string>>({});
  const [showDocumentPreview, setShowDocumentPreview] = useState<number | null>(null);

  // Auto-expand all nodes when tree loads
  useEffect(() => {
    const currentData = publishable ? localPublishData : treeData;
    const allNodeIds = new Set<number>();
    
    // Collect all node IDs recursively
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        allNodeIds.add(node.id);
        const children = nodes.filter(n => n.parent === node.id);
        if (children.length > 0) {
          collectIds(children);
        }
      });
    };
    
    collectIds(currentData);
    setExpandedNodes(allNodeIds);
  }, [treeData, publishable]);

  // Update local publish data
  useEffect(() => {
    if (onChangeLocalPublishData) {
      onChangeLocalPublishData(localPublishData);
    }
  }, [localPublishData, onChangeLocalPublishData]);

  // Initialize input values
  useEffect(() => {
    if (localPublishData.length > 0) {
      const newInputValues: Record<number, string> = {};
      localPublishData.forEach(node => {
        if (node.metadata.type === "string" && node.metadata.value !== undefined) {
          newInputValues[node.id] = String(node.metadata.value);
        }
      });
      setInputValues(newInputValues);
    }
  }, [localPublishData]);

  // Helper functions
  const toggleExpansion = (nodeId: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const getRootNodes = (data: TreeNode[]) => {
    return data.filter(node => !node.parent || node.parent === 0);
  };

  const getChildren = (parentId: number, data: TreeNode[]) => {
    return data.filter(node => node.parent === parentId);
  };

  const updateInputValue = (nodeId: number, value: string) => {
    setInputValues(prev => ({ ...prev, [nodeId]: value }));
    
    // Only auto-save for non-array string fields
    // Array items should be saved manually to avoid duplicates
    const currentData = publishable ? localPublishData : treeData;
    const node = currentData.find(n => n.id === nodeId);
    const parent = node?.parent ? currentData.find(n => n.id === node.parent) : null;
    const isArrayItem = parent?.metadata.type === "array";
    
    if (!isArrayItem) {
      // Auto-save for regular string fields
      saveInputValue(nodeId, value);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent, nodeId: number) => {
    if (e.key === 'Enter') {
      const value = inputValues[nodeId] || '';
      saveInputValue(nodeId, value);
    }
  };

  const handleInputBlur = (nodeId: number) => {
    // Save array items on blur (when user clicks outside)
    const currentData = publishable ? localPublishData : treeData;
    const node = currentData.find(n => n.id === nodeId);
    const parent = node?.parent ? currentData.find(n => n.id === node.parent) : null;
    const isArrayItem = parent?.metadata.type === "array";
    
    if (isArrayItem) {
      const value = inputValues[nodeId] || '';
      saveInputValue(nodeId, value);
    }
  };

  const saveInputValue = (nodeId: number, valueOverride?: string) => {
    const value = valueOverride || inputValues[nodeId];
    if (!value) return;

    setLocalPublishData(prev => {
      const updated = [...prev];
      const node = updated.find(n => n.id === nodeId);
      if (node) {
        node.metadata.value = value;
        
        // Update parent array if this is an array item
        const parent = updated.find(n => n.id === node.parent);
        if (parent && parent.metadata.type === "array" && parent.metadata.array === "string") {
          // Update the node name
          const index = parseInt(node.metadata.originalKey || "0");
          node.name = `${parent.name}[${index}]: "${value}"`;
          
          // Rebuild parent array from all child nodes, including replica ones
          const allStringChildren = updated
            .filter(n =>
              n.parent === parent.id &&
              n.metadata.type === "string" &&
              n.metadata.originalKey !== undefined
            )
            .sort((a, b) => parseInt(a.metadata.originalKey || "0") - parseInt(b.metadata.originalKey || "0"));
          
          parent.metadata.value = allStringChildren
            .map(child => child.metadata.value)
            .filter(val => val !== undefined && val !== "");
          
          // Check if this string array is inside a document object (document array entry)
          const grandparent = updated.find(n => n.id === parent.parent);
          if (grandparent && grandparent.metadata.type === "object" && grandparent.metadata.replicaOf) {
            // Update the document object's value
            if (!grandparent.metadata.value || typeof grandparent.metadata.value !== "object" || Array.isArray(grandparent.metadata.value)) {
              grandparent.metadata.value = {};
            }
            (grandparent.metadata.value as Record<string, any>)[parent.name] = parent.metadata.value;
            
            // Don't cascade further up - let the collection handle the final document array rebuild
          }
        }
        // Handle updates to fields within document objects (document array entries)
        else if (parent && parent.metadata.type === "object" && parent.metadata.replicaOf) {
          // This is a field within a document array entry
          // Update the parent document's value object
          if (!parent.metadata.value || typeof parent.metadata.value !== "object" || Array.isArray(parent.metadata.value)) {
            parent.metadata.value = {};
          }
          (parent.metadata.value as Record<string, any>)[node.name] = value;
          
          // Also update the grandparent document array
          const grandparent = updated.find(n => n.id === parent.parent);
          if (grandparent && grandparent.metadata.type === "array" && grandparent.metadata.array === "document") {
            // Rebuild the grandparent array from all document children
            const allDocumentChildren = updated
              .filter(n => n.parent === grandparent.id && n.metadata.replicaOf === grandparent.id)
              .sort((a, b) => {
                const aMatch = a.name.match(/\[(\d+)\]/);
                const bMatch = b.name.match(/\[(\d+)\]/);
                const aIndex = aMatch ? parseInt(aMatch[1]) : 0;
                const bIndex = bMatch ? parseInt(bMatch[1]) : 0;
                return aIndex - bIndex;
              });
            
            grandparent.metadata.value = allDocumentChildren.map(docChild => docChild.metadata.value || {});
          }
        }
      }
      return updated;
    });
  };

  const addToStringArray = (parentId: number) => {
    const value = arrayInputs[parentId]?.trim();
    if (!value) return;

    setLocalPublishData(prev => {
      const updated = [...prev];
      const parent = updated.find(n => n.id === parentId);
      if (!parent) return prev;

      if (!Array.isArray(parent.metadata.value)) {
        parent.metadata.value = [];
      }

      // Calculate correct index based on existing array items in THIS specific array only
      const existingStringItems = updated.filter(n =>
        n.parent === parentId &&
        n.metadata.type === "string" &&
        n.metadata.originalKey !== undefined
      );
      const currentArrayLength = existingStringItems.length;
      
      // Check if this string array is inside a document entry
      const documentParent = updated.find(n => n.id === parent.parent);
      const isInDocumentEntry = documentParent && documentParent.metadata.type === "object" && documentParent.metadata.replicaOf;
      
      const newNode: TreeNode = {
        id: Date.now() + Math.random(),
        parent: parentId,
        name: `${parent.name}[${currentArrayLength}]: "${value}"`,
        children: [],
        metadata: {
          type: "string",
          value: value,
          originalKey: String(currentArrayLength),
          ...(isInDocumentEntry ? { replicaOf: documentParent.metadata.replicaOf } : {})
        }
      };

      updated.push(newNode);
      parent.children.push(newNode.id);

      // Rebuild parent array from all child nodes to ensure consistency (include replica items)
      const allStringChildren = updated
        .filter(n =>
          n.parent === parentId &&
          n.metadata.type === "string" &&
          n.metadata.originalKey !== undefined
        )
        .sort((a, b) => parseInt(a.metadata.originalKey || "0") - parseInt(b.metadata.originalKey || "0"));
      
      parent.metadata.value = allStringChildren
        .map(child => child.metadata.value)
        .filter(val => val !== undefined && val !== "");
      
      // If this string array is inside a document entry, update the document object too
      if (isInDocumentEntry && documentParent) {
        if (!documentParent.metadata.value || typeof documentParent.metadata.value !== "object" || Array.isArray(documentParent.metadata.value)) {
          documentParent.metadata.value = {};
        }
        (documentParent.metadata.value as Record<string, any>)[parent.name] = parent.metadata.value;
      }

      // Auto-expand parent
      setExpandedNodes(prev => new Set([...prev, parentId, newNode.id]));

      return updated;
    });

    setArrayInputs(prev => ({ ...prev, [parentId]: "" }));
  };

  const addToDocumentArray = (parentId: number) => {
    setLocalPublishData(prev => {
      const updated = [...prev];
      const parent = updated.find(n => n.id === parentId);
      if (!parent) return prev;

      if (!Array.isArray(parent.metadata.value)) {
        parent.metadata.value = [];
      }

      // Get existing document entries to see what data we should preserve
      const currentDocuments = updated.filter(n => n.parent === parentId && n.metadata.replicaOf === parentId);
      
      // If we have existing documents, use the last one as a base for current values
      let existingData: Record<string, any> = {};
      if (currentDocuments.length > 0) {
        const lastDocument = currentDocuments[currentDocuments.length - 1];
        if (lastDocument.metadata.value && typeof lastDocument.metadata.value === "object") {
          existingData = { ...(lastDocument.metadata.value as Record<string, any>) };
        }
      }
      
      // Collect values from ALL children of the parent (the template fields)
      const children = updated.filter(n => n.parent === parentId && !n.metadata.replicaOf);
      const documentObject: Record<string, any> = {};
      let hasValues = false;

      const collectNodeData = (node: TreeNode, isInDocumentEntry = false): any => {
        if (node.metadata.type === "string") {
          const value = inputValues[node.id]?.trim() || "";
          if (value) hasValues = true;
          return value;
        } else if (node.metadata.type === "array") {
          // Collect array data from children
          if (node.metadata.array === "string") {
            // Look for document entry version of this array node first
            const documentEntryArrayNode = updated.find(n =>
              n.name === node.name &&
              n.metadata.type === "array" &&
              n.metadata.array === "string" &&
              n.metadata.replicaOf === parentId &&
              Array.isArray(n.metadata.value) &&
              n.metadata.value.length > 0
            );
            
            if (documentEntryArrayNode && Array.isArray(documentEntryArrayNode.metadata.value)) {
              const values = (documentEntryArrayNode.metadata.value as any[]).filter((val: any) =>
                val !== undefined && val !== "" && typeof val === "string"
              );
              if (values.length > 0) hasValues = true;
              return values;
            }
            
            // Try to use the array's own metadata.value first (which should be maintained by saveInputValue)
            if (Array.isArray(node.metadata.value) && node.metadata.value.length > 0) {
              const values = node.metadata.value.filter(val =>
                val !== undefined && val !== "" && typeof val === "string"
              );
              if (values.length > 0) hasValues = true;
              return values;
            }
            
            // Fallback: collect from child nodes
            const stringChildren = updated.filter(n =>
              n.parent === node.id &&
              n.metadata.type === "string"
            );
            
            const values = stringChildren
              .sort((a, b) => parseInt(a.metadata.originalKey || "0") - parseInt(b.metadata.originalKey || "0"))
              .map(child => child.metadata.value)
              .filter(val => val !== undefined && val !== "" && typeof val === "string");
            if (values.length > 0) hasValues = true;
            return values;
          } else if (node.metadata.array === "document") {
            // Document array - collect from replica children
            const replicaChildren = updated.filter(n => n.parent === node.id && n.metadata.replicaOf);
            return replicaChildren.map(replica => replica.metadata.value || {});
          }
          return [];
        } else if (node.metadata.type === "object") {
          // Collect object data from children
          const objChildren = updated.filter(n => n.parent === node.id && !n.metadata.replicaOf);
          const obj: Record<string, any> = {};
          objChildren.forEach(objChild => {
            obj[objChild.name] = collectNodeData(objChild, isInDocumentEntry);
          });
          return obj;
        }
        return "";
      };

      // First pass: collect all data and check for meaningful values
      const allFieldData: Record<string, any> = {};
      children.forEach(child => {
        const collectedData = collectNodeData(child);
        allFieldData[child.name] = collectedData;
        
        // Check if we have meaningful data for hasValues check
        if (child.metadata.type === "string" && collectedData) {
          hasValues = true;
        } else if (child.metadata.type === "array" && Array.isArray(collectedData) && collectedData.length > 0) {
          hasValues = true;
        } else if (child.metadata.type === "object" && typeof collectedData === "object" && Object.keys(collectedData).length > 0) {
          hasValues = true;
        }
      });

      // Second pass: build documentObject for storage (excluding empty non-required fields)
      children.forEach(child => {
        const collectedData = allFieldData[child.name];
        
        // Use existing data as fallback for arrays that might have been lost
        let finalData = collectedData;
        if (child.metadata.type === "array" && (!Array.isArray(collectedData) || collectedData.length === 0)) {
          if (existingData[child.name] && Array.isArray(existingData[child.name]) && existingData[child.name].length > 0) {
            finalData = existingData[child.name];
            hasValues = true;
          }
        }
        
        const isRequired = child.metadata.required === "yes";
        const hasData = child.metadata.type === "string"
          ? finalData && finalData.trim !== undefined && finalData.trim() !== ""
          : child.metadata.type === "array"
            ? Array.isArray(finalData) && finalData.length > 0
            : child.metadata.type === "object"
              ? typeof finalData === "object" && Object.keys(finalData).length > 0
              : !!finalData;
        
        if (isRequired || hasData) {
          documentObject[child.name] = finalData;
        }
      });
      
      // Third pass: create complete field data for UI nodes (include ALL template fields)
      const completeFieldData: Record<string, any> = {};
      children.forEach(child => {
        const actualData = allFieldData[child.name];
        // Always include the field, but preserve actual data if it exists
        if (actualData !== undefined && actualData !== null) {
          completeFieldData[child.name] = actualData;
        } else {
          // Only provide defaults for truly empty fields
          completeFieldData[child.name] = child.metadata.type === "array" ? [] : "";
        }
      });

      if (!hasValues) return prev; // Don't add empty documents

      // Calculate correct index - use existing array items count
      const existingDocuments = updated.filter(n =>
        n.parent === parentId &&
        n.metadata.replicaOf === parentId
      );
      const currentArrayLength = existingDocuments.length;

      // Create new document node
      const newDocumentNode: TreeNode = {
        id: Date.now() + Math.random(),
        parent: parentId,
        name: `${parent.name}[${currentArrayLength}]`,
        children: [],
        metadata: {
          type: "object",
          value: documentObject,
          replicaOf: parentId
        }
      };

      // Create child nodes for the document properties with proper structure
      const childNodes: TreeNode[] = [];
      
      const createChildNodesRecursively = (parentNodeId: number, data: Record<string, any>, originalTemplateParentId: number): TreeNode[] => {
        const nodes: TreeNode[] = [];
        
        Object.entries(data).forEach(([key, value]) => {
          const childId = Date.now() + Math.random() + Math.random();
          
          // Find the original template node to get the correct type
          const originalTemplate = updated.find(n =>
            n.parent === originalTemplateParentId &&
            n.name === key &&
            !n.metadata.replicaOf
          );
          
          let childNode: TreeNode;
          
          if (originalTemplate?.metadata.type === "array") {
            // Create array node
            childNode = {
              id: childId,
              parent: parentNodeId,
              name: key,
              children: [],
              metadata: {
                type: "array",
                array: originalTemplate.metadata.array,
                value: Array.isArray(value) ? value : [],
                replicaOf: parentId
              }
            };
            
            // Create array item children if it's a string array
            if (originalTemplate.metadata.array === "string" && Array.isArray(value) && value.length > 0) {
              value.forEach((item, index) => {
                if (item !== undefined && item !== "") {
                  const arrayItemId = Date.now() + Math.random() + Math.random() + index * 1000;
                  const arrayItemNode: TreeNode = {
                    id: arrayItemId,
                    parent: childId,
                    name: `${key}[${index}]: "${item}"`,
                    children: [],
                    metadata: {
                      type: "string",
                      value: item,
                      replicaOf: parentId,
                      originalKey: String(index)
                    }
                  };
                  nodes.push(arrayItemNode);
                  childNode.children.push(arrayItemId);
                }
              });
            }
          } else if (originalTemplate?.metadata.type === "object") {
            // Create object node
            childNode = {
              id: childId,
              parent: parentNodeId,
              name: key,
              children: [],
              metadata: {
                type: "object",
                value: value,
                replicaOf: parentId
              }
            };
            
            // Create object children recursively
            if (typeof value === "object" && value !== null) {
              const objectChildren = createChildNodesRecursively(childId, value, originalTemplate.id);
              nodes.push(...objectChildren);
              childNode.children = objectChildren
                .filter(child => child.parent === childId)
                .map(child => child.id);
            }
          } else {
            // Create string node
            childNode = {
              id: childId,
              parent: parentNodeId,
              name: key,
              children: [],
              metadata: {
                type: "string",
                value: value,
                replicaOf: parentId
              }
            };
          }
          
          nodes.push(childNode);
        });
        
        return nodes;
      };
      
      const allChildNodes = createChildNodesRecursively(newDocumentNode.id, completeFieldData, parentId);
      childNodes.push(...allChildNodes);
      
      // Set direct children
      newDocumentNode.children = allChildNodes
        .filter(child => child.parent === newDocumentNode.id)
        .map(child => child.id);

      // Add all nodes to the updated data
      updated.push(newDocumentNode);
      updated.push(...allChildNodes);
      parent.children.push(newDocumentNode.id);

      // Rebuild parent array from all existing document children to ensure consistency
      const allDocumentChildren = updated
        .filter(n => n.parent === parentId && n.metadata.replicaOf === parentId)
        .sort((a, b) => {
          // Sort by the index in the node name [0], [1], etc.
          const aMatch = a.name.match(/\[(\d+)\]/);
          const bMatch = b.name.match(/\[(\d+)\]/);
          const aIndex = aMatch ? parseInt(aMatch[1]) : 0;
          const bIndex = bMatch ? parseInt(bMatch[1]) : 0;
          return aIndex - bIndex;
        });
      
      parent.metadata.value = allDocumentChildren.map(docChild => docChild.metadata.value || {});

      // Auto-expand parent only, keep newly added document collapsed for cleaner view
      setExpandedNodes(prev => new Set([...prev, parentId]));

      return updated;
    });

    // Clear input values and reset arrays/objects for template fields AFTER state update
    setLocalPublishData(prev => {
      let updated = [...prev];
      const children = updated.filter(n => n.parent === parentId && !n.metadata.replicaOf);
      
      const clearNodeRecursively = (node: TreeNode) => {
        if (node.metadata.type === "string") {
          // String inputs are cleared via setInputValues below
          node.metadata.value = "";
        } else if (node.metadata.type === "array") {
          // Clear array data completely
          node.metadata.value = [];
          
          // Remove ALL children from the array (both template and non-template)
          const arrayChildren = updated.filter(n => n.parent === node.id);
          arrayChildren.forEach(child => {
            // Remove this child and all its descendants
            const removeNodeAndChildren = (nodeId: number) => {
              const childrenToRemove = updated.filter(n => n.parent === nodeId);
              childrenToRemove.forEach(childNode => removeNodeAndChildren(childNode.id));
              updated = updated.filter(n => n.id !== nodeId);
            };
            removeNodeAndChildren(child.id);
          });
          
          // Clear children array
          node.children = [];
        } else if (node.metadata.type === "object") {
          // Clear object value
          node.metadata.value = {};
          
          // Clear object children recursively
          const objChildren = updated.filter(n => n.parent === node.id && !n.metadata.replicaOf);
          objChildren.forEach(objChild => clearNodeRecursively(objChild));
        }
      };

      children.forEach(child => clearNodeRecursively(child));
      return updated;
    });

    // Clear input values for string fields
    setInputValues(prev => {
      const clearedInputs = { ...prev };
      const currentData = publishable ? localPublishData : treeData;
      
      const clearInputsRecursively = (nodeId: number) => {
        const node = currentData.find(n => n.id === nodeId);
        if (node) {
          if (node.metadata.type === "string") {
            clearedInputs[node.id] = "";
          }
          // Clear inputs for children
          const children = currentData.filter(n => n.parent === nodeId && !n.metadata.replicaOf);
          children.forEach(child => clearInputsRecursively(child.id));
        }
      };

      const children = currentData.filter(n => n.parent === parentId && !n.metadata.replicaOf);
      children.forEach(child => clearInputsRecursively(child.id));
      
      return clearedInputs;
    });
  };

  const deleteFromArray = (nodeId: number) => {
    setLocalPublishData(prev => {
      let updated = prev.filter(n => n.id !== nodeId);
      const deletedNode = prev.find(n => n.id === nodeId);
      
      if (deletedNode && deletedNode.parent) {
        const parent = updated.find(n => n.id === deletedNode.parent);
        if (parent) {
          parent.children = parent.children.filter(id => id !== nodeId);
          
          if (Array.isArray(parent.metadata.value)) {
            // For string arrays
            if (parent.metadata.array === "string") {
              // Remove the value from the array
              const deletedValue = deletedNode.metadata.value;
              const valueIndex = parent.metadata.value.indexOf(deletedValue);
              if (valueIndex >= 0) {
                parent.metadata.value.splice(valueIndex, 1);
              }
              
              // Get all remaining string children and sort by their current index (include replica items)
              const siblings = updated
                .filter(n =>
                  n.parent === deletedNode.parent &&
                  n.metadata.type === "string" &&
                  n.metadata.originalKey !== undefined
                )
                .sort((a, b) => parseInt(a.metadata.originalKey || "0") - parseInt(b.metadata.originalKey || "0"));
              
              // Rebuild the array and re-index all siblings
              parent.metadata.value = [];
              siblings.forEach((sibling, index) => {
                sibling.name = `${parent.name}[${index}]: "${sibling.metadata.value}"`;
                sibling.metadata.originalKey = String(index);
                if (Array.isArray(parent.metadata.value)) {
                  parent.metadata.value.push(sibling.metadata.value);
                }
              });
              
              // If this is inside a document entry, update the document object too
              const documentParent = updated.find(n => n.id === parent.parent);
              if (documentParent && documentParent.metadata.type === "object" && documentParent.metadata.replicaOf) {
                if (!documentParent.metadata.value || typeof documentParent.metadata.value !== "object" || Array.isArray(documentParent.metadata.value)) {
                  documentParent.metadata.value = {};
                }
                (documentParent.metadata.value as Record<string, any>)[parent.name] = parent.metadata.value;
              }
            }
            // For document arrays
            else if (parent.metadata.array === "document") {
              // Find all document siblings
              const documentSiblings = updated.filter(n =>
                n.parent === deletedNode.parent &&
                n.metadata.replicaOf === deletedNode.parent
              );
              
              // Rebuild the array values
              parent.metadata.value = documentSiblings.map(sibling => sibling.metadata.value);
              
              // Re-index remaining document nodes
              documentSiblings.forEach((sibling, index) => {
                sibling.name = `${parent.name}[${index}]`;
              });
            }
          }
        }
      }

      return updated;
    });
  };

  const createNode = (
    nodeName: string | undefined,
    nodeType: string | null,
    required: string | undefined,
    additionalProperties: string | undefined
  ) => {
    if (!nodeName || !nodeType || !required || creatingChildFor === null) return;

    const metadata: TreeNodeMetadata = {
      type: nodeType === "stringlist" || nodeType === "documentlist" ? "array" : nodeType,
    };

    if (nodeType === "object") {
      metadata.additionalProperties = additionalProperties;
    }
    if (nodeType === "stringlist") metadata.array = "string";
    if (nodeType === "documentlist") metadata.array = "document";
    if (required) metadata.required = required;

    const newNode: TreeNode = {
      name: nodeName,
      id: Date.now() + Math.random(),
      parent: creatingChildFor,
      metadata: metadata,
      children: [],
    };

    if (addToTree) {
      addToTree(newNode, required);
    }
    
    setCreatingChildFor(null);
    setExpandedNodes(prev => new Set([...prev, creatingChildFor]));
  };

  const editTreeNode = (updatedNode: TreeNode) => {
    if (editNode) {
      editNode(updatedNode);
      setEditingNode(null);
    }
  };


  // Render icon based on node type and expansion state
  const renderIcon = (node: TreeNode, isExpanded: boolean) => {
    if (node.metadata.type === "object" || (node.metadata.type === "array" && node.metadata.array === "document")) {
      return isExpanded ? <FolderOpen className="text-gray-dark text-xl" /> : <Folder className="text-gray-dark text-xl" />;
    }
    return <TextField className="text-gray-dark text-xl" />;
  };

  // Render a single tree node
  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const currentData = publishable ? localPublishData : treeData;
    const children = getChildren(node.id, currentData);
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = children.length > 0;
    
    // Check if this is an array entry (has replicaOf for document arrays or originalKey for string arrays)
    const isArrayEntry = !!(node.metadata.replicaOf || node.metadata.originalKey !== undefined);
    
    // Apply different background color for array entries
    const bgColor = isArrayEntry ? "bg-cyan-100 border-l-4 border-cyan-500" : "bg-white";

    return (
      <div key={node.id} style={{ marginLeft: level * 20 }}>
        {editingNode === node.id ? (
          <div className="bg-white rounded-md p-2 my-1">
            <CreateNodeForm
              closeForm={() => setEditingNode(null)}
              editTreeNode={editTreeNode}
              nodeData={node}
              expandParent={() => setExpandedNodes(prev => new Set([...prev, node.id]))}
            />
          </div>
        ) : (
          <div className={`flex items-center justify-between ${bgColor} rounded-md px-3 py-2 my-1`}>
            <div
              className="flex items-center gap-2 flex-1 cursor-pointer"
              onClick={() => hasChildren && toggleExpansion(node.id)}
            >
              {renderIcon(node, isExpanded)}
              <span className={`text-sm ${isArrayEntry ? "text-cyan-800 font-bold" : ""}`}>
                {node.name}
                {node.metadata.required === "yes" && (
                  <span className="text-red font-bold ml-1" title="Required">*</span>
                )}
                <span className={`text-xs ml-2 ${isArrayEntry ? "text-cyan-600 font-semibold" : "text-gray"}`}>
                  {isArrayEntry && "(Array Entry)"}
                  {!isArrayEntry && node.metadata.type === "array"
                    ? node.metadata.array === "document" ? "(Document list)" : "(String list)"
                    : ""
                  }
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {publishable && renderPublishableControls(node)}
              {editable && renderEditableControls(node)}
            </div>
          </div>
        )}

        {creatingChildFor === node.id && (
          <div style={{ marginLeft: (level + 1) * 20 }} className="my-2">
            <CreateNodeForm
              closeForm={() => setCreatingChildFor(null)}
              createTreeNode={createNode}
              expandParent={() => setExpandedNodes(prev => new Set([...prev, node.id]))}
            />
          </div>
        )}

        {isExpanded && hasChildren && (
          <div>
            {children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render controls for publishable mode
  const renderPublishableControls = (node: TreeNode) => {
    if (node.metadata.type === "array") {
      if (node.metadata.array === "string") {
        return (
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="bg-gray-lightest rounded-md px-2 py-1 text-sm w-32"
              value={arrayInputs[node.id] || ""}
              placeholder="Enter value then press Enter..."
              onChange={(e) => setArrayInputs(prev => ({ ...prev, [node.id]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && arrayInputs[node.id]?.trim()) {
                  addToStringArray(node.id);
                }
              }}
            />
            <Button
              type="button"
              color="green"
              icon={Plus}
              iconPosition="center"
              tableButton={true}
              padding={false}
              className="p-1"
              onClick={() => addToStringArray(node.id)}
            />
          </div>
        );
      } else if (node.metadata.array === "document") {
        // Check if there are any non-empty inputs in the template fields
        const currentData = publishable ? localPublishData : treeData;
        const children = getChildren(node.id, currentData).filter(child => !child.metadata.replicaOf);
        
        // Check if at least one required field is filled, or if any field has input
        const hasRequiredInputs = children.some(child => {
          if (child.metadata.required === "yes") {
            if (child.metadata.type === "string") {
              return inputValues[child.id]?.trim();
            } else if (child.metadata.type === "array") {
              return Array.isArray(child.metadata.value) && child.metadata.value.length > 0;
            }
          }
          return false;
        });
        
        const hasAnyInputs = children.some(child => {
          if (child.metadata.type === "string") {
            return inputValues[child.id]?.trim();
          } else if (child.metadata.type === "array") {
            return Array.isArray(child.metadata.value) && child.metadata.value.length > 0;
          }
          return false;
        });
        
        // Allow adding if we have required fields filled OR any input at all
        const canAdd = hasRequiredInputs || hasAnyInputs;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              color="green"
              icon={Plus}
              iconPosition="center"
              tableButton={true}
              padding={false}
              className="p-1"
              disabled={!canAdd}
              onClick={() => addToDocumentArray(node.id)}
            />
          </div>
        );
      }
      return null;
    }

    if (node.metadata.type === "string") {
      const parent = node.parent ? localPublishData.find(n => n.id === node.parent) : null;
      const isArrayItem = parent?.metadata.type === "array";
      
      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="bg-gray-lightest rounded-md px-2 py-1 text-sm w-32"
            value={inputValues[node.id] || ""}
            onChange={(e) => updateInputValue(node.id, e.target.value)}
            onKeyDown={isArrayItem ? (e) => handleInputKeyDown(e, node.id) : undefined}
            onBlur={isArrayItem ? () => handleInputBlur(node.id) : undefined}
            placeholder={isArrayItem ? "Press Enter or click outside to save" : undefined}
          />
          {isArrayItem && (
            <Button
              type="button"
              color="red"
              icon={DeleteTrash}
              iconPosition="center"
              tableButton={true}
              padding={false}
              className="p-1"
              onClick={() => deleteFromArray(node.id)}
            />
          )}
        </div>
      );
    }

    if (node.metadata.type === "object" && node.metadata.value) {
      return (
        <div className="flex items-center gap-2 relative">
          <Button
            type="button"
            color="blue"
            icon={DocumentList}
            iconPosition="center"
            tableButton={true}
            padding={false}
            className="p-1"
            onClick={() => setShowDocumentPreview(prev => prev === node.id ? null : node.id)}
          />
          {showDocumentPreview === node.id && (
            <div className="absolute top-8 right-0 bg-white border rounded-lg shadow-lg p-4 z-50 min-w-96">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Document Preview</h4>
                <X className="cursor-pointer" onClick={() => setShowDocumentPreview(null)} />
              </div>
              <SchemeTree
                treeData={parseObject(node.metadata.value, node.name, 0, 1)}
                publishable={false}
              />
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Render controls for editable mode
  const renderEditableControls = (node: TreeNode) => {
    return (
      <div className="flex items-center gap-2">
        {(node.metadata.type === "object" || node.metadata.array === "document") && (
          <Button
            type="button"
            color="green"
            icon={Plus}
            iconPosition="center"
            tableButton={true}
            padding={false}
            className="p-1"
            onClick={() => setCreatingChildFor(node.id)}
          />
        )}
        {node.parent !== 0 && (
          <>
            <Button
              type="button"
              color="blue"
              icon={EditPen}
              iconPosition="center"
              tableButton={true}
              padding={false}
              className="p-1"
              onClick={() => setEditingNode(node.id)}
            />
            <Button
              type="button"
              color="red"
              icon={DeleteTrash}
              iconPosition="center"
              tableButton={true}
              padding={false}
              className="p-1"
              onClick={() => deleteNode && deleteNode(node.id)}
            />
          </>
        )}
      </div>
    );
  };

  const currentData = publishable ? localPublishData : treeData;
  const rootNodes = getRootNodes(currentData);

  return (
    <div className="space-y-1">
      {rootNodes.map(node => renderNode(node))}
    </div>
  );
};

export default SchemeTree;
