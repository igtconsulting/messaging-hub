package MessagingHub.v1.services.universalMessaging;

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
import com.wm.app.b2b.server.ns.NSNodeUtil;
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
import java.util.Date;
import com.pcbsys.nirvana.client.nChannel;
import com.pcbsys.nirvana.client.nDurable;
import com.pcbsys.nirvana.client.nDurableAttributes;
import com.pcbsys.nirvana.client.nDurableAttributes.nDurableType;
import com.pcbsys.nirvana.client.nSessionAttributes;
import com.pcbsys.nirvana.nAdminAPI.nRealmNode;
import com.softwareag.is.rest.swagger.GenericBuilder;
import com.softwareag.util.IDataMap;
// --- <<IS-END-IMPORTS>> ---

public final class topics

{
	// ---( internal utility methods )---

	final static topics _instance = new topics();

	static topics _newInstance() { return new topics(); }

	static topics _cast(Object o) { return (topics)o; }

	// ---( server methods )---




	public static final void createTopic (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(createTopic)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [i] field:0:required packageName
		// [i] field:0:required jsonSchema
		// [i] field:0:required umAliasName
		// [o] field:0:required transformerOutput
		IDataCursor pipelineCursor = pipeline.getCursor();
		String documentType = IDataUtil.getString( pipelineCursor, "documentType" );
		String packageName = IDataUtil.getString( pipelineCursor, "packageName" );
		String jsonSchema = IDataUtil.getString( pipelineCursor, "jsonSchema" );
		String umAliasName = IDataUtil.getString( pipelineCursor, "umAliasName");
		//String isPublishable = IDataUtil.getString( pipelineCursor, "isPublishable" );
		
		if(!documentType.contains(":")) {
			throw new ServiceException("Supplied documentType path '"+documentType+"' is not valid path to document.");
		} 
		
		JsonObject jsonRoot = JsonParser.parseString(jsonSchema).getAsJsonObject();		
		
		//fieldType = OBJECT | RECORD | RECORDREF | STRING
		//dimension = ARRAY | SCALAR | TABLE
		NSName nsName = NSName.create(documentType);
		
		NSRecord baseRecord = new NSRecord(Namespace.current(), nsName.getNodeName().toString(), encodeDimension("SCALAR"));
		
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
		
		//jsonRoot.get("required").getAsJsonArray().forEach(element -> {
		//	
		//	JsonObject tmpProperty = jsonRoot.getAsJsonObject("properties").getAsJsonObject(element.getAsString());
		//	tmpProperty.addProperty("required", true);
		//	IDataUtil.put( pipelineCursor, "required", element.getAsString());
		//	
		//});
		
		
		List<NSField> fields = processJsonFields(rootFields, requiredFields);
				
		for(NSField segmentField: fields){
			if(segmentField.getName().equalsIgnoreCase("esbDocid")) continue;
			baseRecord.addField(segmentField);
		}
		
		IDataUtil.put( pipelineCursor, "fieldCount", baseRecord.getActualFieldCount());
		
		
		try{
			Namespace ns = Namespace.current();
			Package nsPkg = PackageManager.getPackage(packageName);
			
			baseRecord.setNSName(nsName);
			baseRecord.setPackage(nsPkg);
			
			UMConnectionAlias umAlias = null;
			if(umAliasName == null || umAliasName.isEmpty() || umAliasName.contentEquals("DEFAULT")){
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getDefaultConnectionAlias();
			}else{
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getConnectionAlias(umAliasName);
			}
			
			//ADD evnelope and add eventdescription to record
			EventDescription ed = EventDescription.create(null, Transformer.genEventTypeName(nsName.toString(), true, true), 0, 1, false);
			ed.setUseProtoBuf(true);
			ed.setConnectionAliasName(umAliasName);
			
			
			
			NSRecordUtil.transform(baseRecord, ed);
			
			try{
				NSRecord envelope = (NSRecord)ns.getNode(NSName.create("pub.publish:envelope"));
				NSRecordRef envRef = new NSRecordRef(ns, "_env", envelope, 0);
				envRef.setOptional(true); 
				baseRecord.addField(envRef);
		
				if (baseRecord.isUseProtoBuf()) {
		
				  String protobufString = ProtobufUtil.doctypeToProtobuf(baseRecord);
				  if (protobufString != null) {
					  //TODO: FIX THE PROTO COMPILATION
				    //ProtobufUtil.compileProto(baseRecord, protobufString);
				  }
				}
			} catch (Exception e) {
				throw new ServiceException(e);
			}	
					
			//#UMUtil.putNode(ns, baseRecord);
			
		   
			//Create node.ndf and put to Namespace
		    Values val = new Values();// 229
		    val.put("record", baseRecord.getValues());// 231
		    try {
		    	nsPkg.getStore().addToNode(nsName, "node.ndf", val);// 235
		    } catch (Exception e) {// 237
		    	throw new ServiceException(e);
		    }
		    ns.putNode(baseRecord);
			
		    //Push to UM
			IData output = UMUtil.submit(baseRecord, false, umAlias);
			
			IDataUtil.put( pipelineCursor, "transformerOutput", output);			
		
		}
		catch(Exception e){
			e.printStackTrace();
			throw new ServiceException(e);
		}
		
		
		
		pipelineCursor.destroy();
			
		// --- <<IS-END>> ---

                
	}



