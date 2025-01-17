package MessagingHub.v1.services;

// -----( IS Java Code Template v1.2

import com.wm.data.*;
import com.wm.util.Values;
import com.wm.app.b2b.server.Service;
import com.wm.app.b2b.server.ServiceException;
// --- <<IS-START-IMPORTS>> ---
import com.wm.app.b2b.server.ServiceDetails;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Map.Entry;
import java.util.Set;
import java.util.function.Consumer;
import com.google.gson.Gson;
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
import com.wm.app.b2b.server.PackageStore;
import com.wm.app.b2b.server.dispatcher.DispatchFacade;
import com.wm.app.b2b.server.dispatcher.wmmessaging.UMConnectionAlias;
import com.wm.app.b2b.server.invoke.InvokeManager;
import com.wm.app.b2b.server.ns.Namespace;
import com.wm.app.b2b.ws.ns.NSFacade;
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
import com.wm.lang.ns.NSPackage;
import com.wm.util.coder.ProtobufUtil;
import com.wm.util.coder.IDataProtoBufCoder;
import com.wm.lang.ns.NSInterface;
import com.wm.lang.ns.NSType;
import com.wm.msg.ICondition;
import com.wm.app.b2b.server.ACLManager;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.Enumeration;
import java.io.IOException;
import com.pcbsys.nirvana.client.nChannel;
import com.pcbsys.nirvana.client.nDurable;
import com.pcbsys.nirvana.client.nSessionAttributes;
import com.pcbsys.nirvana.nAdminAPI.nRealmNode;
import com.pcbsys.nirvana.nAdminAPI.nLeafNode;
import com.pcbsys.nirvana.nAdminAPI.nClusterNode;
import com.pcbsys.nirvana.nAdminAPI.nClusterStatus;
import com.pcbsys.nirvana.nAdminAPI.nClusterStatusEntry;
import com.pcbsys.nirvana.nAdminAPI.*;
import java.text.SimpleDateFormat;
import java.text.DateFormat;
import com.wm.app.b2b.server.dispatcher.trigger.*;
import com.wm.app.b2b.server.TriggerFactory;
import java.util.concurrent.TimeUnit;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.ParserConfigurationException;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.w3c.dom.Element;
import org.xml.sax.SAXException;
// --- <<IS-END-IMPORTS>> ---

public final class javaServices

{
	// ---( internal utility methods )---

	final static javaServices _instance = new javaServices();

	static javaServices _newInstance() { return new javaServices(); }

	static javaServices _cast(Object o) { return (javaServices)o; }

	// ---( server methods )---




	public static final void createJsonSchemaFromDocumentType (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(createJsonSchemaFromDocumentType)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [o] field:0:required jsonSchema
		IDataCursor pipelineCursor = pipeline.getCursor();
		String documentType = IDataUtil.getString( pipelineCursor, "documentType" );
		
		Namespace ns = Namespace.current();
		
		NSName nsName = NSName.create(documentType);
		NSRecord baseRecord = (NSRecord) ns.getNode(nsName);
		
		JsonObject jsonRoot = new JsonObject();
		
		JsonObject rootFields = processRecordFields(baseRecord);
		jsonRoot.addProperty("type", "object");
		jsonRoot.addProperty("additionalProperties", !baseRecord.isClosed());
		jsonRoot.add("properties", rootFields);
		
		JsonArray requiredList = getRequiredFieldsAsArray(baseRecord);
		if(requiredList != null){
			jsonRoot.add("required", requiredList);
		}
		
		IDataUtil.put( pipelineCursor, "jsonSchema", jsonRoot.toString());
				
		pipelineCursor.destroy();
			
		// --- <<IS-END>> ---

                
	}



