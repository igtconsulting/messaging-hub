package MessagingHub.v1.services.kafka;

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
import com.wm.app.b2b.server.PackageManager;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import com.pcbsys.nirvana.client.nChannel;
import com.pcbsys.nirvana.client.nDurable;
import com.wm.app.b2b.server.dispatcher.DispatchFacade;
import com.wm.app.b2b.server.dispatcher.wmmessaging.UMConnectionAlias;
import com.wm.app.b2b.server.ns.Namespace;
import com.wm.app.b2b.server.streaming.StreamingSubsystem;
import com.wm.app.b2b.server.streaming.consumer.Trigger;
import com.wm.app.b2b.server.streaming.consumer.TriggerConfiguration;
// --- <<IS-END-IMPORTS>> ---

public final class javaServices

{
	// ---( internal utility methods )---

	final static javaServices _instance = new javaServices();

	static javaServices _newInstance() { return new javaServices(); }

	static javaServices _cast(Object o) { return (javaServices)o; }

	// ---( server methods )---




	public static final void commitEventTriggerUpdate (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(commitEventTriggerUpdate)>> ---
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



	public static final void disableEventTrigger (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(disableEventTrigger)>> ---
		// @sigtype java 3.5
		// [i] field:0:required triggerName
		// [i] field:0:required packageName
		// [i] record:0:optional trigger
		// [i] - field:0:required aliasName
		// [i] - field:0:required maxConsumers
		// [i] - field:0:required topic
		// [i] - field:0:optional executeUser
		// [i] - field:0:optional enabled
		IDataCursor dc = pipeline.getCursor();// 931
		String triggerName = IDataUtil.getString(dc, "triggerName");// 933
		String packageName = IDataUtil.getString(dc, "packageName");// 934
		Package pkg = PackageManager.getPackage(packageName);
		TriggerConfiguration tc = StreamingSubsystem.getInstance().getTriggerConfiguration();// 966
		Trigger trigger = tc.getTrigger(triggerName);
		//Trigger[] trigger = tc.getTriggers();
		trigger.prepareToStopTrigger();
		trigger.stopTrigger(true);
		// 967
		//		if (trigger == null) {// 968
		//		throw new ServiceException(StreamingBundle.class, StreamingBundle.INVALID_RUNTIME_TRIGGER, "", new String[]{triggerName, "no trigger found"});// 969
		//		} else {
		//		trigger.unregister();// 974
		//		trigger.setFromData(pipeline);// 975
		//		PackageStore pkgStore = pkg.getStore();// 976
		//		
		//		try {
		//		pkgStore.updateDescription(trigger.getNSName(), pipeline);// 978
		//		} catch (IOException var9) {// 9
		//		}
		//		
		//		trigger.register();// 984
		//}
		//        if (triggerName != null && triggerName.length() >= 1) {// 937
		//            if (packageName != null && packageName.length() >= 1) {// 942
		//                if (NSName.validateName(triggerName) != null) {// 947
		//                    throw new ServiceException(StreamingBundle.class, StreamingBundle.UNABLE_TO_CREATE_TRIGGER_INVALID_NSNAME, "", triggerName);// 948
		//                } else if (triggerName.indexOf(58) == -1) {// 953
		//                    throw new ServiceException(StreamingBundle.class, StreamingBundle.UNABLE_TO_CREATE_TRIGGER_INVALID_NAME, "", triggerName);// 954
		//                } else {
		//                    Package pkg = PackageManager.getPackage(packageName);// 959
		//                    if (pkg == null) {// 960
		//                        throw new ServiceException(StreamingBundle.class, StreamingBundle.UNABLE_TO_CREATE_TRIGGER_INVALID_PACKAGE, "", new String[]{triggerName, packageName});// 961
		//                    } else {
		//                        TriggerConfiguration tc = StreamingSubsystem.getInstance().getTriggerConfiguration();// 966
		//                        Trigger trigger = tc.getTrigger(triggerName);// 967
		//                        if (trigger == null) {// 968
		//                            throw new ServiceException(StreamingBundle.class, StreamingBundle.INVALID_RUNTIME_TRIGGER, "", new String[]{triggerName, "no trigger found"});// 969
		//                        } else {
		//                            trigger.unregister();// 974
		//                            trigger.setFromData(pipeline);// 975
		//                            PackageStore pkgStore = pkg.getStore();// 976
		//
		//                            try {
		//                                pkgStore.updateDescription(trigger.getNSName(), pipeline);// 978
		//                            } catch (IOException var9) {// 979
		//                            }
		//
		//                            trigger.register();// 984
		//                        }
		//                    }
		//                }
		//            } else {
		//                throw new ServiceException(StreamingBundle.class, StreamingBundle.MISSING_REQUIRED_PARAMETER, "", "packageName");// 943
		//            }
		//        } else {
		//            throw new ServiceException(StreamingBundle.class, StreamingBundle.MISSING_REQUIRED_PARAMETER, "", "triggerName");// 938
		//        }
		// --- <<IS-END>> ---

                
	}



	public static final void getAllEventTriggers (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getAllEventTriggers)>> ---
		// @sigtype java 3.5
		IDataCursor cursor = pipeline.getCursor();
		TriggerConfiguration tc = StreamingSubsystem.getInstance().getTriggerConfiguration();
		Trigger[] triggers = tc.getTriggers();
		
		IData[] output = new IData[triggers.length];
		
		for(int i = 0; i < triggers.length; i++){
		output[i] = IDataFactory.create();
		IDataCursor subCursor = output[i].getCursor();
		IDataUtil.put( subCursor, "triggerDetails", triggers[i].getAsData());
		subCursor.destroy();
		}
		
		IDataUtil.put( cursor, "triggerList", output);
		cursor.destroy();
		// --- <<IS-END>> ---

                
	}
}