	public static final void createTopicDurable (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(createTopicDurable)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [i] field:0:required umAlias
		// [i] field:0:required durableType
		// [i] field:0:required durableName
		// [o] field:0:required topicDurable
		try {
			
			IDataCursor pipelineCursor = pipeline.getCursor();
			
			String	documentType = IDataUtil.getString( pipelineCursor, "documentType");
			String	umAliasName = IDataUtil.getString( pipelineCursor, "umAlias");
			String	durableType = "shared / serial"; // dorobit
			String	durableName = IDataUtil.getString( pipelineCursor, "durableName");
			
			UMConnectionAlias umAlias = null;
			if(umAliasName == null || umAliasName.isEmpty() || umAliasName.contentEquals("DEFAULT")){
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getDefaultConnectionAlias();
				
			}else{
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getConnectionAlias(umAliasName);
			}
			
			
			NSRecord nsRec = (NSRecord) Namespace.current().getNode(documentType);
			Values eventDesc = (Values) nsRec.getValues().get("eventDescription");
			
			String umPath = eventDesc.getValue("brokerEventTypeName").toString();
			umPath = "/" + umPath.replace("::", "/");
			
			
			nChannel channel = umAlias.lookupChannel(umPath);
			
			
			nDurableType nDurable = null;
			
			if(durableType.equalsIgnoreCase("shared")){
				nDurable = nDurableAttributes.nDurableType.Shared;			
			}else {
				nDurable = nDurableAttributes.nDurableType.Serial;
			}
			
			nDurableAttributes durableAttributes = nDurableAttributes.create(nDurable, durableName);
			
			nDurable durable = channel.getDurableManager().add(durableAttributes);
			
			IData resultSet = IDataFactory.create();
			
			IDataCursor subResultCursor = resultSet.getCursor();
			
			IDataUtil.put( subResultCursor, "durableName", durable.getName().split("##")[0].replace("__", ".").replaceAll("\\.([^\\.]+$)", ":$1"));
			IDataUtil.put( subResultCursor, "durableSelector", durable.getSelector());
			IDataUtil.put( subResultCursor, "durableOutstandingEvents", String.valueOf(durable.getOutstandingEvents()));
			subResultCursor.destroy();
			
			IDataUtil.put( pipelineCursor, "topicDurable", resultSet);
			
		
		} catch (Exception e){
			throw new ServiceException(e);
		}
			
		// --- <<IS-END>> ---

                
	}



