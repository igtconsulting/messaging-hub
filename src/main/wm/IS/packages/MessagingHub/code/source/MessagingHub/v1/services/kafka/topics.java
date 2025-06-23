package MessagingHub.v1.services.kafka;

// -----( IS Java Code Template v1.2

import com.wm.data.*;
import com.wm.util.Values;
import com.wm.app.b2b.server.Service;
import com.wm.app.b2b.server.ServiceException;
// --- <<IS-START-IMPORTS>> ---
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;
import com.wm.lang.ns.NSField;
import com.wm.lang.ns.NSName;
import com.wm.lang.ns.NSNode;
import com.wm.lang.ns.NSRecord;
import com.wm.lang.ns.NSRecordUtil;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.admin.TopicDescription;
import org.apache.kafka.common.KafkaFuture;
import org.apache.kafka.common.Node;
import org.apache.kafka.clients.admin.DescribeTopicsResult;
import org.apache.kafka.clients.admin.ListTopicsOptions;
import org.apache.kafka.clients.admin.ListTopicsResult;
import java.util.Properties;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import com.wm.app.b2b.server.dispatcher.wmmessaging.UMConnectionAlias;
import com.wm.app.b2b.server.ns.Namespace;
import com.wm.app.b2b.server.dispatcher.DispatchFacade;
import com.wm.app.b2b.server.streaming.admin.ConnectionAlias;
import com.wm.app.b2b.server.dispatcher.wmmessaging.RuntimeConfiguration;
import com.wm.app.b2b.server.streaming.StreamingSubsystem;
import com.wm.app.b2b.server.streaming.StreamingSubsystemException;
// --- <<IS-END-IMPORTS>> ---

public final class topics

{
	// ---( internal utility methods )---

	final static topics _instance = new topics();

	static topics _newInstance() { return new topics(); }

	static topics _cast(Object o) { return (topics)o; }

	// ---( server methods )---




	public static final void createKafkaTopic (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(createKafkaTopic)>> ---
		// @sigtype java 3.5
		// [i] field:0:optional kafkaTopicName
		// [i] field:0:required kafkaConnectionName
		// [o] field:0:required messageFromKafka
		IDataCursor pipelineCursor = pipeline.getCursor();
		try {
		
		String kafkaTopicName = IDataUtil.getString( pipelineCursor, "kafkaTopicName");
		String kafkaConnectionName = IDataUtil.getString( pipelineCursor, "kafkaConnectionName");
		
		StreamingSubsystem ssInstance = StreamingSubsystem.getInstance();
		ConnectionAlias connAlias = ssInstance.getRuntimeConfiguration().getConnectionAlias(kafkaConnectionName);
		IData connAliasData= connAlias.getAsData(false, false); //this return everything from connection definition
		IDataCursor aliasHostCursor = connAliasData.getCursor();
		String hostString = IDataUtil.getString(aliasHostCursor, "host");
		
		// Set up Kafka properties
		Properties properties = new Properties();
		properties.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, hostString);
		
		// Create an AdminClient
		try (AdminClient adminClient = AdminClient.create(properties)) {
		
		int numPartitions = 1;
		short replicationFactor = 1;
		
		// Create a NewTopic object with the specified configurations
		NewTopic newTopic = new NewTopic(kafkaTopicName, numPartitions, replicationFactor);
		
		// Create the topic using the AdminClient
		adminClient.createTopics(Collections.singletonList(newTopic));
		
		} catch (Exception e) {
		IDataUtil.put( pipelineCursor, "messagefromKafka", "false");
		pipelineCursor.destroy();
		throw new ServiceException(e);
		}
		
		} catch (StreamingSubsystemException e) {
		IDataUtil.put( pipelineCursor, "messagefromKafka", "false");
		pipelineCursor.destroy();
		}
		
