package MessagingHub.v1.services;

// -----( IS Java Code Template v1.2

import com.wm.data.*;
import com.wm.util.Values;
import com.wm.app.b2b.server.Service;
import com.wm.app.b2b.server.ServiceException;
// --- <<IS-START-IMPORTS>> ---
import java.net.InetAddress;
import java.net.UnknownHostException;
import com.wm.util.Debug;
import java.io.*;
import java.util.*;
import java.lang.System;
import com.wm.app.b2b.server.*;
import com.wm.util.Table;
import java.text.*;
import com.wm.lang.ns.*;
// --- <<IS-END-IMPORTS>> ---

public final class delivery

{
	// ---( internal utility methods )---

	final static delivery _instance = new delivery();

	static delivery _newInstance() { return new delivery(); }

	static delivery _cast(Object o) { return (delivery)o; }

	// ---( server methods )---




	public static final void getDocumentFromInput (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(getDocumentFromInput)>> ---
		// @sigtype java 3.5
		// [o] record:0:required document
		// [o] field:0:required documentType
		IDataCursor cursor = pipeline.getCursor();
		cursor.first();
		
		while(!(cursor.getValue() instanceof IData)){
			if(cursor.hasMoreData()){
				cursor.next();
			} else {
				break;
			}
		}
		
			
		try {
			String keyValue = cursor.getKey();
			IDataUtil.put(cursor, "document", IDataUtil.clone((IData) cursor.getValue()));
			IDataUtil.put(cursor, "documentType", keyValue);
		} catch (Exception ex) {
			throw new ServiceException(ex);
		}		
		cursor.destroy();
		// --- <<IS-END>> ---

                
	}



	public static final void pipelineAsDocument (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(pipelineAsDocument)>> ---
		// @sigtype java 3.5
		// [i] field:0:required docName
		// [i] field:1:required excludeFields
		// [o] record:0:required pipelineDoc
	IDataCursor cursor = pipeline.getCursor();
	String[] excludeList = (String[]) IDataUtil.get(cursor, "excludeFields");
	String docName = IDataUtil.getString(cursor, "docName");
	IData clonedDoc;
	try {
		IData receivedDoc = IDataUtil.getIData(cursor, docName);
		clonedDoc = IDataUtil.deepClone(receivedDoc);
		IDataCursor ccursor = clonedDoc.getCursor();
		if (Objects.nonNull(excludeList)) {
			for (String row : excludeList) 
			{ 
			    IDataUtil.remove(ccursor, row);
			}
		}
		ccursor.destroy();
	} catch (Exception ex) {
		throw new ServiceException(ex);
	}
	IDataUtil.put(cursor, "pipelineDoc", clonedDoc);			
	cursor.destroy();
		// --- <<IS-END>> ---

                
	}

	// --- <<IS-START-SHARED>> ---
	
	// --- <<IS-END-SHARED>> ---
}