	public static final void documentTypeToTopicName (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(documentTypeToTopicName)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [o] field:0:required topicName
		IDataCursor pipelineCursor = pipeline.getCursor();
		String documentType = IDataUtil.getString( pipelineCursor, "documentType" );
		
		int topicNameStart = documentType.indexOf(":");
		
		String result = documentType.substring(topicNameStart + 1);
		
		IDataUtil.put( pipelineCursor, "topicName", result);
		
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void filterDurablesByName (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(filterDurablesByName)>> ---
		// @sigtype java 3.5
		// [i] record:1:required durableList
		// [i] field:0:required filterDurables
		// [o] field:0:required durableName
		// [o] field:0:required topicDocumentType
		IDataCursor pipelineCursor = pipeline.getCursor();
		
		IData[] durableNames = IDataUtil.getIDataArray( pipelineCursor, "durableList");
		String filterDurable = IDataUtil.getString( pipelineCursor, "filterDurables");
		
		IData[] durableNames1 = durableNames.clone();
		
		int durableCount = durableNames1.length;
		
		for (int j = 0; j < durableCount; j++){
			durableNames1[0] = IDataFactory.create();
			IDataCursor subResultCursor = durableNames1[0].getCursor();
			
			String durable = (String) IDataUtil.get( subResultCursor, "durableName");
			String documentTypeTmp = (String) IDataUtil.get( subResultCursor, "documentType");
			if(durable == filterDurable){
				String documentType = documentTypeTmp;
				
				IDataUtil.put( pipelineCursor, "durableName", durableNames1[0]);
				IDataUtil.put( pipelineCursor, "topicDocumentType", documentType);
				
				subResultCursor.destroy();
			}
			else {
				IDataUtil.put( pipelineCursor, "durableName", durableNames1[0]);
				IDataUtil.put( pipelineCursor, "topicDocumentType", "");
				}
		}
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void genericServiceInvoke (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(genericServiceInvoke)>> ---
		// @sigtype java 3.5
		// [i] field:0:required serviceName
		// [i] record:0:required inputDocument
		try {
			IDataCursor pipelineCursor = pipeline.getCursor();			
			String serviceName = IDataUtil.getString( pipelineCursor, "serviceName" );
			IData inputDocument = IDataUtil.getIData(pipelineCursor, "inputDocument");
			
			Service.doInvoke(serviceName.split(":")[0], serviceName.split(":")[1], inputDocument);
			
			IDataUtil.put(pipelineCursor, "triggerInfo", inputDocument);
			pipelineCursor.destroy();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		// --- <<IS-END>> ---

                
	}



	public static final void getCallingService (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getCallingService)>> ---
		// @sigtype java 3.5
		// [o] field:0:required sessionName
		IDataCursor cursor = pipeline.getCursor();
		IDataUtil.put(cursor, "sessionName", Service.getSession().getName());
		cursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void getCurrentUserAcl (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getCurrentUserAcl)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [o] field:0:required listACL
		// [o] field:0:required readACL
		// [o] field:0:required writeACL
		// [o] field:0:required executeACL
		IDataCursor pipelineCursor = pipeline.getCursor();
		String	documentType = IDataUtil.getString( pipelineCursor, "documentType");
		
		IDataUtil.put(pipelineCursor, "listACL", String.valueOf(ACLManager.browseAcl(documentType)));
		IDataUtil.put(pipelineCursor, "readACL", String.valueOf(ACLManager.readAcl(documentType)));
		IDataUtil.put(pipelineCursor, "writeACL", String.valueOf(ACLManager.writeAcl(documentType)));
		IDataUtil.put(pipelineCursor, "executeACL", String.valueOf(ACLManager.executeAcl(documentType)));
		
		pipelineCursor.destroy();
			
		// --- <<IS-END>> ---

                
	}



	public static final void getDestinationServiceFromTrigger (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getDestinationServiceFromTrigger)>> ---
		// @sigtype java 3.5
		// [i] field:0:required triggerName
		// [o] field:0:required destinationService
		// [o] field:0:required messagingHubForwardingService
		// [o] field:0:required forwardingCurrentlyEnabled
		IDataCursor pipelineCursor = pipeline.getCursor();	
		
		String triggerName = IDataUtil.getString( pipelineCursor, "triggerName" );
		
		Namespace ns = Namespace.current();
		NSName nsName = NSName.create(triggerName);
		NSNode nsNode = ns.getNode(nsName);
		Package pkg = (Package)nsNode.getPackage();
		
		PackageStore ps = pkg.getStore();
		File f = ps.getNodePath(nsName);
		
		try {
			String fullPathToNode = f.getCanonicalPath() + "/node.ndf";
		    File xmlFile = new File(fullPathToNode);
		    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		    DocumentBuilder builder = factory.newDocumentBuilder();
		    Document document = builder.parse(xmlFile);
		    
		    NodeList nodeList = document.getElementsByTagName("value");
		    String destinationService = null;
		    String messagingHubForwardingService = null;
		    String forwardingCurrentlyEnabled = null;
		    
		    int count = 0;
		    for (int i = 0; i < nodeList.getLength(); i++) {
		        Element element = (Element) nodeList.item(i);
		        if (element.getAttribute("name").equals("destinationService")) {
		        	destinationService = element.getTextContent();
		            count++;
		        }
		        if (element.getAttribute("name").equals("messagingHubForwardingService")) {
		        	messagingHubForwardingService = element.getTextContent();
		            count++;
		        }
		        if (element.getAttribute("name").equals("forwardingCurrentlyEnabled")) {
		        	forwardingCurrentlyEnabled = element.getTextContent();
		            count++;
		        }
		        if(count == 3){
		        	break;
		        }
		        
		    }
		
		    IDataUtil.put(pipelineCursor, "destinationService", destinationService);
		    IDataUtil.put(pipelineCursor, "forwardingCurrentlyEnabled", forwardingCurrentlyEnabled);
		    IDataUtil.put(pipelineCursor, "messagingHubForwardingService", messagingHubForwardingService);
			
			
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (ParserConfigurationException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (SAXException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		pipelineCursor.destroy();
			
		// --- <<IS-END>> ---

                
	}



	public static final void getDurable (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getDurable)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [i] field:0:required umAliasName
		// [i] field:0:required triggerPath
		// [i] field:0:required durableName
		// [o] record:0:required durableDetails
		try {
			IDataCursor pipelineCursor = pipeline.getCursor();
			//String	RNAME = IDataUtil.getString( pipelineCursor, "RNAME" );
			
			String	documentType = IDataUtil.getString( pipelineCursor, "documentType");
			String	umAliasName = IDataUtil.getString( pipelineCursor, "umAliasName");
			String  triggerPath = IDataUtil.getString(pipelineCursor, "triggerPath");
			String  durableName = IDataUtil.getString(pipelineCursor, "durableName");
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
					
					IData resultSet = IDataFactory.create();
					IDataCursor resultSetCursor = resultSet.getCursor();
					
		//					IDataUtil.put( resultSetCursor, "retrievalStatus", String.valueOf(channel.getDurableManager().get(durableName).getID()));
		//					IDataUtil.put( resultSetCursor, "processingStatus", String.valueOf(channel.getDurableManager().get(durableName).getEID()));
					IDataUtil.put( resultSetCursor, "durableName", channel.getDurableManager().get(durableName).getName());
					IDataUtil.put( resultSetCursor, "outstandingEvents", String.valueOf(channel.getDurableManager().get(durableName).getOutstandingEvents()));
					IDataUtil.put( resultSetCursor, "durableSelector", channel.getDurableManager().get(durableName).getSelector().toString());
					IDataUtil.put( resultSetCursor, "durableType", channel.getDurableManager().get(durableName).isSerial() ? "Serial" : "Shared");
					resultSetCursor.destroy();
					IDataUtil.put( pipelineCursor, "durableDetails", resultSet);
		
		} catch (Exception e) {
			throw new ServiceException(e);
		}
			
		// --- <<IS-END>> ---

                
	}



	public static final void getHealth (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getHealth)>> ---
		// @sigtype java 3.5
		// [i] field:1:required realmUrls
		// [o] record:0:required realmInfo
		try {
		IDataCursor pipelineCursor = pipeline.getCursor();
		String[] realmUrls = IDataUtil.getStringArray( pipelineCursor, "realmUrls");
		
		IData intermediateDoc = IDataFactory.create();
		IDataCursor intermediateCursor = intermediateDoc.getCursor();
		
		//String[] RNAME = {"nsp://192.168.0.158:9000"};
		//String[] RNAME = {"nsp://localhost:9000"};
		nSessionAttributes nsa = new nSessionAttributes(realmUrls);
		
		nRealmNode realm = new nRealmNode(nsa);
		
		/////////////////////////davidko je boh - dakujem <3////////////////////////////
		
		String AliasName = realm.getAliasName();
		IDataUtil.put( intermediateCursor, "AliasName", AliasName);
		
		TimeUnit.SECONDS.sleep(1);
		long buffersCreated = realm.getBuffersCreated();
		IDataUtil.put( intermediateCursor, "buffersCreated", buffersCreated);
		
		long buffersReused = realm.getBuffersReused();
		IDataUtil.put( intermediateCursor, "buffersReused", buffersReused);
		
		double CPUUsage = realm.getCPUUsage();
		IDataUtil.put( intermediateCursor, "CPUUsage", CPUUsage);
		
		int currentConnection = realm.getCurrentConnections();
		IDataUtil.put( intermediateCursor, "currentConnection", currentConnection);
		
		long fanoutBacklot = realm.getFanoutBacklog();
		
		IDataUtil.put( intermediateCursor, "fanoutBacklot", fanoutBacklot);
		
		long freeDirectMemory = realm.getFreeDirectMemory();
		IDataUtil.put( intermediateCursor, "freeDirectMemory", freeDirectMemory);
		
		long freeMemory = realm.getFreeMemory();
		
		IDataUtil.put( intermediateCursor, "freeMemory", freeMemory);
		
		double heapPercentage = realm.getHeapPercentage();
		IDataUtil.put( intermediateCursor, "heapPercentage", heapPercentage);
		
		long internalSchedulerSize = realm.getInternalSchedulerSize();
		IDataUtil.put( intermediateCursor, "internalSchedulerSize", internalSchedulerSize);
		
		long maxHeapMemory = realm.getMaxHeapMemory();
		IDataUtil.put( intermediateCursor, "maxHeapMemory", maxHeapMemory);
		
		int numberOfChannels = realm.getNoOfChannels();
		IDataUtil.put( intermediateCursor, "numberOfChannels", numberOfChannels);
		
		int numberOfQueues = realm.getNoOfQueues();
		IDataUtil.put( intermediateCursor, "numberOfQueues", numberOfQueues);
		
		long numberOfThreads = realm.getNoOfThreads();
		IDataUtil.put( intermediateCursor, "numberOfThreads", numberOfThreads);
		
		long physicalMemory = realm.getPhysicalMemory();
		IDataUtil.put( intermediateCursor, "physicalMemory", physicalMemory);
		
		int queuedThreads = realm.getQueuedThreads();
		IDataUtil.put( intermediateCursor, "queuedThreads", queuedThreads);
		
		long reusedThreads = realm.getReUsedThreads();
		IDataUtil.put( intermediateCursor, "reusedThreads", reusedThreads);
		
		Date serverTime = realm.getServerTime();
		IDataUtil.put( intermediateCursor, "serverTime", serverTime);
		
		int size = realm.getSize();
		IDataUtil.put( intermediateCursor, "size", size);
		
		Date startTime = realm.getRealmNode().getStartTime();
		IDataUtil.put( intermediateCursor, "startTime", startTime);
		
		long totalConnections = realm.getTotalConnections();
		IDataUtil.put( intermediateCursor, "totalConnections", totalConnections);
		
		long totalDirectMemory = realm.getTotalDirectMemory();
		IDataUtil.put( intermediateCursor, "totalDirectMemory", totalDirectMemory);
		
		long totalGCCount = realm.getTotalGCCount();		
		IDataUtil.put( intermediateCursor, "totalGCCount", totalGCCount);
		
		long totalMemory = realm.getTotalMemory();			
		IDataUtil.put( intermediateCursor, "totalMemory", totalMemory);
		
		long totalNodes = realm.getTotalNodes();
		IDataUtil.put( intermediateCursor, "totalNodes", totalNodes);
		
		long totalPublished = realm.getTotalPublished();
		IDataUtil.put( intermediateCursor, "totalPublished", totalPublished);
		
		long totalSubscribed = realm.getTotalSubscribed();
		IDataUtil.put( intermediateCursor, "totalSubscribed", totalSubscribed);
		
		long updateInterval = realm.getUpdateInterval();
		IDataUtil.put( intermediateCursor, "updateInterval", updateInterval);
		
		long usedEventMemory = realm.getUsedEventMemory();
		IDataUtil.put( intermediateCursor, "usedEventMemory", usedEventMemory);		
		
		intermediateCursor.destroy();
		
		IDataUtil.put(pipelineCursor, "realmInfo", intermediateDoc);
		pipelineCursor.destroy();
		
		}
		catch (Exception e) {
		throw new ServiceException(e);
		}
		// --- <<IS-END>> ---

                
	}



	public static final void getLastPartOfString (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getLastPartOfString)>> ---
		// @sigtype java 3.5
		// [i] field:0:required input
		// [i] field:0:required delimiter
		// [o] field:0:required lastPartOfString
		IDataCursor pipelineCursor = pipeline.getCursor();
		
		String inputString = IDataUtil.getString( pipelineCursor, "input");
		String delimiter = IDataUtil.getString( pipelineCursor, "delimiter");
		
		
		int lastIndex = inputString.lastIndexOf(delimiter);
		
		if (lastIndex != -1 && lastIndex < inputString.length() - 1) {
			IDataUtil.put( pipelineCursor, "lastPartOfString", inputString.substring(lastIndex + 1));
		} else {
			IDataUtil.put( pipelineCursor, "lastPartOfString", inputString.substring(lastIndex + 1));
		}
			
		// --- <<IS-END>> ---

                
	}



	public static final void getPackageName (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getPackageName)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [o] field:0:required packageName
		IDataCursor pipelineCursor = pipeline.getCursor();
		String	documentType = IDataUtil.getString( pipelineCursor, "documentType");
		
		Namespace ns = Namespace.current();
		NSName nsName = NSName.create(documentType);
		NSNode nsNode = ns.getNode(nsName);
				
		IDataUtil.put( pipelineCursor, "packageName", nsNode.getPackage().getName());
		
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void getTopicDetail (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getTopicDetail)>> ---
		// @sigtype java 3.5
		// [i] field:0:required connectionName
		// [i] field:0:required topicName
		// [i] field:0:required umPrefix
		// [o] record:0:required topicDetail
		// [o] - field:0:required total_published
		// [o] - field:0:required total_consumed
		try{
		IDataCursor pipelineCursor = pipeline.getCursor();
		String connectionName = IDataUtil.getString(pipelineCursor, "connectionName");
		String topicName = IDataUtil.getString( pipelineCursor, "topicName");
		String umPrefix = IDataUtil.getString( pipelineCursor, "umPrefix");
		
		UMConnectionAlias umAlias = null;
		if(connectionName == null || connectionName.isEmpty() || connectionName.contentEquals("DEFAULT")){
			umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getDefaultConnectionAlias();
		}else{
			umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getConnectionAlias(connectionName);
		}
		
		String RNAME = umAlias.getRnameString();
		
		nSessionAttributes nsa = new nSessionAttributes(RNAME);
		nRealmNode realm = new nRealmNode(nsa);
		
		String nodeName = "/wm/is/" + umPrefix + "/topics" + "/" + topicName;
		
		nLeafNode found = (nLeafNode) realm.findNode(nodeName);
		long totalPublished = found.getTotalPublished();
		long totalConsumed = found.getTotalConsumed();
		
		IData intermediateDoc = IDataFactory.create();
		IDataCursor intermediateCursor = intermediateDoc.getCursor();
		
		IDataUtil.put( intermediateCursor, "total_published", totalPublished);
		
		IDataUtil.put( intermediateCursor, "total_consumed", totalConsumed);
		
		intermediateCursor.destroy();
		IDataUtil.put(pipelineCursor, "topicDetail", intermediateDoc);
		pipelineCursor.destroy();
		
		}
		catch (Exception e) {
			throw new ServiceException(e);
		}
			
		// --- <<IS-END>> ---

                
	}



