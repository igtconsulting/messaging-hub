package MessagingHub.v1.MessagingHubDescriptor_.services;

// -----( IS Java Code Template v1.2

import com.wm.data.*;
import com.wm.util.Values;
import com.wm.app.b2b.server.Service;
import com.wm.app.b2b.server.ServiceException;
// --- <<IS-START-IMPORTS>> ---
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Map.Entry;
import java.util.Set;
import java.util.function.Consumer;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;
import com.ibm.icu.text.DisplayContext.Type;
import com.wm.app.b2b.broker.UMUtil;
import com.wm.app.b2b.broker.conv.Transformer;
import com.wm.app.b2b.server.Package;
import com.wm.app.b2b.server.PackageManager;
import com.wm.app.b2b.server.dispatcher.DispatchFacade;
import com.wm.app.b2b.server.dispatcher.wmmessaging.UMConnectionAlias;
import com.wm.app.b2b.server.invoke.InvokeManager;
import com.wm.app.b2b.server.ns.Namespace;
import com.wm.data.IData;
import com.wm.data.IDataCursor;
import com.wm.data.IDataUtil;
import com.wm.lang.ns.EventDescription;
import com.wm.lang.ns.NSField;
import com.wm.lang.ns.NSName;
import com.wm.lang.ns.NSRecord;
import com.wm.lang.ns.NSRecordRef;
import com.wm.lang.ns.NSRecordUtil;
import com.wm.lang.ns.NSNode;
import com.wm.util.coder.ProtobufUtil;
import com.wm.util.coder.IDataProtoBufCoder;
import com.wm.lang.ns.NSInterface;
import com.wm.lang.ns.NSType;
import com.wm.app.b2b.server.ACLManager;
import java.util.Arrays;
import com.pcbsys.nirvana.client.nChannel;
import com.pcbsys.nirvana.client.nDurable;
// --- <<IS-END-IMPORTS>> ---

public final class impl

{
	// ---( internal utility methods )---

	final static impl _instance = new impl();

	static impl _newInstance() { return new impl(); }

	static impl _cast(Object o) { return (impl)o; }

	// ---( server methods )---




	public static final void getDocTypeMessagingDetails (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getDocTypeMessagingDetails)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [o] field:0:required aliasName
		// [o] field:0:required umChannelPath
		IDataCursor pipelineCursor = pipeline.getCursor();
		String	docType = IDataUtil.getString( pipelineCursor, "documentType" );
		
		NSRecord nsRec = (NSRecord) Namespace.current().getNode(docType);
		Values eventDesc = (Values) nsRec.getValues().get("eventDescription");
		
		String umPath = eventDesc.getValue("brokerEventTypeName").toString();
		String messagingAlias = eventDesc.getValue("aliasName").toString();
		umPath = "/" + umPath.replace("::", "/");
		