		IDataUtil.put( pipelineCursor, "messagefromKafka", "success");
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void deleteKafkaTopic (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(deleteKafkaTopic)>> ---
		// @sigtype java 3.5
		// [i] field:0:optional kafkaTopicName
		// [i] field:0:required kafkaConnectionName
		// [o] field:0:required messageFromKafka
		IDataCursor pipelineCursor = pipeline.getCursor();
		try {
		
		String kafkaTopicName = IDataUtil.getString( pipelineCursor, "kafkaTopicName");
		String kafkaConnectionName = IDataUtil.getString( pipelineCursor, "kafkaConnectionName");
		
		StreamingSubsystem ssInstance = StreamingSubsystem.getInstance();
		ConnectionAlias connAlias = ssInstance.getRuntimeConfiguration().getConnectionAlias(kafkaConnectionName);
		IData connAliasData= connAlias.getAsData(false, false); //this return everything from connection definition
		IDataCursor aliasHostCursor = connAliasData.getCursor();
		String hostString = IDataUtil.getString(aliasHostCursor, "host");
		
		// Set up Kafka properties
		Properties properties = new Properties();
		properties.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, hostString);
		
		// Create an AdminClient
		try (AdminClient adminClient = AdminClient.create(properties)) {
		
		// Delete the topic using the AdminClient
		adminClient.deleteTopics(Collections.singletonList(kafkaTopicName));
		
		} catch (Exception e) {
		IDataUtil.put( pipelineCursor, "messagefromKafka", "false");
		pipelineCursor.destroy();
		throw new ServiceException(e);
		}
		
		} catch (StreamingSubsystemException e) {
		IDataUtil.put( pipelineCursor, "messagefromKafka", "false");
		pipelineCursor.destroy();
		}
		
