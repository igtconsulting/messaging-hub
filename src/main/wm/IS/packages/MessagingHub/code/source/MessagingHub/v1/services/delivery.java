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




	public static final void excludeVariablesFromDocument (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(excludeVariablesFromDocument)>> ---
		// @sigtype java 3.5
		// [i] record:0:required inputDocument
		// [i] field:1:required excludePaths
		// [o] record:0:required outputDocument
		IDataCursor pipelineCursor = pipeline.getCursor();
		
		IData inputDocument = IDataUtil.getIData(pipelineCursor, "inputDocument");
		String[] pathsToRemove = IDataUtil.getStringArray(pipelineCursor, "excludePaths");
		
		if (inputDocument == null || pathsToRemove == null) {
		    pipelineCursor.destroy();
		    throw new ServiceException("Missing inputDocument or excludePaths");
		}
		
		// Deep clone inputDocument to avoid mutating original
		IData outputDocument;
		try {
			outputDocument = IDataUtil.deepClone(inputDocument);
		    for (String fullPath : pathsToRemove) {
		    	//removePath(outputDocument, fullPath.trim().split("/"));
		    	removePathRecursive(outputDocument, fullPath.trim().split("/"));
		    }
		
		    IDataUtil.put(pipelineCursor, "outputDocument", outputDocument);
		    pipelineCursor.destroy();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		// --- <<IS-END>> ---

                
	}



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
	private static void removePath(IData current, String[] keys) {
	    if (current == null || keys == null || keys.length == 0) return;
	
	    IDataCursor cursor = current.getCursor();
	    for (int i = 0; i < keys.length; i++) {
	        String key = keys[i];
	
	        if (i == keys.length - 1) {
	            // Final key: remove it
	            if (cursor.first(key)) {
	                cursor.delete();
	            }
	        } else {
	            // Intermediate key: dive deeper
	            if (cursor.first(key)) {
	                IData next = IDataUtil.getIData(cursor);
	                cursor.destroy();
	                if (next != null) {
	                    removePath(next, java.util.Arrays.copyOfRange(keys, i + 1, keys.length));
	                }
	                return;
	            } else {
	                cursor.destroy();
	                return; // path doesn't exist
	            }
	        }
	    }
	    cursor.destroy();
	}
	
	private static void removePathRecursive(IData doc, String[] keys) {
	    if (doc == null || keys == null || keys.length == 0) return;
	
	    IDataCursor cursor = doc.getCursor();
	
	    for (int i = 0; i < keys.length; i++) {
	        String key = keys[i];
	
	        if (i == keys.length - 1) {
	            // Final key \u2014 remove the field
	            if (cursor.first(key)) {
	                cursor.delete();
	            }
	        } else {
	            if (cursor.first(key)) {
	                Object next = cursor.getValue();
	
	                // Recurse into nested document
	                if (next instanceof IData) {
	                    cursor.destroy();
	                    removePathRecursive((IData) next, java.util.Arrays.copyOfRange(keys, i + 1, keys.length));
	                    return;
	                }
	
	                // Recurse into document list
	                if (next instanceof IData[]) {
	                    IData[] dataList = (IData[]) next;
	                    for (IData item : dataList) {
	                        removePathRecursive(item, java.util.Arrays.copyOfRange(keys, i + 1, keys.length));
	                    }
	                    cursor.destroy();
	                    return;
	                }
	            } else {
	                cursor.destroy();
	                return; // Path does not exist
	            }
	        }
	    }
	
	    cursor.destroy();
	}
	// --- <<IS-END-SHARED>> ---
}