	public static final void getTriggerPathFromDurableName (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getTriggerPathFromDurableName)>> ---
		// @sigtype java 3.5
		// [i] field:0:required durableName
		// [o] field:0:required triggerPath
		IDataCursor pipelineCursor = pipeline.getCursor();
		
		String triggerDurableName = IDataUtil.getString( pipelineCursor, "durableName");
		
		if (triggerDurableName.contains("##") == true) {
			triggerDurableName = triggerDurableName.split("##")[1].replace("__", ".").replaceAll("\\.([^\\.]+$)", ":$1");
		}else {
			triggerDurableName = "";
		}
		
		IDataUtil.put( pipelineCursor, "triggerPath", triggerDurableName);
			
		// --- <<IS-END>> ---

                
	}



	public static final void getUniqueStringList (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getUniqueStringList)>> ---
		// @sigtype java 3.5
		// [i] field:1:required inputList
		// [o] field:1:required uniqueList
		IDataCursor pipelineCursor = pipeline.getCursor();
		String[] inputList = IDataUtil.getStringArray(pipelineCursor, "inputList");
		
		ArrayList<String> uniqueList = new ArrayList<>();
		
		for (String str : inputList) {
		    if (!uniqueList.contains(str)) {
		        uniqueList.add(str);
		    }
		}
		
		String[] uniqueArray = uniqueList.toArray(new String[0]);
		IDataUtil.put(pipelineCursor, "uniqueList", uniqueArray);
		
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void packageExists (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(packageExists)>> ---
		// @sigtype java 3.5
		// [i] field:0:required packageName
		// [o] field:0:required exists
		IDataCursor pipelineCursor = pipeline.getCursor();
		String	packageName = IDataUtil.getString( pipelineCursor, "packageName");
		
		Namespace ns = Namespace.current();
		NSPackage[] packages = ns.getAllPackages();
		String exists = "false";
		
		int packageCount = ns.getAllPackages().length;
		
		for (int j=0; j < packageCount; j++){		
			if(packages[j].getName().toString().equalsIgnoreCase(packageName)) exists = "true";
		}
		
		IDataUtil.put( pipelineCursor, "exists", exists);
		
		pipelineCursor.destroy();
			
		// --- <<IS-END>> ---

                
	}



	public static final void stringToIntegerObject (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(stringToIntegerObject)>> ---
		// @sigtype java 3.5
		// [i] field:0:required string
		// [o] object:0:required integer
		IDataCursor pipelineCursor = pipeline.getCursor();
		String string = IDataUtil.getString( pipelineCursor, "string");
		
		Integer intValue = Integer.valueOf(string);
		
		IDataUtil.put( pipelineCursor, "integer", intValue);
		// --- <<IS-END>> ---

                
	}



	public static final void topicExists (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(topicExists)>> ---
		// @sigtype java 3.5
		// [i] field:0:required documentType
		// [o] field:0:required exists
		IDataCursor pipelineCursor = pipeline.getCursor();
		String	documentType = IDataUtil.getString( pipelineCursor, "documentType");
		
		Namespace ns = Namespace.current();
		NSName nsName = NSName.create(documentType);
		
		if (ns.nodeExists(nsName)){
			IDataUtil.put( pipelineCursor, "exists", "true");
		} else {
			IDataUtil.put( pipelineCursor, "exists", "false");
		}
		
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void updateTrigger (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(updateTrigger)>> ---
		// @sigtype java 3.5
		//NSNode[] allPackages = NSNod
		
		ICondition[] cond = null;
		NSPackage pack = null;
		NSName name = null;
		
		
		
		
		
		
		Trigger dunno = com.wm.app.b2b.server.dispatcher.trigger.Trigger.getInstance(pack, name, cond);
		
		IDataCursor pipelineCursor = pipeline.getCursor();	
		IData intermediateDoc = IDataFactory.create();
		IDataCursor intermediateCursor = intermediateDoc.getCursor();
		if (dunno.isEnabled()){
			//IDataUtil.put( intermediateCursor, "result", pack.getName());
			
		} else {
			IDataUtil.put( intermediateCursor, "result", "vypnuty");
		}
			
					TriggerFacade facade = new TriggerFacade("MessagingHub.v1.triggers:testTrigger");
					//NSFacade.updateNSNode(dunno);
					//			
		//			if (facade.isNodeLocked()) {// 268
		//				IDataUtil.put( intermediateCursor, "result", "locknuty");
		//		    } else {
		//		    	IDataUtil.put( intermediateCursor, "result", "mame triggerWow");
		//		    	
		//		//                IData data = IDataFactory.create();// 275
		//		//                dc = data.getCursor();// 276
		//		//                IDataUtil.put(dc, "node_nsName", triggerName);// 277
		//		//                dc.destroy();// 278
		//		//                nsimpl.deleteNode(data);// 279
		//		    }
			
			
		
			
			intermediateCursor.destroy();
			
			IDataUtil.put(pipelineCursor, "triggerInfo", intermediateDoc);
			pipelineCursor.destroy();
		//			if(trigger == null) {
		//				IDataUtil.put( intermediateCursor, "result", "je null");
		//			}else{
		//				IDataUtil.put( intermediateCursor, "result", "neni null");
		//			}
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

