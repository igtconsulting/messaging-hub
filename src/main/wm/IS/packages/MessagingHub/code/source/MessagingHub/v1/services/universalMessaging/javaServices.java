package MessagingHub.v1.services.universalMessaging;

// -----( IS Java Code Template v1.2

import com.wm.data.*;
import com.wm.util.Values;
import com.wm.app.b2b.server.Service;
import com.wm.app.b2b.server.ServiceException;
// --- <<IS-START-IMPORTS>> ---
import com.wm.lang.ns.NSName;
import com.wm.lang.ns.NSNode;
import com.wm.lang.ns.NSRecord;
import com.wm.app.b2b.server.Package;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import com.pcbsys.nirvana.client.nChannel;
import com.pcbsys.nirvana.client.nDurable;
import com.wm.app.b2b.server.dispatcher.DispatchFacade;
import com.wm.app.b2b.server.dispatcher.trigger.Trigger;
import com.wm.app.b2b.server.dispatcher.trigger.TriggerManager;
import com.wm.app.b2b.server.dispatcher.wmmessaging.UMConnectionAlias;
import com.wm.app.b2b.server.ns.Namespace;
// --- <<IS-END-IMPORTS>> ---

public final class javaServices

{
	// ---( internal utility methods )---

	final static javaServices _instance = new javaServices();

	static javaServices _newInstance() { return new javaServices(); }

	static javaServices _cast(Object o) { return (javaServices)o; }

	// ---( server methods )---




	public static final void checkTriggers (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(checkTriggers)>> ---
		// @sigtype java 3.5
		// [i] record:1:required interfaces
		// [i] - object:0:required id_interface
		// [i] - field:0:required interface_name
		// [i] - field:0:required environment
		// [i] - object:0:required enabled
		// [i] - field:0:required source_topic
		// [i] - field:0:required message_filter
		// [i] - field:0:required delivery_method
		// [i] - field:0:required custom_service_name
		// [i] - field:0:required delivery_endpoint
		// [i] - field:0:required delivery_format
		// [i] - field:0:required exclude_fields
		// [i] - field:0:required auth_type
		// [i] - field:0:required auth_user_name
		// [i] - field:0:required auth_password
		// [i] - field:0:required auth_token_service
		// [i] - field:0:required package_name
		// [i] - field:0:required trigger_folder_prefix
		// [i] field:1:required documentTypeList
		// [i] field:0:required umAlias
		// [i] field:0:required triggersPrefix
		// [o] field:1:required existingTriggers
		// [o] field:1:required updateTriggers
		// [o] field:1:required deleteTriggers
		// [o] field:1:required createTriggers
		try {
			IDataCursor pipelineCursor = pipeline.getCursor();
		
			IData[] interfaces = IDataUtil.getIDataArray( pipelineCursor, "interfaces");
			String[] documentTypeList = IDataUtil.getStringArray( pipelineCursor, "documentTypeList");
			String umAliasName = IDataUtil.getString( pipelineCursor, "umAlias");
			String triggersPrefix = IDataUtil.getString( pipelineCursor, "triggersPrefix");
			
			Integer maxTriggers = 50;
			String[] existingTriggers = new String[maxTriggers];
			String[] updateTriggers = new String[maxTriggers];
			String[] deleteDurables = new String[maxTriggers];
			String[] createTriggers = new String[maxTriggers];
			
			UMConnectionAlias umAlias = null;
			if(umAliasName == null || umAliasName.isEmpty() || umAliasName.contentEquals("DEFAULT")){
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getDefaultConnectionAlias();
				
			}else{
				umAlias = (UMConnectionAlias) DispatchFacade.getRuntimeConfigurationIfNotNull().getConnectionAlias(umAliasName);
			}
			
			int existingInterfaceCounter = 0;
			int updateInterfaceCounter = 0;
			int deleteDurableCounter = 0;
			int createTriggersCounter = 0;
			
			for (String documentType : documentTypeList){
				NSRecord nsRec = (NSRecord) Namespace.current().getNode(documentType);
				Values eventDesc = (Values) nsRec.getValues().get("eventDescription");
				
				String umPath = eventDesc.getValue("brokerEventTypeName").toString();
				umPath = "/" + umPath.replace("::", "/");
				
				nChannel channel = umAlias.lookupChannel(umPath);
				nDurable[] durables = channel.getDurableManager().getAll();
				int durableCount = durables.length;
				
				for (int j = 0; j < durableCount; j++) {
					boolean foundDurable = false;
			        if (durables[j].getName().contains("##") == false) {
			        	deleteDurables[deleteDurableCounter] = durables[j].getName();
						deleteDurableCounter += 1;
						continue;
			        }
					
			        String durableName = durables[j].getName().split("##")[1].replace("__", ".").replaceAll("\\.([^\\.]+$)", ":$1");
			        
			        for (int i = 0; i < interfaces.length; i++) {
						IDataCursor cursor = interfaces[i].getCursor();
					    try {
					    	String id_interface = IDataUtil.getString(cursor, "id_interface");
					        String interface_name = IDataUtil.getString(cursor, "interface_name");
					        
					        String trigger_name = triggersPrefix.concat(':' + interface_name);
					        String source_topic = IDataUtil.getString(cursor, "source_topic");
					        String message_filter = IDataUtil.getString(cursor, "message_filter");
					        
					        if (durableName.contentEquals(trigger_name)) {
					        	if (documentType.contains(source_topic) && durables[j].getSelector().contentEquals(message_filter)){
					        		existingTriggers[existingInterfaceCounter] = id_interface;
									existingInterfaceCounter += 1;
									foundDurable = true;
									
									IDataUtil.remove(cursor, "id_interface");
									
									break;
					        	} else {
					        		deleteDurables[deleteDurableCounter] = durables[j].getName();;
					        		deleteDurableCounter += 1;
									
									foundDurable = true;
									
									break;
					        	}
					        }
					    } finally {
					        cursor.destroy();
					    }
					}
			        if (foundDurable == false){
			        	deleteDurables[deleteDurableCounter] = durables[j].getName();
						deleteDurableCounter += 1;
			        }
			    }
			}
			
			 for (int i = 0; i < interfaces.length; i++) {
					IDataCursor cursor = interfaces[i].getCursor();
					if (IDataUtil.getString(cursor, "id_interface") != null){
						createTriggers[createTriggersCounter] = IDataUtil.getString(cursor, "id_interface");
						createTriggersCounter += 1;
					}
					
					cursor.destroy();
			 }
			
			existingTriggers = resizeArray(existingTriggers, existingInterfaceCounter);
			updateTriggers = resizeArray(updateTriggers, updateInterfaceCounter);
			deleteDurables = resizeArray(deleteDurables, deleteDurableCounter);
			createTriggers = resizeArray(createTriggers, createTriggersCounter);
		
			IDataUtil.put( pipelineCursor, "existingTriggers", existingTriggers);
			IDataUtil.put( pipelineCursor, "updateTriggers", updateTriggers);
			IDataUtil.put( pipelineCursor, "deleteTriggers", deleteDurables);
			IDataUtil.put( pipelineCursor, "createTriggers", createTriggers);
			
			pipelineCursor.destroy();
		} catch (Exception e) {
			throw new ServiceException(e);
		}
		// --- <<IS-END>> ---

                
	}