		if (messagingAlias.isEmpty()){
			messagingAlias = "DEFAULT";
		}
		IDataUtil.put(pipelineCursor, "aliasName", messagingAlias);
		IDataUtil.put(pipelineCursor, "umChannelPath", umPath);
		// --- <<IS-END>> ---

                
	}

	// --- <<IS-START-SHARED>> ---
	
	public static List<String> getChildList(NSNode baseNode){
		
		List<String> resultSet = new ArrayList<String>();
		Namespace.getInterface(baseNode.getNSName());
		
	
		NSType[] interfaceTypeList = {NSType.create("interface")};
		NSNode[] nodeList =  Namespace.getInterface(baseNode.getNSName()).getNodesByType(interfaceTypeList);
		
		for (NSNode currNode: nodeList){
			
			List<String> currList = getChildList(currNode); 
			
			for (String currString: currList){
				resultSet.add(currString);
			}
		}
		
		NSType[] recordTypeList = {NSType.create("record")};
		
		NSNode[] nodeListRecord =  Namespace.getInterface(baseNode.getNSName()).getNodesByType(recordTypeList);
		for (NSNode currNodeRecord: nodeListRecord){
			resultSet.add(currNodeRecord.getNSName().toString());
		}	
		return resultSet;
	}
	
	public static IData convertIDataTypes(IData source, NSRecord schema) throws ServiceException {
		IDataCursor cursor = source.getCursor();
	
		while(cursor.next()) {
			String nextKey = cursor.getKey();
			Object nextData = cursor.getValue();
			
			NSField schemaField = schema.getFieldByName(nextKey);
			if (Objects.nonNull(schemaField)){
				if (nextData instanceof IData) {
					cursor.setValue(convertIDataTypes((IData) nextData, (NSRecord) schemaField));
						
				} else if (nextData instanceof IData[]) {
					
					final IData[] subDocuments = (IData[]) nextData;
					for (IData subDocument : subDocuments) {
						subDocument = convertIDataTypes( subDocument, (NSRecord) schemaField);
					}
					cursor.setValue(subDocuments);
				} else  { 
					String expectedType = schemaField.getJavaWrapperTypeString();
					try {
						Class expectedClass = Class.forName(expectedType);
						
						if (!nextData.getClass().equals(expectedClass) ){
							Object val = null;
							switch (expectedType) {
							  case "UNKNOWN":
							    val = nextData.toString();
							    break;
							  case "java.lang.Boolean":
							    val = Boolean.valueOf(nextData.toString());
							    break;
							  case "java.lang.Double":
								  val = Double.valueOf(nextData.toString());
							    break;
							  case "java.lang.Integer":
								  val = Integer.valueOf(nextData.toString());
							    break;
							  case "java.lang.Long":
								  val = Long.valueOf(nextData.toString());
							    break;
							  case "java.lang.Float":
								  val = Float.valueOf(nextData.toString());
							    break;	  
							}
							if (Objects.nonNull(val)) cursor.setValue(val);
						}							
							
					} catch (ClassNotFoundException e) {
						throw new ServiceException(e);
					}
				}
			}
		}
		cursor.destroy();
		
		return source;
	}
	
	
	
	public static JsonObject processRecordFields(NSRecord record) throws ServiceException{
		
		Namespace ns = Namespace.current();
		NSField[] baseFieldList = record.getActualFields();
		
		JsonObject properties = new JsonObject();
		
		for(NSField baseField: baseFieldList){
			
			JsonObject jsonField = new JsonObject();
		   				
			String name = baseField.getName();
			if(name.equalsIgnoreCase("_env") || name.equalsIgnoreCase("esbDocid")) continue;
			
			//String required = String.valueOf(!baseField.isOptional());
			Boolean allowNull = baseField.isNillable();
			String type = decodeFieldType(baseField.getType());
			String dimension = decodeDimension(baseField.getDimensions());
			//String javaType = baseField.getJavaWrapperTypeString();
			int javaType = baseField.getJavaWrapperType();
						
			//jsonField.addProperty("name", name);
			//jsonField.addProperty("required", required);
			//jsonField.addProperty("allowNull", allowNull);
			NSRecord fieldRecord = null;
			if (dimension.equalsIgnoreCase("SCALAR")){
				
				if (type.equalsIgnoreCase("RECORD") || type.equalsIgnoreCase("RECORDREF")){
					
					fieldRecord = NSRecord.createRecord(ns, baseField.getValues());
					
					if(type.equalsIgnoreCase("RECORDREF")){
						NSName referencedDocType = (NSName) baseField.getValues().get("rec_ref");
						fieldRecord = (NSRecord) ns.getNode(referencedDocType);
					}
					
					String fieldType = "object";
					if(allowNull){
						JsonArray typeList = new JsonArray();
						typeList.add(new JsonPrimitive("null"));
						typeList.add(new JsonPrimitive(fieldType));
						jsonField.add("type", typeList);
					} else {
						jsonField.addProperty("type", fieldType);
					}
					
					//jsonField.addProperty("type", "object");
					jsonField.addProperty("additionalProperties", !fieldRecord.isClosed());
					jsonField.add("properties", processRecordFields(fieldRecord));					
					JsonArray requiredList = getRequiredFieldsAsArray(fieldRecord);
					if(requiredList != null){
						jsonField.add("required", requiredList);
					}
				}
				else if (type.equalsIgnoreCase("STRING")){
					String fieldType = "string";
					if(allowNull){
						JsonArray typeList = new JsonArray();
						typeList.add(new JsonPrimitive("null"));
						typeList.add(new JsonPrimitive(fieldType));
						jsonField.add("type", typeList);
					} else {
						jsonField.addProperty("type", fieldType);
					}
				}
				else if (type.equalsIgnoreCase("OBJECT")){
					String fieldType = javaWrapperIntToJsonType(javaType);
					if(fieldType==null) throw new ServiceException("Field "+name+" has type '"+baseField.getJavaWrapperTypeString()+"' which is not currently supported.");
					if(allowNull){
						JsonArray typeList = new JsonArray();
						typeList.add(new JsonPrimitive("null"));
						typeList.add(new JsonPrimitive(fieldType));
						jsonField.add("type", typeList);
					} else {
						jsonField.addProperty("type", fieldType);
					}
				}
			} else if (dimension.equalsIgnoreCase("ARRAY")){
				
				String arrayFieldType = "array";
				if(allowNull){
					JsonArray typeList = new JsonArray();
					typeList.add(new JsonPrimitive("null"));
					typeList.add(new JsonPrimitive(arrayFieldType));
					jsonField.add("type", typeList);
				} else {
					jsonField.addProperty("type", arrayFieldType);
				}
				
				JsonObject arrayItems = new JsonObject();
				
				if (type.equalsIgnoreCase("RECORD") || type.equalsIgnoreCase("RECORDREF")){
					fieldRecord = NSRecord.createRecord(ns, baseField.getValues());
										
					if(type.equalsIgnoreCase("RECORDREF")){
						NSName referencedDocType = (NSName) baseField.getValues().get("rec_ref");
						fieldRecord = (NSRecord) ns.getNode(referencedDocType);
					}
					
					String fieldType = "object";
					arrayItems.addProperty("type", fieldType);
					
					arrayItems.addProperty("additionalProperties", !fieldRecord.isClosed());
					arrayItems.add("properties", processRecordFields(fieldRecord));					
					JsonArray requiredList = getRequiredFieldsAsArray(fieldRecord);
					if(requiredList != null){
						arrayItems.add("required", requiredList);
					}
					
				}
				else if (type.equalsIgnoreCase("STRING")){
					String fieldType = "string";
					arrayItems.addProperty("type", fieldType);
				}
				else if (type.equalsIgnoreCase("OBJECT")){
					String fieldType = javaWrapperIntToJsonType(javaType);
					if(fieldType==null) throw new ServiceException("Field "+name+" has type '"+baseField.getJavaWrapperTypeString()+"' which is not currently supported.");
					arrayItems.addProperty("type", fieldType);
				}	
				JsonArray arrayItemsWrap = new JsonArray();
				arrayItemsWrap.add(arrayItems);
				jsonField.add("items", arrayItemsWrap);
				
			}
			properties.add(name, jsonField);
		}
		return properties;
	}
	public static JsonArray getRequiredFieldsAsArray(NSRecord record) throws ServiceException {
	
	JsonArray requiredList = new JsonArray();
	NSField[] baseFieldList = record.getActualFields();
	
	for(NSField baseField: baseFieldList){
		String name = baseField.getName();
		if(name.equalsIgnoreCase("_env") || name.equalsIgnoreCase("esbDocid")) continue;
		if(baseField.isOptional() == false){
			requiredList.add(new JsonPrimitive(baseField.getName()));
		}
	}
	if (requiredList.size()==0) return null;
	return requiredList;
	
	}
	public static List<NSField> processJsonFields(JsonObject jsonFields, JsonArray requiredFieldsList) throws ServiceException {
	
	List<NSField> resultList = new ArrayList<NSField>();
	
	//jsonFields.entrySet();
	
	Set<Entry<String, JsonElement>> fieldSet = jsonFields.entrySet();
	java.util.Iterator<Entry<String, JsonElement>> entryIterator = fieldSet.iterator();
	while(entryIterator.hasNext()){
		
		Entry<String, JsonElement> fieldEntry = entryIterator.next();
			
		
		String name = fieldEntry.getKey();
		
		JsonObject fieldDefinition = (JsonObject) fieldEntry.getValue();
	
		Boolean required = false;
		Boolean allowNull = false;
		Boolean allowUnspecifiedFields = true;
		
		if(requiredFieldsList.contains(new JsonPrimitive(name))){
			required = true;
		}
	
		List<String> typeList = new ArrayList<String>();
		
		if (fieldDefinition.has("type")){	
			JsonElement type = fieldDefinition.get("type");
			if(type.isJsonArray()){
				for(int idx = 0; idx<((JsonArray) type).size(); idx++){
					String currType = type.getAsJsonArray().get(idx).getAsString();
					if(currType.equalsIgnoreCase("null")) { 
	            		allowNull = true; 
	            	} else {
	            		typeList.add(currType);
	            	}
				}
	    	} else {
	    		typeList.add(type.getAsString());
	    	}
		} else throw new ServiceException("Field "+name+" is missing property type.");
			    				    
		
		NSField field = null;
		String dimension = "SCALAR";
		
		if(typeList.contains("array")){
			dimension = "ARRAY";
			
			JsonElement arrayItems = fieldDefinition.get("items");
			
			if(arrayItems.isJsonObject()){
				fieldDefinition = arrayItems.getAsJsonObject();
			} else if(arrayItems.isJsonArray()) {
				JsonArray arrayItemsDefinition = arrayItems.getAsJsonArray();
				if(arrayItemsDefinition.size() == 1) {
					fieldDefinition = arrayItemsDefinition.get(0).getAsJsonObject();
				} else throw new ServiceException("Multiple item definition for array '"+name+"' is currently not supported.");
			} else throw new ServiceException("Property 'items' of array '"+name+"' is not defined correctly.");
			
			
			//Check the array content type definition again
			typeList = new ArrayList<String>();
			if (fieldDefinition.has("type")){	
	    		JsonElement type = fieldDefinition.get("type");
	    		if(type.isJsonArray()){
	    			for(int idx = 0; idx<((JsonArray) type).size(); idx++){
	    				String currType = type.getAsJsonArray().get(idx).getAsString();
	                	typeList.add(currType);
	    			}
		    	} else {
		    		typeList.add(type.getAsString());
		    	}
	    	} else throw new ServiceException("Array field "+name+" is missing property type.");
		} 
		
	    	//TODO: add string list
		if (typeList.size() != 1){
			throw new ServiceException("Incorrect number or combination of types specified for field "+name+"."+typeList.toString());
		} 
		
		if(typeList.contains("object")){
			
			JsonObject jsonSubFields = null;
			JsonArray requiredFieldsArray = null;
			
			jsonSubFields = fieldDefinition.get("properties").getAsJsonObject();
			
			if (fieldDefinition.has("required")){
				requiredFieldsArray = fieldDefinition.get("required").getAsJsonArray();
			}
			if (fieldDefinition.has("additionalProperties")){
				allowUnspecifiedFields = fieldDefinition.get("additionalProperties").getAsBoolean();
			}	
			
			NSRecord fieldRecord = new NSRecord(Namespace.current(), name, encodeDimension(dimension));
			List<NSField> subSegmentFields = processJsonFields(jsonSubFields, requiredFieldsArray);
			
			field = NSRecordUtil.createField(name,encodeFieldType("RECORD"),encodeDimension(dimension),Namespace.current(),null);
						    		
			for(NSField subSegmentField: subSegmentFields){
			   fieldRecord.addField(subSegmentField);
			}
			
			fieldRecord.setClosed(!allowUnspecifiedFields);
			
			field.setValues(fieldRecord.getValues());
			
		} 
		else {
			//if type = string -> STRING otherwise -> OBJECT -- PROCESSING TREBA NA ZAKLADE ARRAY / NOT ARRAY nie RECORD etc
			
			field = NSRecordUtil.createField(name,encodeFieldType(typeList.get(0)),encodeDimension(dimension),Namespace.current(),null);
			if(!typeList.contains("string")){
				field.setJavaWrapperType(jsonTypeToJavaWrapperInt(typeList.get(0)));
			}
			
		}
		
		field.setNillable(allowNull);
		field.setOptional(!required);
		
		//TODO: Add node hints field.setHints(hints);
		//TODO: REQUIRED SHOULD BE BASED ON REQUIRED FIELD NOT TYPE NULL
		resultList.add(field);
		// json field types string | number | integer | object | array | boolean | null
		//fieldType = OBJECT | RECORD | RECORDREF | STRING
		//dimention = ARRAY - LISTS | SCALAR - SINGLE ITEMS | TABLE ???
	    	
	    
		
	}
	
	
	return resultList;
	}
	
	static int encodeFieldType(String fieldType){
	int type;
	if (fieldType.equalsIgnoreCase("STRING")){
		type = NSField.FIELD_STRING;
	}
	else if (fieldType.equalsIgnoreCase("RECORD")){
		type = NSField.FIELD_RECORD;
	}
	else if (fieldType.equalsIgnoreCase("RECORDREF")){
		type = NSField.FIELD_RECORDREF;
	}
	else{
		type = NSField.FIELD_OBJECT;
	}
	return type;
	}
	static String decodeFieldType(int fieldType){
	String type;
	if (fieldType == NSField.FIELD_OBJECT){
		type = "OBJECT";
	}
	else if (fieldType == NSField.FIELD_RECORD){
		type = "RECORD";
	}
	else if (fieldType == NSField.FIELD_RECORDREF){
		type = "RECORDREF";
	}
	else{
		type = "STRING";
	}
	return type;
	}
	
	
	//encode dimenstion from string
	static int encodeDimension(String dimension){
	int dim;
	if (dimension.equalsIgnoreCase("ARRAY")){
		dim = NSRecord.DIM_ARRAY;
	}
	else if (dimension.equalsIgnoreCase("TABLE")){
		dim = NSRecord.DIM_TABLE; 
	}
	else{
		dim = NSRecord.DIM_SCALAR;
	}
	return dim;
	}
	static String decodeDimension(int dimension){
	String dim;
	if (dimension == NSRecord.DIM_ARRAY){
		dim = "ARRAY";
	}
	else if (dimension == NSRecord.DIM_TABLE){
		dim = "TABLE";
	}
	else{ 
		dim = "SCALAR";
	}
	return dim;
	}
	
	static int jsonTypeToJavaWrapperInt(String type){
	int typeInt;
	if (type.equalsIgnoreCase("number")){
		typeInt = 4;
	}
	else if (type.equalsIgnoreCase("integer")){
		typeInt = 7;
	}
	else if (type.equalsIgnoreCase("boolean")){
		typeInt = 1;
	}
	else{
		typeInt = -1;
	}
	return typeInt;
	}
	// json field types string | number | integer | object | array | boolean | null
	static String javaWrapperIntToJsonType(int typeInt) throws ServiceException{
	String type = null;
	switch (typeInt) {
	  case 1:
	    type = "boolean";
	    break;
	  case 3:
		type = "string";
	    break;
	  case 4:
		type = "number";
	    break;
	  case 5:
		type = "number";
		break;
	  case 6:
		type = "integer";
		break;
	  case 7:
		type = "integer";
	    break;
	  case 8:
		type = "integer";
	    break;
	  case 9: 
		type = "integer";
	    break;
	  default:
		type = null;
	}
	return type;
	}
	// --- <<IS-END-SHARED>> ---
}