	public static final void createTopicIS (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(createTopicIS)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [i] field:0:required packageName
		// [i] field:0:required jsonSchema
		// [o] field:0:required messageISTopic
		IDataCursor pipelineCursor = pipeline.getCursor();
		String documentType = IDataUtil.getString( pipelineCursor, "documentType" );
		String packageName = IDataUtil.getString( pipelineCursor, "packageName" );
		String jsonSchema = IDataUtil.getString( pipelineCursor, "jsonSchema" );
		
		if(!documentType.contains(":")) {
		throw new ServiceException("Supplied documentType path '"+documentType+"' is not valid path to document.");
		} 
		
		JsonObject jsonRoot = JsonParser.parseString(jsonSchema).getAsJsonObject();		
		NSName nsName = NSName.create(documentType);
		
		NSRecord baseRecord = new NSRecord(Namespace.current(), nsName.getNodeName().toString(), encodeDimension("SCALAR"));
		
		String allowUnspecifiedFields = "true";
		if (jsonRoot.has("additionalProperties")){ allowUnspecifiedFields = jsonRoot.get("additionalProperties").getAsString(); }
		baseRecord.setClosed(!Boolean.valueOf(allowUnspecifiedFields));
		
		JsonObject rootFields = jsonRoot.get("properties").getAsJsonObject();
		
		JsonArray requiredFields = null;
		if (jsonRoot.has("required")){
		requiredFields = jsonRoot.get("required").getAsJsonArray();
		}		
		
		List<NSField> fields = processJsonFields(rootFields, requiredFields);
				
		for(NSField segmentField: fields){
			if(segmentField.getName().equalsIgnoreCase("esbDocid")) continue;
		baseRecord.addField(segmentField);
		}
		
		IDataUtil.put( pipelineCursor, "fieldCount", baseRecord.getActualFieldCount());
		
		try{
		Namespace ns = Namespace.current();
		Package nsPkg = PackageManager.getPackage(packageName);
		
		baseRecord.setNSName(nsName);
		baseRecord.setPackage(nsPkg);	
		
		try{
		
			if (baseRecord.isUseProtoBuf()) {
		
			  String protobufString = ProtobufUtil.doctypeToProtobuf(baseRecord);
			  if (protobufString != null) {
				  //TODO: FIX THE PROTO COMPILATION
		//ProtobufUtil.compileProto(baseRecord, protobufString);
		  }
		}
		} catch (Exception e) {
		IDataUtil.put( pipelineCursor, "messageISTopic", "false");
			throw new ServiceException(e);
		}			
		
		Values val = new Values();// 229
		val.put("record", baseRecord.getValues());// 231
		try {
		nsPkg.getStore().addToNode(nsName, "node.ndf", val);// 235
		} catch (Exception e) {// 237
		IDataUtil.put( pipelineCursor, "messageISTopic", "false");
			throw new ServiceException(e);
		}
		ns.putNode(baseRecord);
		
		IDataUtil.put( pipelineCursor, "messageISTopic", "success");			
		
		}
		catch(Exception e){
		e.printStackTrace();
		IDataUtil.put( pipelineCursor, "messageISTopic", "false");
		throw new ServiceException(e);
		}
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void deleteTopic (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(deleteTopic)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [i] field:0:required umAliasName
		// [o] field:0:required transformerOutput
		IDataCursor pipelineCursor = pipeline.getCursor();
		String documentType = IDataUtil.getString( pipelineCursor, "documentType" );	
		String umAliasName = IDataUtil.getString( pipelineCursor, "umAliasName" );	
		Namespace ns = Namespace.current();
		if(!documentType.contains(":")) {
			throw new ServiceException("Supplied documentType path '"+documentType+"' is not valid path to document.");
		}
		
		try{
			UMConnectionAlias umAlias = null;
			if(umAliasName == null || umAliasName.isEmpty() || umAliasName.contentEquals("DEFAULT")){
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getDefaultConnectionAlias();
			}else{
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getConnectionAlias(umAliasName);
			}
			
			NSName nsName = NSName.create(documentType);
			NSNode nsNode = ns.getNode(nsName);
			
			EventDescription ed = ((NSRecord) nsNode).getEventDescription();
			umAlias.deleteChannel(ed);			
			
			IDataMap sinput = new IDataMap();
			sinput.put("node_nsName", (Object)nsName.toString());
			sinput.put("node_pkg", (Object)nsNode.getPackage().getName());
		    if (Namespace.current().nodeExists(nsName)) {
		        Service.doInvoke(NSName.create("wm.server.ns:deleteNode"), sinput.getIData());
		    }
		
		}catch(Exception e){
			throw new ServiceException(e);
		}
		
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void deleteTopicDurable (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(deleteTopicDurable)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [i] field:0:required umAlias
		// [i] field:0:required durableName
		try {
			IDataCursor pipelineCursor = pipeline.getCursor();
			//String	RNAME = IDataUtil.getString( pipelineCursor, "RNAME" );
			
			String	documentType = IDataUtil.getString( pipelineCursor, "documentType");
			String	umAliasName = IDataUtil.getString( pipelineCursor, "umAlias");
			String  durableName = IDataUtil.getString(pipelineCursor, "durableName");
			
			UMConnectionAlias umAlias = null;
			if(umAliasName == null || umAliasName.isEmpty() || umAliasName.contentEquals("DEFAULT")){
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getDefaultConnectionAlias();
				
			}else{
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getConnectionAlias(umAliasName);
			}
			
			
			NSRecord nsRec = (NSRecord) Namespace.current().getNode(documentType);
			Values eventDesc = (Values) nsRec.getValues().get("eventDescription");
			
			String umPath = eventDesc.getValue("brokerEventTypeName").toString();
			umPath = "/" + umPath.replace("::", "/");
			
			nChannel channel = umAlias.lookupChannel(umPath);
			nDurable durable = channel.getDurableManager().get(durableName);
			
			channel.getDurableManager().delete(durable);
		
		} catch (Exception e) {
			throw new ServiceException(e);
		}
			
		// --- <<IS-END>> ---

                
	}



	public static final void deleteTopicIS (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(deleteTopicIS)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [o] field:0:required messageISTopic
		IDataCursor pipelineCursor = pipeline.getCursor();
		String documentType = IDataUtil.getString( pipelineCursor, "documentType" );	
		
		Namespace ns = Namespace.current();
		if(!documentType.contains(":")) {
		throw new ServiceException("Supplied documentType path '"+documentType+"' is not valid path to document.");
		}
		
		try{
		
		NSName nsName = NSName.create(documentType);
		NSNode nsNode = ns.getNode(nsName);		
		
		IDataMap sinput = new IDataMap();
		sinput.put("node_nsName", (Object)nsName.toString());
		sinput.put("node_pkg", (Object)nsNode.getPackage().getName());
		if (Namespace.current().nodeExists(nsName)) {
		Service.doInvoke(NSName.create("wm.server.ns:deleteNode"), sinput.getIData());
		}
		
		}catch(Exception e){
		IDataUtil.put( pipelineCursor, "messageISTopic", "false");
		throw new ServiceException(e);
		}
		
		IDataUtil.put( pipelineCursor, "messageISTopic", "success");
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void getAllDurables (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getAllDurables)>> ---
		// @sigtype java 3.5
		// [i] field:1:required documentTypes
		// [i] field:0:required umAlias
		// [o] record:1:required durableList
		try {
			IDataCursor pipelineCursor = pipeline.getCursor();
			//String	RNAME = IDataUtil.getString( pipelineCursor, "RNAME" );
			
			String[] documentTypes = IDataUtil.getStringArray( pipelineCursor, "documentTypes");
			String umAliasName = IDataUtil.getString( pipelineCursor, "umAlias");
			
			UMConnectionAlias umAlias = null;
			if(umAliasName == null || umAliasName.isEmpty() || umAliasName.contentEquals("DEFAULT")){
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getDefaultConnectionAlias();
				
			}else{
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getConnectionAlias(umAliasName);
			}
			
			int allDurables = 0; 
			for (String documentType : documentTypes){
				NSRecord nsRec = (NSRecord) Namespace.current().getNode(documentType);
				Values eventDesc = (Values) nsRec.getValues().get("eventDescription");
				
				String umPath = eventDesc.getValue("brokerEventTypeName").toString();
				umPath = "/" + umPath.replace("::", "/");
				
				nChannel channel = umAlias.lookupChannel(umPath);
				
				nDurable[] durables = channel.getDurableManager().getAll();
				
				allDurables = allDurables + durables.length;
			}
			
			
			int allDurablesCounter = 0;
			IData[]	resultSet = new IData[allDurables];
			
			for (String documentType : documentTypes){
				NSRecord nsRec = (NSRecord) Namespace.current().getNode(documentType);
				Values eventDesc = (Values) nsRec.getValues().get("eventDescription");
				
				String umPath = eventDesc.getValue("brokerEventTypeName").toString();
				umPath = "/" + umPath.replace("::", "/");
				
				nChannel channel = umAlias.lookupChannel(umPath);
				
				nDurable[] durables = channel.getDurableManager().getAll();
				
				int durableCount = durables.length;
				
				for (int j = 0; j < durableCount; j++){
					resultSet[allDurablesCounter] = IDataFactory.create();
					IDataCursor subResultCursor = resultSet[allDurablesCounter].getCursor();
					
					String durableType = "";
					if(durables[j].isSerial()){
						durableType = "Serial";
					}else {
						durableType = "Shared";
					}
					
					IDataUtil.put( subResultCursor, "durableName", durables[j].getName());
					IDataUtil.put( subResultCursor, "durableSelector", durables[j].getSelector().toString());
					IDataUtil.put( subResultCursor, "durableType", durableType);
					IDataUtil.put( subResultCursor, "documentType", documentType);
					IDataUtil.put( subResultCursor, "processingStatus", String.valueOf(durables[j].getEID()));
					IDataUtil.put( subResultCursor, "retrievalStatus", String.valueOf(durables[j].getID()));
					subResultCursor.destroy();
					
					allDurablesCounter += 1;
				}
			}
			
		    IDataUtil.put( pipelineCursor, "durableList", resultSet);
		
		} catch (Exception e) {
			throw new ServiceException(e);
		}
		// --- <<IS-END>> ---

                
	}



	public static final void getAllTopics (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getAllTopics)>> ---
		// @sigtype java 3.5
		// [i] field:0:required topicNamespacePrefix
		// [o] field:1:required topicList
		IDataCursor pipelineCursor = pipeline.getCursor();
		
		Namespace ns = Namespace.current();
		String baseNodeName = IDataUtil.getString( pipelineCursor, "topicNamespacePrefix");
		NSName topicNode = NSName.create(baseNodeName);
		
		if(ns.nodeExists(topicNode)) {
			NSNode baseNode = ns.getNode(baseNodeName);
		
			List<String> results = getChildList(baseNode);
		
			IDataUtil.put( pipelineCursor, "topicList", results.toArray(new String[0]));
		}
		
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void getTopicDurable (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getTopicDurable)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [i] field:0:required umAliasName
		// [i] field:0:required triggerPath
		// [o] field:0:required durableName
		// [o] field:0:required durableSelector
		// [o] field:0:required durableType
		try {
			IDataCursor pipelineCursor = pipeline.getCursor();
			//String	RNAME = IDataUtil.getString( pipelineCursor, "RNAME" );
			
			String	documentType = IDataUtil.getString( pipelineCursor, "documentType");
			String	umAliasName = IDataUtil.getString( pipelineCursor, "umAlias");
			String  triggerPath = IDataUtil.getString(pipelineCursor, "triggerPath");
			triggerPath = triggerPath.replaceAll("[.:]", "__");
			UMConnectionAlias umAlias = null;
			if(umAliasName == null || umAliasName.isEmpty() || umAliasName.contentEquals("DEFAULT")){
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getDefaultConnectionAlias();
				
			}else{
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getConnectionAlias(umAliasName);
			}
			
			NSRecord nsRec = (NSRecord) Namespace.current().getNode(documentType);
			Values eventDesc = (Values) nsRec.getValues().get("eventDescription");
			
			String umPath = eventDesc.getValue("brokerEventTypeName").toString();
			umPath = "/" + umPath.replace("::", "/");
			
			nChannel channel = umAlias.lookupChannel(umPath);
			
			nDurable[] durables = channel.getDurableManager().getAll();
			
			int durableCount = durables.length;
			
			for (int j=0;j<durableCount;j++){
				if(durables[j].getName().endsWith(triggerPath)){
					String durableType = "";
					if(durables[j].isSerial()){
						durableType = "Serial";
					}else {
						durableType = "Shared";
					}
					
					IDataUtil.put( pipelineCursor, "durableName", durables[j].getName());
					IDataUtil.put( pipelineCursor, "durableSelector", durables[j].getSelector().toString());
					IDataUtil.put( pipelineCursor, "durableType", durableType);
				}
			}
		} catch (Exception e) {
			throw new ServiceException(e);
		}
		// --- <<IS-END>> ---

                
	}



	public static final void getTopicDurables (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getTopicDurables)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [i] field:0:required umAlias
		// [o] record:0:required durableList
		// [o] - field:0:required durableName
		// [o] - field:0:required durableSelector
		// [o] - field:0:required durableType
		// [o] - field:0:required processingStatus
		// [o] - field:0:required retrievalStatus
		try {
			IDataCursor pipelineCursor = pipeline.getCursor();
			//String	RNAME = IDataUtil.getString( pipelineCursor, "RNAME" );
			
			String	documentType = IDataUtil.getString( pipelineCursor, "documentType");
			String	umAliasName = IDataUtil.getString( pipelineCursor, "umAlias");
			
			UMConnectionAlias umAlias = null;
			if(umAliasName == null || umAliasName.isEmpty() || umAliasName.contentEquals("DEFAULT")){
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getDefaultConnectionAlias();
				
			}else{
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getConnectionAlias(umAliasName);
			}
			
			NSRecord nsRec = (NSRecord) Namespace.current().getNode(documentType);
			Values eventDesc = (Values) nsRec.getValues().get("eventDescription");
			
			String umPath = eventDesc.getValue("brokerEventTypeName").toString();
			umPath = "/" + umPath.replace("::", "/");
			
			nChannel channel = umAlias.lookupChannel(umPath);
			
			nDurable[] durables = channel.getDurableManager().getAll();
			
			int durableCount = durables.length;
			IData[]	resultSet = new IData[durableCount];
			
			for (int j=0;j<durableCount;j++){
				resultSet[j] = IDataFactory.create();
				IDataCursor subResultCursor = resultSet[j].getCursor();
				
				String durableType = "";
				if(durables[j].isSerial()){
					durableType = "Serial";
				}else {
					durableType = "Shared";
				}
				
				IDataUtil.put( subResultCursor, "durableName", durables[j].getName());
				IDataUtil.put( subResultCursor, "durableSelector", durables[j].getSelector().toString());
				IDataUtil.put( subResultCursor, "durableType", durableType);
				IDataUtil.put( subResultCursor, "processingStatus", String.valueOf(durables[j].getEID()));
				IDataUtil.put( subResultCursor, "retrievalStatus", String.valueOf(durables[j].getID()));
				subResultCursor.destroy();
			}
			
			IDataUtil.put( pipelineCursor, "durableList", resultSet);
			
		
		} catch (Exception e) {
			throw new ServiceException(e);
		}
		// --- <<IS-END>> ---

                
	}



	public static final void purgeTopicDurable (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(purgeTopicDurable)>> ---
		// @sigtype java 3.5
		// [i] field:0:required topicName
		// [i] field:0:required umAlias
		// [i] field:0:required durableName
		try{
		IDataCursor pipelineCursor = pipeline.getCursor();
		//String	RNAME = IDataUtil.getString( pipelineCursor, "RNAME" );
		
		String	channelName = IDataUtil.getString( pipelineCursor, "topicName");
		String	umAliasName = IDataUtil.getString( pipelineCursor, "umAlias");
		String  durableName = IDataUtil.getString( pipelineCursor, "durableName");
		
		UMConnectionAlias umAlias = null;
		if(umAliasName == null || umAliasName.isEmpty() || umAliasName.contentEquals("DEFAULT")){
			umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getDefaultConnectionAlias();
			
		}else{
			umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getConnectionAlias(umAliasName);
		}
		
		nChannel channel = umAlias.lookupChannel(channelName);		
		channel.getDurableManager().get(durableName).removeAll();
		
		} catch (Exception e) {
		throw new ServiceException(e);
		}
			
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

