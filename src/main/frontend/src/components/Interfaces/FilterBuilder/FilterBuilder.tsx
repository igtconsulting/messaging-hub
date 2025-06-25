import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Plus } from '../../../assets/icons/Plus';
import { DeleteTrash } from '../../../assets/icons/DeleteTrash';
import { X } from '../../../assets/icons/X';
import { Folder } from '../../../assets/icons/Folder';
import { FolderOpen } from '../../../assets/icons/FolderOpen';
import { TextField } from '../../../assets/icons/TextField';
import Button from '../../General/Button';
import Select from '../../General/Form/Select';
import Input from '../../General/Form/Input';
import SchemeTree from '../../Topics/Scheme/SchemeTree';
import { convertToArrayStructure } from '../../../services/schemeFormating';
import { TreeNode } from '../../../types';

export interface FilterCondition {
  id: string;
  field: string;
  fieldType: 'string' | 'integer' | 'boolean' | 'document' | 'array';
  operator: string;
  value: string;
  valueType: 'literal' | 'field';
  arrayIndex?: string; // For array access like field[0]
  documentPath?: string; // For document access like document.field
}

export interface FilterGroup {
  id: string;
  type: 'group';
  conditions: (FilterCondition | FilterGroup)[];
}

export type FilterElement = FilterCondition | FilterGroup;

interface FilterBuilderProps {
  value?: string;
  onChange?: (filter: string) => void;
  schema?: any; // Topic schema for field suggestions
  disabled?: boolean;
  error?: any;
  label?: string;
  name?: string;
}

export interface FilterBuilderRef {
  validateFilter: () => { isValid: boolean; error?: string };
}

const operatorOptions = [
  { label: 'equals (=)', value: '=' },
  { label: 'not equals (!=)', value: '!=' },
  { label: 'less than (<)', value: '<' },
  { label: 'greater than (>)', value: '>' },
  { label: 'less or equal (<=)', value: '<=' },
  { label: 'greater or equal (>=)', value: '>=' },
];

const fieldTypeOptions = [
  { label: 'String Field', value: 'string' },
  { label: 'Integer Field', value: 'integer' },
  { label: 'Boolean Field', value: 'boolean' },
  { label: 'Document Field', value: 'document' },
  { label: 'Array Element', value: 'array' },
];

const logicalOperators = [
  { label: 'AND', value: 'AND' },
  { label: 'OR', value: 'OR' },
];

const valueTypeOptions = [
  { label: 'Literal Value', value: 'literal' },
  { label: 'Field Reference', value: 'field' },
];