		IDataUtil.put( pipelineCursor, "messagefromKafka", "success");
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void kafkaClusterDescribe (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(kafkaClusterDescribe)>> ---
		// @sigtype java 3.5
		// [i] field:0:optional kafkaTopicName
		// [i] field:0:required kafkaConnectionName
		// [o] object:0:required describeNodeID
		// [o] field:0:required describeHost
		// [o] object:0:required describePort
		// [o] field:0:required describeRack
		// [o] field:1:required topicList
		// [o] field:0:required messageFromKafka
		IDataCursor pipelineCursor = pipeline.getCursor();
		try {
		
		String kafkaTopicName = IDataUtil.getString( pipelineCursor, "kafkaTopicName");
		String kafkaConnectionName = IDataUtil.getString( pipelineCursor, "kafkaConnectionName");
		
		StreamingSubsystem ssInstance = StreamingSubsystem.getInstance();
		ConnectionAlias connAlias = ssInstance.getRuntimeConfiguration().getConnectionAlias(kafkaConnectionName);
		IData connAliasData= connAlias.getAsData(false, false); //this return everything from connection definition
		IDataCursor aliasHostCursor = connAliasData.getCursor();
		String hostString = IDataUtil.getString(aliasHostCursor, "host");
		
		// Set up Kafka properties
		Properties properties = new Properties();
		properties.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, hostString);
		
		// Create an AdminClient
		try (AdminClient adminClient = AdminClient.create(properties)) {
		
		// Get the topic describe info using the AdminClient
		
		KafkaFuture<Collection<Node>> clusterFuture = adminClient.describeCluster().nodes();
		
		// Handle the future to get the actual data
		Collection<Node> nodes = clusterFuture.get();
		
		// Print information about each node in the cluster
		for (Node node : nodes) {
		IDataUtil.put( pipelineCursor, "describeNodeID", node.id());		
		IDataUtil.put( pipelineCursor, "describeHost", node.host());
		IDataUtil.put( pipelineCursor, "describePort", node.port());
		IDataUtil.put( pipelineCursor, "describeRack", node.rack());
		}
		
		ListTopicsOptions options = new ListTopicsOptions();
		options.listInternal(true); // Set to true if you want to include internal topics
		ListTopicsResult topicsResult = adminClient.listTopics(options);
		
		// Retrieve the topic names
		Set<String> topicNames = topicsResult.names().get();
		String[] topicArray = topicNames.toArray(new String[0]);
		IDataUtil.put( pipelineCursor, "topicList", topicArray);
		
		IDataUtil.put( pipelineCursor, "messageFromKafka", "success");
		
		} catch (Exception e) {
		IDataUtil.put( pipelineCursor, "messageFromKafka", "false");
		pipelineCursor.destroy();
		throw new ServiceException(e);
		}
		
		} catch (StreamingSubsystemException e) {
		IDataUtil.put( pipelineCursor, "messageFromKafka", "false");
		pipelineCursor.destroy();
		}
		
		
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void kafkaTopicDescribe (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(kafkaTopicDescribe)>> ---
		// @sigtype java 3.5
		// [i] field:0:optional kafkaTopicName
		// [i] field:0:required kafkaConnectionName
		// [o] field:0:required messageFromKafkaDesribe
		// [o] field:0:required describeTopicName
		// [o] object:0:required describeTopicPartitions
		// [o] object:0:required describeTopicReplications
		IDataCursor pipelineCursor = pipeline.getCursor();
		try {
		
		String kafkaTopicName = IDataUtil.getString( pipelineCursor, "kafkaTopicName");
		String kafkaConnectionName = IDataUtil.getString( pipelineCursor, "kafkaConnectionName");
		
		StreamingSubsystem ssInstance = StreamingSubsystem.getInstance();
		ConnectionAlias connAlias = ssInstance.getRuntimeConfiguration().getConnectionAlias(kafkaConnectionName);
		IData connAliasData= connAlias.getAsData(false, false); //this return everything from connection definition
		IDataCursor aliasHostCursor = connAliasData.getCursor();
		String hostString = IDataUtil.getString(aliasHostCursor, "host");
		
		// Set up Kafka properties
		Properties properties = new Properties();
		properties.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, hostString);
		
		// Create an AdminClient
		try (AdminClient adminClient = AdminClient.create(properties)) {
		
		// Get the topic describe info using the AdminClient
		
		Map<String, KafkaFuture<TopicDescription>> topicDescriptions = adminClient.describeTopics(Collections.singletonList(kafkaTopicName)).values();
		for (Map.Entry<String, KafkaFuture<TopicDescription>> entry : topicDescriptions.entrySet()) {
		String topicName = entry.getKey();
		TopicDescription topicDescription = entry.getValue().get();
		IDataUtil.put( pipelineCursor, "describeTopicName", topicName);
		IDataUtil.put( pipelineCursor, "describeTopicPartitions", topicDescription.partitions().size());
		IDataUtil.put( pipelineCursor, "describeTopicReplications", topicDescription.partitions().get(0).replicas().size());
		}
		
		IDataUtil.put( pipelineCursor, "messagefromKafka", "success");
		
		} catch (Exception e) {
		IDataUtil.put( pipelineCursor, "messagefromKafka", "false");
		pipelineCursor.destroy();
		throw new ServiceException(e);
		}
		
		} catch (StreamingSubsystemException e) {
		IDataUtil.put( pipelineCursor, "messagefromKafka", "false");
		pipelineCursor.destroy();
		}
		
		
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void updateTopic (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(updateTopic)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [i] field:0:required jsonSchema
		IDataCursor pipelineCursor = pipeline.getCursor();
		String documentType = IDataUtil.getString( pipelineCursor, "documentType" );
		String jsonSchema = IDataUtil.getString( pipelineCursor, "jsonSchema" );
		//String isPublishable = IDataUtil.getString( pipelineCursor, "isPublishable" );
		
		
		if(!documentType.contains(":")) {
			throw new ServiceException("Supplied documentType path '"+documentType+"' is not valid path to document.");
		}
		
		JsonObject jsonRoot = JsonParser.parseString(jsonSchema).getAsJsonObject();		
		
		//fieldType = OBJECT | RECORD | RECORDREF | STRING
		//dimension = ARRAY | SCALAR | TABLE
		
		NSName nsName = NSName.create(documentType);
		NSNode nsNode = Namespace.current().getNode(nsName);
		
		NSRecord baseRecord = (NSRecord) nsNode;	
		
		//Remove fields of old schema
		NSField[] oldFields = baseRecord.getFields();
		
		for(NSField field: oldFields){
			if(field.getName().equalsIgnoreCase("_env")) continue;
			baseRecord.removeField(field);
		}
		
		//Add fields from new schema
		String allowUnspecifiedFields = "true";
		if (jsonRoot.has("additionalProperties")){ allowUnspecifiedFields = jsonRoot.get("additionalProperties").getAsString(); }
		baseRecord.setClosed(!Boolean.valueOf(allowUnspecifiedFields));
			
		NSField docidField = NSRecordUtil.createField("esbDocid",encodeFieldType("STRING"),encodeDimension("SCALAR"),Namespace.current(),null);
		docidField.setOptional(false);
		docidField.setNillable(false);
		baseRecord.addField(docidField);
		
		JsonObject rootFields = jsonRoot.get("properties").getAsJsonObject();
		//rootFields.add;
		
		JsonArray requiredFields = null;
		if (jsonRoot.has("required")){
			requiredFields = jsonRoot.get("required").getAsJsonArray();
		}
		
		List<NSField> fields = processJsonFields(rootFields, requiredFields);
				
		for(NSField segmentField: fields){
			if(segmentField.getName().equalsIgnoreCase("esbDocid")) continue;
			baseRecord.addField(segmentField);
		}
				
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}

	// --- <<IS-START-SHARED>> ---
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
	
	public static List<NSField> processJsonFields(JsonObject jsonFields, JsonArray requiredFieldsList) throws ServiceException {
		
	List<NSField> resultList = new ArrayList<NSField>();
	
	
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
	// --- <<IS-END-SHARED>> ---
}