	public static final void commitTriggerUpdate (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(commitTriggerUpdate)>> ---
		// @sigtype java 3.5
		// [i] record:0:required triggerIData
		// [i] field:0:required triggerName
		IDataCursor pipelineCursor = pipeline.getCursor();	
		
		IData triggerIData = IDataUtil.getIData( pipelineCursor, "triggerIData" );	
		String triggerName = IDataUtil.getString( pipelineCursor, "triggerName" );
		
		
		IData intermediateDoc = IDataFactory.create();
		IDataCursor intermediateCursor = intermediateDoc.getCursor();
		
		Namespace ns = Namespace.current();
		NSName nsName = NSName.create(triggerName);
		NSNode nsNode = ns.getNode(nsName);
		
		nsNode.setFromData(triggerIData);
		Package pkg = (Package)nsNode.getPackage();
		ns.putNode(nsNode);
		
		  try {
		        pkg.getStore().addToNode(nsName, "node.ndf", triggerIData);
		    }
		    catch (final Exception e) {
		        throw new ServiceException(e);
		    } 
		  
		intermediateCursor.destroy();
		pipelineCursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void disableTriggerConnection (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(disableTriggerConnection)>> ---
		// @sigtype java 3.5
		// [i] field:0:required triggerName
		IDataCursor pipelineCursor = pipeline.getCursor();		
		String triggerName = IDataUtil.getString( pipelineCursor, "triggerName" );
		
		TriggerManager tm = TriggerManager.getDefault();
		Trigger tr = tm.getTrigger(triggerName);
		tr.prepareToStopTrigger();
		tr.stopTrigger(true, true);
			
		// --- <<IS-END>> ---

                
	}



	public static final void getConnectionAliasReports (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getConnectionAliasReports)>> ---
		// @sigtype java 3.5
		// [i] field:0:required connectionAlias
		// [o] record:0:required connectionAliasReport
		try {
			IDataCursor pipelineCursor = pipeline.getCursor();
			String connectionAlias = IDataUtil.getString( pipelineCursor, "connectionAlias");
			
			IData input = IDataFactory.create();
			IDataCursor inputCursor = input.getCursor();
			
			IDataUtil.put(inputCursor, "aliasName", connectionAlias);
			inputCursor.destroy();
			
			IData output = Service.doInvoke("wm.server.messaging", "getConnectionAliasReport", input);
			IDataUtil.remove(inputCursor, "aliasName");
			IDataUtil.put( pipelineCursor, "connectionAliasReport", output);
			
			pipelineCursor.destroy();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
			
		// --- <<IS-END>> ---

                
	}



	public static final void getIDataOfTrigger (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getIDataOfTrigger)>> ---
		// @sigtype java 3.5
		// [i] field:0:required triggerName
		IDataCursor pipelineCursor = pipeline.getCursor();	
		
		String triggerName = IDataUtil.getString( pipelineCursor, "triggerName" );
		
		
		IData intermediateDoc = IDataFactory.create();
		IDataCursor intermediateCursor = intermediateDoc.getCursor();
		
		Namespace ns = Namespace.current();
		NSName nsName = NSName.create(triggerName);
		NSNode nsNode = ns.getNode(nsName);
		
		IDataUtil.put( intermediateCursor, "triggerIData", nsNode.getAsData());
		
		intermediateCursor.destroy();
		IDataUtil.put(pipelineCursor, "triggerInfo", intermediateDoc);
		pipelineCursor.destroy();
			
		// --- <<IS-END>> ---

                
	}

	// --- <<IS-START-SHARED>> ---
	private static String[] resizeArray(String[] array, int newSize) {
		String[] newArray = new String[newSize];
	
	    // Copy elements from the original array to the new array
	    System.arraycopy(array, 0, newArray, 0, Math.min(array.length, newSize));
	    return newArray;
	}
	// --- <<IS-END-SHARED>> ---
}