const FilterBuilder = forwardRef<FilterBuilderRef, FilterBuilderProps>(({
  value = '',
  onChange,
  schema,
  disabled = false,
  error,
  label = 'Message filter',
  name = 'messageFilter'
}, ref) => {
  const [filterTree, setFilterTree] = useState<FilterGroup>({
    id: 'root',
    type: 'group',
    conditions: []
  });
  const [showAdvanced, setShowAdvanced] = useState(value && value.trim() ? true : false);
  const [rawFilter, setRawFilter] = useState(value || '');
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [editingConditionId, setEditingConditionId] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [showArrayIndexPicker, setShowArrayIndexPicker] = useState(false);
  const [selectedFieldForArrays, setSelectedFieldForArrays] = useState<{path: string, type: string, segments: Array<{name: string, isArray: boolean, arrayType?: string}> } | null>(null);
  const [arrayIndices, setArrayIndices] = useState<Record<string, string>>({});
  const [conditionOperators, setConditionOperators] = useState<Record<string, 'AND' | 'OR'>>({});
  const [draggedElement, setDraggedElement] = useState<{id: string, type: 'condition' | 'group', parentId: string} | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{parentId: string, position: number} | null>(null);
  const [highlightedGroup, setHighlightedGroup] = useState<string | null>(null);
  const [autoScrollInterval, setAutoScrollInterval] = useState<number | null>(null);
  const [currentSchemaKey, setCurrentSchemaKey] = useState<string>('');
  const [groupColors, setGroupColors] = useState<Record<string, string>>({});
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [customColors, setCustomColors] = useState<Record<string, string>>({});
  const [tempCustomColor, setTempCustomColor] = useState<string>('#ffffff');
  const [filterValidationError, setFilterValidationError] = useState<string | null>(null);
  const [showValidationPopup, setShowValidationPopup] = useState(false);

  // Extract field paths from schema - only filterable leaf fields for UM filters
  const getSchemaFields = useCallback((obj: any, prefix = '', level = 0): Array<{field: string, type: string, description?: string, level: number, isLeaf: boolean, fullPath: string}> => {
    if (!obj || typeof obj !== 'object') return [];
    
    const fields: Array<{field: string, type: string, description?: string, level: number, isLeaf: boolean, fullPath: string}> = [];
    
    Object.keys(obj).forEach(key => {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      const fieldValue = obj[key];
      
      if (fieldValue && typeof fieldValue === 'object') {
        // Handle JSON Schema style objects
        if (fieldValue.type) {
          let fieldType = fieldValue.type;
          if (fieldType === 'number') fieldType = 'integer';
          
          // Only add filterable fields (primitive types and arrays of primitives)
          if (fieldType === 'string' || fieldType === 'integer' || fieldType === 'boolean') {
            fields.push({
              field: fullPath,
              fullPath: fullPath,
              type: fieldType,
              description: fieldValue.description || `${fieldType} field`,
              level: level,
              isLeaf: true
            });
          }
          
          // Handle nested objects - recurse to find primitive fields
          if (fieldValue.type === 'object' && fieldValue.properties) {
            fields.push(...getSchemaFields(fieldValue.properties, fullPath, level + 1));
          }
          
          // Handle arrays - make stringList and other primitive arrays selectable
          if (fieldValue.type === 'array' && fieldValue.items) {
            if (fieldValue.items.type && (fieldValue.items.type === 'string' || fieldValue.items.type === 'integer' || fieldValue.items.type === 'boolean')) {
              // Array of primitives - add as selectable with array type
              fields.push({
                field: fullPath,
                fullPath: fullPath,
                type: 'array',
                description: `Array of ${fieldValue.items.type} elements`,
                level: level,
                isLeaf: true
              });
            } else if (fieldValue.items.type === 'object' && fieldValue.items.properties) {
              // Array of objects - recurse into object properties with array notation
              const arrayItemFields = getSchemaFields(fieldValue.items.properties, `${fullPath}[0]`, level + 1);
              fields.push(...arrayItemFields);
            }
          }
        } else if (!Array.isArray(fieldValue)) {
          // Handle plain object (no type specified) - recurse to find primitive fields
          if (Object.keys(fieldValue).length > 0) {
            fields.push(...getSchemaFields(fieldValue, fullPath, level + 1));
          }
        }
      } else {
        // Primitive value, try to infer type
        let inferredType = 'string';
        if (typeof fieldValue === 'number') inferredType = 'integer';
        if (typeof fieldValue === 'boolean') inferredType = 'boolean';
        
        fields.push({
          field: fullPath,
          fullPath: fullPath,
          type: inferredType,
          description: `${inferredType.charAt(0).toUpperCase() + inferredType.slice(1)} field`,
          level: level,
          isLeaf: true
        });
      }
    });
    
    return fields;
  }, []);

  const schemaFields = useMemo(() => {
    if (!schema) return [];
    return getSchemaFields(schema);
  }, [schema, getSchemaFields]);

  // Generate unique key for schema to detect schema changes
  const generateSchemaKey = useCallback((schemaObj: any): string => {
    if (!schemaObj) return 'no-schema';
    try {
      // Create a simple hash of the schema structure for identification
      const schemaString = JSON.stringify(schemaObj);
      return btoa(schemaString).substring(0, 20); // Use base64 encoding, first 20 chars
    } catch {
      return `schema-${Date.now()}`;
    }
  }, []);

  // Handle schema changes - reset filter when schema changes
  useEffect(() => {
    const newSchemaKey = generateSchemaKey(schema);
    
    // If this is the initial schema load
    if (!currentSchemaKey) {
      setCurrentSchemaKey(newSchemaKey);
      return;
    }
    
    // If schema key is actually changing (not initial load) - reset filter
    // BUT only if we don't have an initial value from props
    if (newSchemaKey !== currentSchemaKey) {
      // Only reset if there's no initial value from props
      if (!value || !value.trim()) {
        // Reset to clean state for new schema
        setFilterTree({
          id: 'root',
          type: 'group',
          conditions: []
        });
        setConditionOperators({});
        setRawFilter('');
        setGroupColors({}); // Reset group colors
        setCustomColors({}); // Reset custom colors
        setShowColorPicker(null); // Close color picker
        if (onChange) onChange('');
      }
      
      // Update current schema key
      setCurrentSchemaKey(newSchemaKey);
    }
    
  }, [schema, onChange, value]); // Add value to dependencies

  // Close color picker when clicking outside and auto-apply custom color
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColorPicker && !(event.target as Element).closest('.color-picker-container')) {
        // Auto-apply the temporary custom color before closing
        if (tempCustomColor) {
          setGroupColors(prev => ({
            ...prev,
            [showColorPicker]: 'custom'
          }));
          setCustomColors(prev => ({
            ...prev,
            [showColorPicker]: tempCustomColor
          }));
        }
        setShowColorPicker(null);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker, tempCustomColor]);

  // Convert schema to TreeNode format for SchemeTree
  useEffect(() => {
    if (schema) {
      try {
        // Convert schema to TreeNode format for SchemeTree
        const convertedTreeData = convertToArrayStructure(schema, 'Schema');
        setTreeData(convertedTreeData);
      } catch (error) {
        console.warn('Failed to process schema for SchemeTree:', error);
        setTreeData([]);
      }
    } else {
      setTreeData([]);
    }
  }, [schema]);

  const fieldOptions = useMemo(() => {
    // Only show filterable fields from schema (no manual field entry)
    const options = schemaFields.map(field => {
      const indent = '  '.repeat(field.level);
      const typeIcon = field.type === 'string' ? '📝' :
                      field.type === 'integer' ? '🔢' :
                      field.type === 'boolean' ? '☑️' : '📄';
      
      return {
        label: `${indent}${typeIcon} ${field.field} (${field.type})`,
        value: field.field,
        level: field.level,
        type: field.type,
        fullPath: field.fullPath
      };
    });
    
    // If no schema, show message that schema is required
    if (options.length === 0) {
      return [
        { label: 'No schema fields available - select a topic first', value: '', level: 0, type: 'string', fullPath: '' }
      ];
    }
    
    return options;
  }, [schemaFields]);

  // Get field type from schema
  const getFieldType = useCallback((fieldName: string): string => {
    const field = schemaFields.find(f => f.field === fieldName);
    return field?.type || 'string';
  }, [schemaFields]);

  // Generate filter string from tree
  const generateFilterString = useCallback((element: FilterElement): string => {
    if ('field' in element) {
      // It's a condition
      let fieldName = element.field;
      
      // Handle array access
      if (element.fieldType === 'array' && element.arrayIndex) {
        fieldName = `${element.field}[${element.arrayIndex}]`;
      }
      
      // Handle document path
      if (element.fieldType === 'document' && element.documentPath) {
        fieldName = `${element.field}.${element.documentPath}`;
      }
      
      // Format value based on field type and value type
      let valueStr: string;
      if (element.valueType === 'field') {
        valueStr = element.value;
      } else {
        // Literal value
        switch (element.fieldType) {
          case 'string':
            valueStr = `'${element.value}'`;
            break;
          case 'integer':
            valueStr = element.value;
            break;
          case 'boolean':
            valueStr = element.value; // true or false without quotes
            break;
          default:
            valueStr = `'${element.value}'`;
        }
      }
      
      return `${fieldName} ${element.operator} ${valueStr}`;
    } else {
      // It's a group
      if (element.conditions.length === 0) return '';
      if (element.conditions.length === 1) return generateFilterString(element.conditions[0]);
      
      const conditionStrings = element.conditions
        .map(cond => generateFilterString(cond))
        .filter(str => str.length > 0);
      
      if (conditionStrings.length === 0) return '';
      if (conditionStrings.length === 1) return conditionStrings[0];
      
      // Build string using operators between conditions
      let result = conditionStrings[0];
      for (let i = 1; i < conditionStrings.length; i++) {
        const prevConditionId = element.conditions[i - 1].id;
        const operator = conditionOperators[prevConditionId] || 'AND';
        result += ` ${operator.toLowerCase()} ${conditionStrings[i]}`;
      }
      
      return element.id === 'root' ? result : `(${result})`;
    }
  }, [conditionOperators]);

  // Update filter string when tree changes or operators change
  useEffect(() => {
    if (!showAdvanced) {
      const filterString = generateFilterString(filterTree);
      setRawFilter(filterString);
      if (onChange) {
        onChange(filterString);
      }
    }
  }, [filterTree, conditionOperators, generateFilterString, onChange, showAdvanced]);

  // Initialize from value prop when component mounts or value changes
  useEffect(() => {
    if (value !== undefined) {
      setRawFilter(value);
      
      // If we have a non-empty value, show it in raw mode
      if (value && value.trim()) {
        setShowAdvanced(true);
      }
    }
  }, [value]);

  // Add new condition with template support
  const addCondition = (groupId: string, template?: Partial<FilterCondition>) => {
    if (!schema) {
      // Fallback for when there's no schema - create empty condition
      const newCondition: FilterCondition = {
        id: `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        field: '',
        fieldType: 'string',
        operator: '=',
        value: '',
        valueType: 'literal',
        arrayIndex: template?.arrayIndex,
        documentPath: template?.documentPath
      };

      setFilterTree(prev => updateGroup(prev, groupId, group => ({
        ...group,
        conditions: [...group.conditions, newCondition]
      })));
      return;
    }

    if (template && template.field) {
      // Template provided, create condition directly
      const detectedType = getFieldType(template.field);
      const fieldType = template?.fieldType || (detectedType as FilterCondition['fieldType']);
      
      const newCondition: FilterCondition = {
        id: `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        field: template.field,
        fieldType: fieldType,
        operator: template?.operator || '=',
        value: template?.value || '',
        valueType: 'literal',
        arrayIndex: template?.arrayIndex,
        documentPath: template?.documentPath
      };

      setFilterTree(prev => updateGroup(prev, groupId, group => ({
        ...group,
        conditions: [...group.conditions, newCondition]
      })));
    } else {
      // No template, show field picker popup
      setEditingConditionId(null);
      setShowFieldPicker(true);
      (window as any).pendingGroupId = groupId;
    }
  };

  // Handle field selection from SchemeTree
  const handleFieldSelection = (selectedField: string, selectedType: string) => {
    const groupId = (window as any).pendingGroupId || 'root';
    
    if (editingConditionId) {
      // Edit existing condition's field
      updateCondition(editingConditionId, {
        field: selectedField,
        fieldType: selectedType as FilterCondition['fieldType'],
        value: '', // Reset value when field changes
        valueType: 'literal',
        arrayIndex: undefined,
        documentPath: undefined
      });
    } else {
      // Add new condition with selected field
      const newCondition: FilterCondition = {
        id: `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        field: selectedField,
        fieldType: selectedType as FilterCondition['fieldType'],
        operator: '=',
        value: '',
        valueType: 'literal'
      };

      setFilterTree(prev => updateGroup(prev, groupId, group => ({
        ...group,
        conditions: [...group.conditions, newCondition]
      })));
    }
    
    setShowFieldPicker(false);
    setEditingConditionId(null);
    delete (window as any).pendingGroupId;
  };

  // Edit condition field
  const editConditionField = (conditionId: string) => {
    setEditingConditionId(conditionId);
    setShowFieldPicker(true);
  };

  // Build field path from TreeNode
  const buildFieldPath = (node: TreeNode, treeData: TreeNode[]): string => {
    if (node.parent === 0 || node.parent === 1) {
      return node.name === 'Schema' ? '' : node.name;
    }
    
    const parent = treeData.find(n => n.id === node.parent);
    if (!parent) return node.name;
    
    const parentPath = buildFieldPath(parent, treeData);
    return parentPath ? `${parentPath}.${node.name}` : node.name;
  };

  // Handle tree node click
  const handleTreeNodeClick = (nodeId: number) => {
    const node = treeData.find(n => n.id === nodeId);
    if (!node || !node.metadata.type) return;
    
    // Allow selection of primitive types and string arrays
    const isSelectableType = (['string', 'integer', 'boolean'].includes(node.metadata.type) ||
                             (node.metadata.type === 'array' && node.metadata.array === 'string')) &&
                            node.metadata.type !== 'object';
    
    if (isSelectableType) {
      const fieldPath = buildFieldPath(node, treeData);
      if (fieldPath) {
        // Parse the path to find all array segments
        const segments = parseFieldPathSegments(node, treeData);
        const hasArrays = segments.some(seg => seg.isArray);
        
        if (hasArrays) {
          setSelectedFieldForArrays({
            path: fieldPath,
            type: node.metadata.type === 'array' ? 'string' : node.metadata.type,
            segments: segments
          });
          setShowFieldPicker(false);
          setShowArrayIndexPicker(true);
          
          // Initialize array indices with default value "0"
          const initialIndices: Record<string, string> = {};
          segments.forEach((segment, index) => {
            if (segment.isArray) {
              initialIndices[`array_${index}`] = '0'; // Start with default 0
            }
          });
          setArrayIndices(initialIndices);
        } else {
          // No arrays involved, select directly
          handleFieldSelection(fieldPath, node.metadata.type);
        }
      }
    }
  };

  // Check if a node has array parents in its path
  const hasArrayParents = (node: TreeNode, treeData: TreeNode[]): boolean => {
    let currentNode = node;
    while (currentNode.parent && currentNode.parent !== 0 && currentNode.parent !== 1) {
      const parent = treeData.find(n => n.id === currentNode.parent);
      if (!parent) break;
      if (parent.metadata.type === 'array') return true;
      currentNode = parent;
    }
    return false;
  };

  // Parse field path segments with proper array detection
  const parseFieldPathSegments = (node: TreeNode, treeData: TreeNode[]): Array<{name: string, isArray: boolean, arrayType?: string}> => {
    const segments: Array<{name: string, isArray: boolean, arrayType?: string}> = [];
    
    // Build path by traversing up the tree
    const buildSegments = (currentNode: TreeNode): void => {
      if (currentNode.parent === 0 || currentNode.parent === 1) {
        if (currentNode.name !== 'Schema') {
          segments.unshift({
            name: currentNode.name,
            isArray: currentNode.metadata.type === 'array',
            arrayType: currentNode.metadata.array
          });
        }
        return;
      }
      
      const parent = treeData.find(n => n.id === currentNode.parent);
      if (parent) {
        buildSegments(parent);
      }
      
      segments.push({
        name: currentNode.name,
        isArray: currentNode.metadata.type === 'array',
        arrayType: currentNode.metadata.array
      });
    };
    
    buildSegments(node);
    return segments;
  };

  // Validate array indices - check if all required indices are valid numbers >= 0
  const validateArrayIndices = (): boolean => {
    if (!selectedFieldForArrays) return false;
    
    return selectedFieldForArrays.segments.every((segment, index) => {
      if (segment.isArray) {
        const value = arrayIndices[`array_${index}`];
        return value !== undefined && value !== '' && !isNaN(Number(value)) && Number(value) >= 0;
      }
      return true;
    });
  };

  // Handle array index specification completion
  const handleArrayIndicesComplete = () => {
    if (!selectedFieldForArrays || !validateArrayIndices()) return;
    
    // Build final path with all array indices in correct positions
    let finalPath = '';
    selectedFieldForArrays.segments.forEach((segment, index) => {
      if (index > 0) finalPath += '.';
      finalPath += segment.name;
      
      if (segment.isArray) {
        const indexValue = arrayIndices[`array_${index}`];
        finalPath += `[${indexValue}]`;
      }
    });
    
    handleFieldSelection(finalPath, selectedFieldForArrays.type);
    setShowArrayIndexPicker(false);
    setSelectedFieldForArrays(null);
    setArrayIndices({});
  };

  // Add new group
  const addGroup = (parentGroupId: string) => {
    const newGroup: FilterGroup = {
      id: `group_${Date.now()}`,
      type: 'group',
      conditions: []
    };

    setFilterTree(prev => updateGroup(prev, parentGroupId, group => ({
      ...group,
      conditions: [...group.conditions, newGroup]
    })));
  };

  // Update group helper
  const updateGroup = (tree: FilterGroup, groupId: string, updater: (group: FilterGroup) => FilterGroup): FilterGroup => {
    if (tree.id === groupId) {
      return updater(tree);
    }

    return {
      ...tree,
      conditions: tree.conditions.map(cond => {
        if ('conditions' in cond) {
          return updateGroup(cond, groupId, updater);
        }
        return cond;
      })
    };
  };

  // Update condition
  const updateCondition = (conditionId: string, updates: Partial<FilterCondition>) => {
    setFilterTree(prev => updateConditionInTree(prev, conditionId, updates));
  };

  const updateConditionInTree = (tree: FilterGroup, conditionId: string, updates: Partial<FilterCondition>): FilterGroup => {
    return {
      ...tree,
      conditions: tree.conditions.map(cond => {
        if ('conditions' in cond) {
          return updateConditionInTree(cond, conditionId, updates);
        } else if (cond.id === conditionId) {
          return { ...cond, ...updates };
        }
        return cond;
      })
    };
  };

  // Delete element
  const deleteElement = (elementId: string) => {
    setFilterTree(prev => deleteFromTree(prev, elementId));
  };

  const deleteFromTree = (tree: FilterGroup, elementId: string): FilterGroup => {
    return {
      ...tree,
      conditions: tree.conditions
        .filter(cond => cond.id !== elementId)
        .map(cond => {
          if ('conditions' in cond) {
            return deleteFromTree(cond, elementId);
          }
          return cond;
        })
    };
  };


  // Delete condition
  const deleteCondition = (conditionId: string) => {
    setFilterTree(prev => ({
      ...prev,
      conditions: prev.conditions.filter(cond => cond.id !== conditionId)
    }));
    
    // Clean up operator state
    setConditionOperators(prev => {
      const newOperators = { ...prev };
      delete newOperators[conditionId];
      return newOperators;
    });
  };

  // Update condition operator between conditions
  const updateConditionOperator = (conditionId: string, operator: 'AND' | 'OR') => {
    setConditionOperators(prev => ({
      ...prev,
      [conditionId]: operator
    }));
  };

  // Auto-scroll functionality for drag and drop
  const handleAutoScroll = useCallback((clientY: number) => {
    const SCROLL_ZONE = 50; // pixels from top/bottom edge to trigger scroll
    const SCROLL_SPEED = 10; // pixels per scroll
    
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Clear any existing auto-scroll
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }
    
    let shouldScroll = false;
    let scrollDirection = 0;
    
    // Check if near top edge
    if (clientY < SCROLL_ZONE) {
      shouldScroll = true;
      scrollDirection = -SCROLL_SPEED;
    }
    // Check if near bottom edge
    else if (clientY > viewportHeight - SCROLL_ZONE) {
      shouldScroll = true;
      scrollDirection = SCROLL_SPEED;
    }
    
    if (shouldScroll) {
      const interval = setInterval(() => {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
        
        // Check bounds
        if ((scrollDirection < 0 && currentScrollTop <= 0) ||
            (scrollDirection > 0 && currentScrollTop >= maxScrollTop)) {
          clearInterval(interval);
          setAutoScrollInterval(null);
          return;
        }
        
        window.scrollBy(0, scrollDirection);
      }, 16); // ~60fps
      
      setAutoScrollInterval(interval);
    }
  }, [autoScrollInterval]);

  // Clear auto-scroll on component unmount
  useEffect(() => {
    return () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
    };
  }, [autoScrollInterval]);

  // Drag and Drop Functions
  const handleDragStart = (e: React.DragEvent, elementId: string, elementType: 'condition' | 'group', parentId: string) => {
    setDraggedElement({ id: elementId, type: elementType, parentId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', elementId);
  };

  const handleDragOver = (e: React.DragEvent, targetParentId: string, position: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget({ parentId: targetParentId, position });
    
    // Trigger auto-scroll based on mouse position
    handleAutoScroll(e.clientY);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the entire drop zone
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetParentId: string, position: number) => {
    e.preventDefault();
    setDragOverTarget(null);
    
    if (!draggedElement) return;
    
    // Don't allow dropping on itself or its children
    if (draggedElement.id === targetParentId) return;
    
    // Move the element
    moveElement(draggedElement.id, draggedElement.parentId, targetParentId, position);
    setDraggedElement(null);
  };

  const handleDragEnd = () => {
    setDraggedElement(null);
    setDragOverTarget(null);
    
    // Clear auto-scroll
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }
  };

  // Move element from one parent to another
  const moveElement = (elementId: string, fromParentId: string, toParentId: string, position: number) => {
    setFilterTree(prev => {
      // First, remove element from its current parent
      const elementToMove = findElementById(prev, elementId);
      if (!elementToMove) return prev;
      
      const treeWithoutElement = deleteFromTree(prev, elementId);
      
      // Then add it to the new parent at the specified position
      return insertElementAtPosition(treeWithoutElement, toParentId, elementToMove, position);
    });
  };

  // Helper function to find element by ID
  const findElementById = (tree: FilterGroup, elementId: string): FilterElement | null => {
    if (tree.id === elementId) return tree;
    
    for (const condition of tree.conditions) {
      if (condition.id === elementId) return condition;
      if ('conditions' in condition) {
        const found = findElementById(condition, elementId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to insert element at specific position
  const insertElementAtPosition = (tree: FilterGroup, parentId: string, element: FilterElement, position: number): FilterGroup => {
    if (tree.id === parentId) {
      const newConditions = [...tree.conditions];
      newConditions.splice(position, 0, element);
      return { ...tree, conditions: newConditions };
    }
    
    return {
      ...tree,
      conditions: tree.conditions.map(cond => {
        if ('conditions' in cond) {
          return insertElementAtPosition(cond, parentId, element, position);
        }
        return cond;
      })
    };
  };

  // Auto-detect field type when field changes and reset value
  const handleFieldChange = useCallback((conditionId: string, newField: string) => {
    const detectedType = getFieldType(newField) as FilterCondition['fieldType'];
    const schemaField = schemaFields.find(f => f.field === newField);
    
    updateCondition(conditionId, {
      field: newField,
      fieldType: detectedType,
      value: '', // Reset value when field changes
      valueType: 'literal', // UM filters are always literal
      arrayIndex: undefined,
      documentPath: undefined
    });
  }, [getFieldType, updateCondition, schemaFields]);

  // Validate value based on field type
  const validateValue = useCallback((value: string, fieldType: string): boolean => {
    if (!value.trim()) return true; // Empty is ok
    
    switch (fieldType) {
      case 'integer':
        return !isNaN(Number(value)) && Number.isInteger(Number(value));
      case 'boolean':
        return value === 'true' || value === 'false';
      case 'string':
        return true; // Any string is valid
      default:
        return true;
    }
  }, []);

  // Render condition with improved UI - all elements in one line with drag support
  const renderCondition = (condition: FilterCondition, parentId: string) => (
    <div
      key={condition.id}
      draggable={!disabled}
      onDragStart={(e) => handleDragStart(e, condition.id, 'condition', parentId)}
      onDragEnd={handleDragEnd}
      className={`group flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm transition-all ${
        draggedElement?.id === condition.id ? 'opacity-50 scale-95' : ''
      } ${!disabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
      {/* Drag Handle */}
      <div className="flex flex-col justify-center text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
        <div className="w-2 h-2 bg-gray-300 rounded-full mb-1"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full mb-1"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
      </div>
      {/* Field Name with Popup Picker */}
      <div className="flex flex-col min-w-[180px]">
        <label className="text-xs font-medium text-gray-700 mb-1 h-4">Field</label>
        {schema ? (
          <div className="flex gap-2 h-10">
            <div className="flex-1 p-2 bg-white border border-gray-300 rounded text-sm min-w-[120px] h-10 flex items-center">
              {condition.field || 'No field selected'}
            </div>
            <Button
              type="button"
              color="blue"
              text="Change"
              onClick={() => editConditionField(condition.id)}
              disabled={disabled}
              className="px-2 py-1 text-xs h-10"
            />
          </div>
        ) : (
          <Input
            type="text"
            value={condition.field}
            onChange={(e) => handleFieldChange(condition.id, e.target.value)}
            label=""
            disabled={disabled}
            placeholder="Enter field name"
            className="min-w-[180px] h-10"
          />
        )}
      </div>

      {/* Field Type - Read-only, determined by schema */}
      <div className="flex flex-col min-w-[80px]">
        <label className="text-xs font-medium text-gray-700 mb-1 h-4">Type</label>
        <div className="min-w-[80px] h-10 px-2 py-2 bg-gray-100 border border-gray-300 rounded text-xs text-gray-700 text-center flex items-center justify-center">
          {condition.fieldType}
        </div>
      </div>
      
      {/* Operator */}
      <div className="flex flex-col min-w-[100px]">
        <label className="text-xs font-medium text-gray-700 mb-1 h-4">Operator</label>
        <div className="h-10">
          <Select
            options={operatorOptions}
            value={condition.operator}
            onChange={(e) => updateCondition(condition.id, { operator: e.target.value })}
            label=""
            disabled={disabled}
            className="min-w-[100px] h-10"
            style={{ lineHeight: '1.2', paddingTop: '2px', paddingBottom: '2px' }}
          />
        </div>
      </div>
      
      {/* Value */}
      <div className="flex flex-col min-w-[140px] flex-1">
        <label className="text-xs font-medium text-gray-700 mb-1 h-4">
          Value {condition.fieldType && `(${condition.fieldType})`}
        </label>
        <div className="h-10">
          {condition.fieldType === 'boolean' ? (
            <Select
              options={[
                { label: 'Select value...', value: '' },
                { label: 'true', value: 'true' },
                { label: 'false', value: 'false' }
              ]}
              value={condition.value}
              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
              label=""
              disabled={disabled}
              className="min-w-[100px] h-10"
            />
          ) : condition.fieldType === 'integer' ? (
            <Input
              type="number"
              value={condition.value}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (!isNaN(Number(value)) && Number.isInteger(Number(value)))) {
                  updateCondition(condition.id, { value });
                }
              }}
              label=""
              disabled={disabled}
              className="min-w-[100px] h-10"
              placeholder="Enter integer..."
            />
          ) : condition.fieldType === 'string' ? (
            <Input
              type="text"
              value={condition.value}
              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
              label=""
              disabled={disabled}
              className="min-w-[140px] h-10"
              placeholder="Enter text value..."
            />
          ) : (
            <Input
              type="text"
              value={condition.value}
              onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
              label=""
              disabled={disabled}
              className="min-w-[140px] h-10"
              placeholder="Enter value..."
            />
          )}
        </div>
        {/* Validation indicator */}
        {condition.value && !validateValue(condition.value, condition.fieldType) && (
          <div className="text-xs text-red-600 mt-1">
            Invalid {condition.fieldType} value
          </div>
        )}
      </div>
      
      {/* Delete Button */}
      <div className="flex flex-col">
        <label className="text-xs text-transparent mb-1 h-4">Delete</label>
        <div className="h-10">
          <Button
            type="button"
            color="red"
            icon={DeleteTrash}
            iconPosition="center"
            tableButton={true}
            padding={false}
            className="p-2 h-10 w-10"
            onClick={() => deleteCondition(condition.id)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );

  // Render drop zone
  const renderDropZone = (parentId: string, position: number) => {
    const isActive = dragOverTarget?.parentId === parentId && dragOverTarget?.position === position;
    return (
      <div
        key={`drop-zone-${parentId}-${position}`}
        className={`h-3 transition-all duration-200 ${
          isActive
            ? 'bg-blue-200 border-2 border-dashed border-blue-400 rounded-md'
            : 'hover:bg-blue-100 border border-transparent rounded-md opacity-0 hover:opacity-100'
        }`}
        onDragOver={(e) => handleDragOver(e, parentId, position)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, parentId, position)}
      >
        {isActive && (
          <div className="text-xs text-blue-600 text-center py-1">
            Drop here
          </div>
        )}
      </div>
    );
  };

  // Available color options for groups
  const colorOptions = [
    { name: 'White', bg: '#ffffff', border: '#9ca3af', darker: '#f3f4f6' },
    { name: 'Blue', bg: '#bfdbfe', border: '#3b82f6', darker: '#93c5fd' },
    { name: 'Green', bg: '#bbf7d0', border: '#10b981', darker: '#86efac' },
    { name: 'Purple', bg: '#d8b4fe', border: '#8b5cf6', darker: '#c4b5fd' },
    { name: 'Orange', bg: '#fed7aa', border: '#f97316', darker: '#fdba74' },
    { name: 'Pink', bg: '#fce7f3', border: '#ec4899', darker: '#f9a8d4' },
    { name: 'Yellow', bg: '#fef3c7', border: '#f59e0b', darker: '#fde68a' },
    { name: 'Red', bg: '#fecaca', border: '#ef4444', darker: '#fca5a5' },
  ];

  // Get group colors based on custom selection or default white
  const getGroupColors = (groupId: string, isHighlighted: boolean = false) => {
    const selectedColor = groupColors[groupId];
    const customColor = customColors[groupId];
    
    // If color picker is open for this group, show live preview of temp color
    if (showColorPicker === groupId && tempCustomColor) {
      const darkerTemp = adjustColorBrightness(tempCustomColor, -20);
      return {
        bg: isHighlighted ? darkerTemp : tempCustomColor,
        border: adjustColorBrightness(tempCustomColor, -40)
      };
    }
    
    // If it's a custom color
    if (selectedColor === 'custom' && customColor) {
      const darkerCustom = adjustColorBrightness(customColor, -20);
      return {
        bg: isHighlighted ? darkerCustom : customColor,
        border: adjustColorBrightness(customColor, -40)
      };
    }
    
    // Use predefined color
    const colorOption = colorOptions.find(c => c.name === selectedColor) || colorOptions[0]; // Default to white
    
    return {
      bg: isHighlighted ? colorOption.darker : colorOption.bg,
      border: colorOption.border
    };
  };

  // Helper function to adjust color brightness
  const adjustColorBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  // Set group color
  const setGroupColor = (groupId: string, colorName: string) => {
    setGroupColors(prev => ({
      ...prev,
      [groupId]: colorName
    }));
    setShowColorPicker(null);
  };

  // TODO: Raw filter validation - commented out for now, will revisit later
  // const validateRawFilter = useCallback((filterText: string): { isValid: boolean; error?: string } => {
  //   if (!filterText.trim()) {
  //     return { isValid: true }; // Empty is valid
  //   }
  //   // Validation logic temporarily disabled
  //   return { isValid: true };
  // }, [schema, schemaFields]);

  // Temporary placeholder - always returns valid for now
  const validateRawFilter = useCallback((filterText: string): { isValid: boolean; error?: string } => {
    return { isValid: true }; // Always valid for now
  }, []);

  // Parse raw filter text into visual filter tree structure
  const parseRawFilter = useCallback((filterText: string): FilterGroup | null => {
    if (!filterText.trim()) {
      return {
        id: 'root',
        type: 'group',
        conditions: []
      };
    }

    try {
      // Simple parser for basic filter expressions
      const rootGroup: FilterGroup = {
        id: 'root',
        type: 'group',
        conditions: []
      };

      // Split by main logical operators (and/or) while preserving parentheses
      const tokens = tokenizeFilter(filterText);
      let currentGroup = rootGroup;
      let pendingCondition: FilterCondition | null = null;
      let pendingOperator: 'AND' | 'OR' | null = null;

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i].trim();
        
        if (token.toLowerCase() === 'and' || token.toLowerCase() === 'or') {
          pendingOperator = token.toUpperCase() as 'AND' | 'OR';
        } else if (token.startsWith('(') && token.endsWith(')')) {
          // Handle grouped expressions
          const innerExpression = token.slice(1, -1);
          const innerGroup = parseRawFilter(innerExpression);
          if (innerGroup && innerGroup.conditions.length > 0) {
            const newGroup: FilterGroup = {
              id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'group',
              conditions: innerGroup.conditions
            };
            currentGroup.conditions.push(newGroup);
            if (pendingOperator && currentGroup.conditions.length > 1) {
              const prevCondition = currentGroup.conditions[currentGroup.conditions.length - 2];
              setConditionOperators(prev => ({
                ...prev,
                [prevCondition.id]: pendingOperator!
              }));
            }
          }
        } else {
          // Parse individual condition
          const condition = parseCondition(token);
          if (condition) {
            currentGroup.conditions.push(condition);
            if (pendingOperator && currentGroup.conditions.length > 1) {
              const prevCondition = currentGroup.conditions[currentGroup.conditions.length - 2];
              setConditionOperators(prev => ({
                ...prev,
                [prevCondition.id]: pendingOperator!
              }));
            }
          }
        }
        pendingOperator = null;
      }

      return rootGroup;
    } catch (error) {
      console.warn('Failed to parse filter:', error);
      return null;
    }
  }, []);

  // Tokenize filter string while respecting parentheses and quotes
  const tokenizeFilter = (filterText: string): string[] => {
    const tokens: string[] = [];
    let current = '';
    let parenDepth = 0;
    let inQuote = false;
    let i = 0;

    while (i < filterText.length) {
      const char = filterText[i];
      const nextChars = filterText.slice(i, i + 4).toLowerCase();

      if (char === "'" && (i === 0 || filterText[i - 1] !== '\\')) {
        inQuote = !inQuote;
        current += char;
      } else if (!inQuote) {
        if (char === '(') {
          parenDepth++;
          current += char;
        } else if (char === ')') {
          parenDepth--;
          current += char;
        } else if (parenDepth === 0 && (nextChars.startsWith('and ') || nextChars.startsWith('or '))) {
          // Found logical operator at root level
          if (current.trim()) {
            tokens.push(current.trim());
            current = '';
          }
          tokens.push(nextChars.startsWith('and ') ? 'and' : 'or');
          i += nextChars.startsWith('and ') ? 3 : 2; // Skip the operator
        } else {
          current += char;
        }
      } else {
        current += char;
      }
      i++;
    }

    if (current.trim()) {
      tokens.push(current.trim());
    }

    return tokens;
  };

  // Parse individual condition from string like "field = 'value'"
  const parseCondition = (conditionStr: string): FilterCondition | null => {
    try {
      // Match pattern: field operator value
      const conditionRegex = /^(\w+(?:\.\w+)*(?:\[\d+\])?)\s*([=!<>]+)\s*(.+)$/;
      const match = conditionStr.match(conditionRegex);

      if (!match) return null;

      const [, fieldPart, operator, valuePart] = match;
      
      // Determine field type from schema
      const baseField = fieldPart.replace(/\[\d+\]$/, '').replace(/\.\w+$/, '');
      const schemaField = schemaFields.find(f =>
        f.field === baseField ||
        f.field === fieldPart ||
        fieldPart.startsWith(f.field + '.')
      );
      
      const fieldType = schemaField?.type || 'string';
      
      // Clean up value (remove quotes for strings)
      let cleanValue = valuePart.trim();
      if (cleanValue.startsWith("'") && cleanValue.endsWith("'")) {
        cleanValue = cleanValue.slice(1, -1);
      }

      const condition: FilterCondition = {
        id: `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        field: fieldPart.includes('[') ? fieldPart.split('[')[0] : fieldPart,
        fieldType: fieldType as FilterCondition['fieldType'],
        operator: operator,
        value: cleanValue,
        valueType: 'literal'
      };

      // Handle array index
      const arrayMatch = fieldPart.match(/\[(\d+)\]/);
      if (arrayMatch) {
        condition.arrayIndex = arrayMatch[1];
        condition.fieldType = 'array';
      }

      return condition;
    } catch (error) {
      console.warn('Failed to parse condition:', conditionStr, error);
      return null;
    }
  };

  // Apply custom group color (only when Apply button is clicked)
  const applyCustomGroupColor = (groupId: string) => {
    setGroupColors(prev => ({
      ...prev,
      [groupId]: 'custom'
    }));
    setCustomColors(prev => ({
      ...prev,
      [groupId]: tempCustomColor
    }));
    setShowColorPicker(null);
  };

  // Initialize temp color when opening picker
  const openColorPicker = (groupId: string) => {
    const currentCustomColor = customColors[groupId] || '#ffffff';
    setTempCustomColor(currentCustomColor);
    setShowColorPicker(showColorPicker === groupId ? null : groupId);
  };

  // Expose validation method to parent components
  useImperativeHandle(ref, () => ({
    validateFilter: () => {
      const validation = validateRawFilter(rawFilter);
      if (!validation.isValid && validation.error) {
        setFilterValidationError(validation.error);
        setShowValidationPopup(true);
      }
      return validation;
    }
  }), [validateRawFilter, rawFilter]);

  // Render group with proper nesting and drag/drop support
  const renderGroup = (group: FilterGroup, level: number = 0): React.ReactNode => {
    const colors = getGroupColors(group.id, highlightedGroup === group.id);
    
    return (
      <div
        key={group.id}
        className={`relative transition-all rounded-lg p-4 ${
          level > 0
            ? `ml-4 cursor-grab active:cursor-grabbing ${
                draggedElement?.id === group.id ? 'opacity-50 scale-95' : ''
              }`
            : ''
        }`}
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: '2px',
          borderStyle: 'solid'
        }}
        draggable={level > 0 && !disabled}
        onDragStart={level > 0 ? (e) => handleDragStart(e, group.id, 'group', 'root') : undefined}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          setHighlightedGroup(highlightedGroup === group.id ? null : group.id);
        }}
      >
      {/* Group Header */}
      {level > 0 && (
        <div className="flex items-center justify-between mb-4 bg-white rounded-md p-3 border border-blue-200 relative">
          <div className="flex items-center gap-3">
            {/* Drag Handle for Groups */}
            <div className="flex flex-col justify-center text-blue-400 hover:text-blue-600 cursor-grab active:cursor-grabbing">
              <div className="w-2 h-2 bg-blue-400 rounded-full mb-1"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full mb-1"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            </div>
            <span className="text-sm font-semibold text-blue-800">Group</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Group Color Label and Picker */}
            <span className="text-xs text-gray-600">Group color:</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openColorPicker(group.id);
              }}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Change group color"
            >
              <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center" style={{ backgroundColor: getGroupColors(group.id).bg }}>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
            </button>
            
            <Button
              type="button"
              color="red"
              icon={DeleteTrash}
              iconPosition="center"
              tableButton={true}
              padding={false}
              className="p-2"
              onClick={() => deleteElement(group.id)}
              disabled={disabled}
            />
          </div>
          
          {/* Color Picker Dropdown */}
          {showColorPicker === group.id && (
            <div className="color-picker-container absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-700 mb-2">Preset colors:</div>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setGroupColor(group.id, color.name)}
                      className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.bg, borderColor: color.border }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="text-xs font-medium text-gray-700 mb-2">Custom color:</div>
                <div className="flex gap-2 items-center mb-3">
                  <input
                    type="color"
                    value={tempCustomColor}
                    onChange={(e) => setTempCustomColor(e.target.value)}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    title="Pick custom color"
                  />
                  <input
                    type="text"
                    value={tempCustomColor}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^#[0-9A-Fa-f]{6}$/.test(value) || value === '') {
                        setTempCustomColor(value || '#ffffff');
                      }
                    }}
                    placeholder="#ffffff"
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    color="blue"
                    text="Apply"
                    onClick={() => applyCustomGroupColor(group.id)}
                    className="flex-1 text-xs py-1"
                  />
                  <Button
                    type="button"
                    color="gray"
                    text="Cancel"
                    onClick={() => setShowColorPicker(null)}
                    className="flex-1 text-xs py-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Drop zone at the beginning */}
      {renderDropZone(group.id, 0)}

      {/* Render conditions and nested groups */}
      <div className="space-y-2">
        {group.conditions.map((element, index) => (
          <div key={element.id}>
            {/* Logical operator display between elements */}
            {index > 0 && (
              <div className="flex justify-center py-2">
                {(() => {
                  const prevElement = group.conditions[index - 1];
                  const operator = conditionOperators[prevElement.id] || 'AND';
                  return (
                    <div className="flex items-center gap-2">
                      <Select
                        options={logicalOperators}
                        value={operator}
                        onChange={(e) => updateConditionOperator(prevElement.id, e.target.value as 'AND' | 'OR')}
                        label=""
                        disabled={disabled}
                        className="min-w-[80px]"
                      />
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Render the element */}
            {'field' in element ? renderCondition(element, group.id) : renderGroup(element, level + 1)}
            
            {/* Drop zone after each element */}
            {renderDropZone(group.id, index + 1)}
          </div>
        ))}
      </div>

      {/* Add buttons */}
      <div className="flex justify-center gap-3 mt-6">
        <Button
          type="button"
          color="green"
          icon={Plus}
          text="Add Condition"
          onClick={() => addCondition(group.id)}
          disabled={disabled}
        />
        <Button
          type="button"
          color="blue"
          icon={Plus}
          text="Add Group"
          onClick={() => addGroup(group.id)}
          disabled={disabled}
        />
        </div>
      </div>
    );
  };

  // Improved quick examples with direct template usage
  const quickExamples = [
    {
      label: 'String Field',
      template: {
        field: 'stringField',
        fieldType: 'string' as const,
        operator: '=',
        value: 'example'
      }
    },
    {
      label: 'Number Field',
      template: {
        field: 'integerField',
        fieldType: 'integer' as const,
        operator: '>',
        value: '10'
      }
    },
    {
      label: 'Boolean Field',
      template: {
        field: 'booleanField',
        fieldType: 'boolean' as const,
        operator: '=',
        value: 'true'
      }
    },
    {
      label: 'Document Field',
      template: {
        field: 'document',
        fieldType: 'document' as const,
        documentPath: 'subfield',
        operator: '=',
        value: 'value'
      }
    },
    {
      label: 'Array Element',
      template: {
        field: 'arrayField',
        fieldType: 'array' as const,
        arrayIndex: '0',
        operator: '=',
        value: 'item'
      }
    }
  ];

  return (
    <div className="flex flex-col mb-6">
      <label className="font-roboto flex gap-2 items-center mb-2">
        {label}
      </label>
      
      <div className="space-y-4">
        {/* Toggle between visual and text mode */}
        <div className="flex gap-2">
          <Button
            type="button"
            color={!showAdvanced ? "blue" : "gray"}
            text="Visual Builder"
            onClick={() => {
              if (showAdvanced && rawFilter.trim()) {
                // Parse raw filter and convert to visual mode
                const parsedTree = parseRawFilter(rawFilter);
                if (parsedTree) {
                  setFilterTree(parsedTree);
                }
              }
              setShowAdvanced(false);
            }}
            disabled={disabled}
          />
          <Button
            type="button"
            color={showAdvanced ? "blue" : "gray"}
            text="Raw Text"
            onClick={() => setShowAdvanced(true)}
            disabled={disabled}
          />
        </div>
        
        {showAdvanced ? (
          // Raw text mode
          <div>
            <textarea
              name={name}
              value={rawFilter}
              onChange={(e) => {
                const newValue = e.target.value;
                setRawFilter(newValue);
                // Clear any previous validation errors when user starts typing
                if (filterValidationError) {
                  setFilterValidationError(null);
                }
                if (onChange) onChange(newValue);
              }}
              className={`w-full h-32 p-3 border rounded-lg resize-vertical font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                filterValidationError ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter filter expression manually..."
              disabled={disabled}
            />
            <div className="text-xs text-gray-600 mt-2 space-y-1">
              <div><strong>Examples:</strong></div>
              <div>• Simple: <code>field = 'value'</code></div>
              <div>• Multiple: <code>field1 = 'a' and field2 = 'b'</code></div>
              <div>• Complex: <code>(field1 = 'a' or field2 = 'b') and field3 = 'c'</code></div>
            </div>
          </div>
        ) : (
          // Visual builder mode
          <div>
            {filterTree.conditions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <p className="text-gray-500 mb-4 text-lg">No filter conditions yet</p>
                <p className="text-gray-400 mb-6 text-sm">Start building your filter by adding a condition</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    type="button"
                    color="green"
                    icon={Plus}
                    text="Add First Condition"
                    onClick={() => addCondition('root')}
                    disabled={disabled}
                  />
                  <Button
                    type="button"
                    color="blue"
                    icon={Plus}
                    text="Add Group"
                    onClick={() => addGroup('root')}
                    disabled={disabled}
                  />
                </div>
              </div>
            ) : (
              renderGroup(filterTree)
            )}
          </div>
        )}
        

        {/* No Schema Message */}
        {!showAdvanced && (!schema || schemaFields.length === 0) && (
          <div className="border-t border-gray-200 pt-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-yellow-800 mb-2">No Schema Available</div>
              <div className="text-xs text-yellow-700">
                Please select a topic first to load its schema. The filter builder requires a schema to ensure you can only select valid fields and use correct data types.
              </div>
            </div>
          </div>
        )}

        {/* Generated filter preview */}
        {rawFilter && (
          <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">Generated Filter:</div>
            <code className="text-sm text-gray-800 break-all">{rawFilter}</code>
          </div>
        )}

        {/* Documentation */}
        <div className="text-xs text-gray-600 space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="font-semibold text-blue-800">Universal Messaging Filter Examples:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            <div>• String: <code className="bg-white px-1 rounded">stringField = 'abc'</code></div>
            <div>• Document: <code className="bg-white px-1 rounded">document.stringField = 'abc'</code></div>
            <div>• Array: <code className="bg-white px-1 rounded">stringList[1] = 'b'</code></div>
            <div>• Document List: <code className="bg-white px-1 rounded">documentList[0].stringField = 'a'</code></div>
          </div>
          <div>• Complex: <code className="bg-white px-1 rounded">(field1 = 'a' and field2 = 'b') or field3 = 'c'</code></div>
        </div>
      </div>
      
      {error && (
        <p className="text-red text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded">{error.errorMessage}</p>
      )}

      {/* Field Picker Popup */}
      {showFieldPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] w-full mx-4 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Select Field from Schema</h3>
              <Button
                type="button"
                color="gray"
                icon={X}
                iconPosition="center"
                tableButton={true}
                padding={false}
                className="p-2"
                onClick={() => {
                  setShowFieldPicker(false);
                  setEditingConditionId(null);
                  delete (window as any).pendingGroupId;
                }}
              />
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Instructions:</strong> Click on any primitive field (string, integer, boolean) to select it for your filter condition.
                  Only leaf fields can be used in filters.
                </p>
              </div>
              
              {treeData.length > 0 ? (
                <div
                  className="border rounded-md bg-primary shadow-md"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    // Find the closest element with data-node-id
                    const nodeElement = target.closest('[data-node-id]') as HTMLElement;
                    if (nodeElement) {
                      const nodeId = parseInt(nodeElement.getAttribute('data-node-id') || '0');
                      if (nodeId) {
                        handleTreeNodeClick(nodeId);
                      }
                    }
                  }}
                >
                  <ClickableSchemeTree
                    treeData={treeData}
                    onNodeClick={handleTreeNodeClick}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No schema fields available
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <Button
                type="button"
                color="gray"
                text="Cancel"
                onClick={() => {
                  setShowFieldPicker(false);
                  setEditingConditionId(null);
                  delete (window as any).pendingGroupId;
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Array Index Picker Popup */}
      {showArrayIndexPicker && selectedFieldForArrays && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Specify Array Index</h3>
              <Button
                type="button"
                color="gray"
                icon={X}
                iconPosition="center"
                tableButton={true}
                padding={false}
                className="p-2"
                onClick={() => {
                  setShowArrayIndexPicker(false);
                  setSelectedFieldForArrays(null);
                  setArrayIndices({});
                }}
              />
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Selected Field:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{selectedFieldForArrays.path}</code>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  This field path contains arrays. Please specify the array indices (0-based) for each array in the path:
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Complete Path with Array Indices:
                  </label>
                  
                  {/* Visual path builder */}
                  <div className="bg-gray-50 border rounded-lg p-4 font-mono text-sm">
                    <div className="flex flex-wrap items-center gap-1">
                      {selectedFieldForArrays.segments.map((segment, index) => (
                        <React.Fragment key={index}>
                          {index > 0 && <span className="text-gray-400">.</span>}
                          
                          <span className="text-gray-800 font-medium">{segment.name}</span>
                          
                          {segment.isArray && (
                            <>
                              <span className="text-blue-600 font-bold">[</span>
                              <input
                                type="number"
                                value={arrayIndices[`array_${index}`] || '0'}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  // Convert leading zeros: "01" -> "1", "0000" -> "0", "00012" -> "12"
                                  const convertedValue = inputValue === '' ? '' : Number(inputValue).toString();
                                  setArrayIndices({
                                    ...arrayIndices,
                                    [`array_${index}`]: convertedValue
                                  });
                                }}
                                min="0"
                                step="1"
                                className={`w-20 h-10 text-center inline-block mx-1 border rounded px-2 focus:outline-none focus:ring-2 ${
                                  arrayIndices[`array_${index}`] === '' || arrayIndices[`array_${index}`] === undefined || Number(arrayIndices[`array_${index}`]) < 0
                                    ? 'border-red-500 bg-red-50 focus:ring-red-200'
                                    : 'border-gray-300 focus:ring-blue-200'
                                }`}
                                style={{ display: 'inline-block', width: '80px', height: '40px' }}
                              />
                              <span className="text-blue-600 font-bold">]</span>
                            </>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                      <strong>Preview:</strong> {(() => {
                        let preview = '';
                        let isValid = true;
                        selectedFieldForArrays.segments.forEach((segment, index) => {
                          if (index > 0) preview += '.';
                          preview += segment.name;
                          if (segment.isArray) {
                            const indexValue = arrayIndices[`array_${index}`];
                            if (indexValue === '' || indexValue === undefined) {
                              preview += `[❌]`;
                              isValid = false;
                            } else {
                              // Show converted value in preview
                              const convertedValue = Number(indexValue).toString();
                              preview += `[${convertedValue}]`;
                            }
                          }
                        });
                        return (
                          <span className={isValid ? 'text-green-600' : 'text-red-600'}>
                            {preview}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500 space-y-1">
                    <p><strong>Tips:</strong></p>
                    <p>• Use 0 for the first element, 1 for the second element, etc.</p>
                    <p>• Each array in the path needs its own index (required, minimum 0)</p>
                    <p>• The preview shows exactly what will be added to your filter</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <Button
                type="button"
                color="gray"
                text="Cancel"
                onClick={() => {
                  setShowArrayIndexPicker(false);
                  setSelectedFieldForArrays(null);
                  setArrayIndices({});
                }}
                className="flex-1"
              />
              <Button
                type="button"
                color="green"
                text="Add to Filter"
                onClick={handleArrayIndicesComplete}
                disabled={!validateArrayIndices()}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Validation Error Popup */}
      {showValidationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-red-600">Invalid Filter Expression</h3>
              <Button
                type="button"
                color="gray"
                icon={X}
                iconPosition="center"
                tableButton={true}
                padding={false}
                className="p-2"
                onClick={() => setShowValidationPopup(false)}
              />
            </div>
            
            <div className="p-4">
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {filterValidationError}
                </p>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Common filter syntax:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Simple: <code className="bg-gray-100 px-1 rounded">field = 'value'</code></li>
                  <li>Multiple: <code className="bg-gray-100 px-1 rounded">field1 = 'a' and field2 = 'b'</code></li>
                  <li>Array: <code className="bg-gray-100 px-1 rounded">arrayField[0] = 'item'</code></li>
                  <li>Grouped: <code className="bg-gray-100 px-1 rounded">(field1 = 'a' or field2 = 'b') and field3 = 'c'</code></li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <Button
                type="button"
                color="blue"
                text="Switch to Visual Builder"
                onClick={() => {
                  setShowAdvanced(false);
                  setShowValidationPopup(false);
                }}
                className="flex-1"
              />
              <Button
                type="button"
                color="gray"
                text="Fix Manually"
                onClick={() => setShowValidationPopup(false)}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Custom SchemeTree wrapper that looks exactly like the real SchemeTree but with click handling for field selection
  function ClickableSchemeTree({ treeData, onNodeClick }: { treeData: TreeNode[], onNodeClick: (nodeId: number) => void }) {
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

    // Auto-expand all nodes when tree loads
    useEffect(() => {
      const allNodeIds = new Set<number>();
      
      const collectIds = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          allNodeIds.add(node.id);
          const children = nodes.filter(n => n.parent === node.id);
          if (children.length > 0) {
            collectIds(children);
          }
        });
      };
      
      collectIds(treeData);
      setExpandedNodes(allNodeIds);
    }, [treeData]);

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

    const getChildren = (parentId: number) => {
      return treeData.filter(node => node.parent === parentId);
    };

    const renderIcon = (node: TreeNode, isExpanded: boolean) => {
      if (node.metadata.type === "object" || (node.metadata.type === "array" && node.metadata.array === "document")) {
        return isExpanded ? <FolderOpen className="text-gray-dark text-xl" /> : <Folder className="text-gray-dark text-xl" />;
      }
      return <TextField className="text-gray-dark text-xl" />;
    };

    const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
      const children = getChildren(node.id);
      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = children.length > 0;
      const isSelectable = node.metadata.type &&
                          (['string', 'integer', 'boolean'].includes(node.metadata.type) ||
                           (node.metadata.type === 'array' && node.metadata.array === 'string')) &&
                          node.metadata.type !== 'object';
      
      return (
        <div key={node.id} style={{ marginLeft: level * 20 }}>
          <div
            className={`group flex items-center justify-between bg-white rounded-md px-3 py-2 my-1 transition-all duration-200 cursor-pointer
              ${isSelectable
                ? 'hover:bg-green-100 hover:border-green-400 hover:shadow-md border border-transparent'
                : 'hover:bg-gray-50'
              }
            `}
            data-node-id={node.id}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren && !isSelectable) {
                toggleExpansion(node.id);
              } else if (isSelectable) {
                onNodeClick(node.id);
              }
            }}
          >
            <div className="flex items-center gap-2 flex-1">
              {renderIcon(node, isExpanded)}
              <span className={`text-sm transition-colors duration-200 ${
                isSelectable
                  ? 'group-hover:text-green-800 group-hover:font-semibold'
                  : ''
              }`}>
                {node.name}
                {node.metadata.required === "yes" && (
                  <span className="text-red font-bold ml-1" title="Required">*</span>
                )}
                <span className={`text-xs ml-2 text-gray transition-colors duration-200 ${
                  isSelectable ? 'group-hover:text-green-700' : ''
                }`}>
                  {node.metadata.type === "array"
                    ? node.metadata.array === "document" ? "(Document list)" : "(String list)"
                    : node.metadata.type ? `(${node.metadata.type})` : ""
                  }
                </span>
              </span>
            </div>
            
            {/* Hover indicator for selectable fields */}
            {isSelectable && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-green-700 text-xs font-semibold">
                Click to select
              </div>
            )}
          </div>

          {isExpanded && hasChildren && (
            <div>
              {children.map(child => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    };

    const rootNodes = treeData.filter(node => node.parent === 0 || node.parent === 1);
    
    return (
      <div className="px-6 py-3">
        <div className="space-y-1">
          {rootNodes.map(node => renderNode(node))}
        </div>
      </div>
    );
  }
});

FilterBuilder.displayName = 'FilterBuilder';

export default FilterBuilder;