package MessagingHub.v1.services.admin;

// -----( IS Java Code Template v1.2

import com.wm.data.*;
import com.wm.util.Values;
import com.wm.app.b2b.server.Service;
import com.wm.app.b2b.server.ServiceException;
// --- <<IS-START-IMPORTS>> ---
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.ResultSet;
import org.apache.derby.jdbc.EmbeddedDataSource;
// --- <<IS-END-IMPORTS>> ---

public final class impl

{
	// ---( internal utility methods )---

	final static impl _instance = new impl();

	static impl _newInstance() { return new impl(); }

	static impl _cast(Object o) { return (impl)o; }

	// ---( server methods )---




	public static final void checkIfExistsEmbeddedDatabase (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(checkIfExistsEmbeddedDatabase)>> ---
		// @sigtype java 3.5
		// [o] field:0:required databaseExists
		IDataCursor pipelineCursor = pipeline.getCursor();
		String dbName = "MESSAGING_HUB";
		Connection conn;
		
		EmbeddedDataSource ds = new EmbeddedDataSource();
		ds.setDatabaseName(dbName);
		ds.setCreateDatabase("false");
		
		try {
			conn = ds.getConnection();
			Statement s = conn.createStatement();
			String queryConnections = "select * from connections";
			ResultSet rs = s.executeQuery(queryConnections);
		    s.close();
		    
		    s = conn.createStatement();
		    String queryInterfaces = "select * from interfaces";
		    rs = s.executeQuery(queryInterfaces);
		    s.close();
		    
		    conn.close();
		    
		    IDataUtil.put( pipelineCursor, "databaseExists", "true");
			pipelineCursor.destroy();
		    
		} catch (SQLException e) {
			IDataUtil.put( pipelineCursor, "databaseExists", "false");
			pipelineCursor.destroy();
		}
			
		// --- <<IS-END>> ---

                
	}



	public static final void createEmbeddedDatabase (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(createEmbeddedDatabase)>> ---
		// @sigtype java 3.5
		// [o] field:0:required databaseCreated
		IDataCursor pipelineCursor = pipeline.getCursor();
		String dbName = "MESSAGING_HUB";
		Connection conn;		 
		EmbeddedDataSource ds = new EmbeddedDataSource();
		ds.setDatabaseName(dbName);
		ds.setCreateDatabase("create");
		  try {
		conn = ds.getConnection();
		Statement s = conn.createStatement();
		
		String queryConnections = "create table connections( "
		+ "connection_name varchar(128) not null unique, "
		+ "connection_type varchar(128) not null, "
		+ "is_resource_name varchar(128) not null, "
		+ "prometheus_url varchar(128), "
		+ "global_prefix varchar(128) not null unique)";
		s.execute(queryConnections);
		s.close();
		
		s = conn.createStatement();
		String queryInterfaces = "CREATE TABLE interfaces( "
		    + "id_interface INT NOT NULL GENERATED ALWAYS AS IDENTITY UNIQUE, "
		    + "interface_name VARCHAR(128) NOT NULL, "
		    + "interface_type VARCHAR(128) NOT NULL, "
		    + "environment VARCHAR(128) NOT NULL, "
		    + "enabled BOOLEAN NOT NULL, "
		    + "source_topic VARCHAR(128) NOT NULL, "
		    + "message_filter VARCHAR(512), "
		    + "delivery_method VARCHAR(128) NOT NULL, "
		    + "custom_service_name VARCHAR(128), "
		    + "delivery_endpoint VARCHAR(128), "
		    + "delivery_format VARCHAR(128), "
		    + "exclude_fields VARCHAR(128), "
		    + "auth_type VARCHAR(128), "
		    + "auth_user_name VARCHAR(128), "
		    + "auth_password VARCHAR(128), "
		    + "auth_token_service VARCHAR(128), "
		    + "package_name VARCHAR(128), "
		    + "um_connection VARCHAR(128), "
		    + "global_prefix VARCHAR(128), "
		    + "messaging_hub_forwarding VARCHAR(128), "
		    + "trigger_execution_user VARCHAR(128), "
		    + "UNIQUE(interface_name, interface_type, source_topic, environment)"
		    + ")";
		s.execute(queryInterfaces);
		s.close();
		
		
		conn.close();
		
		IDataUtil.put( pipelineCursor, "databaseCreated", "true");
		pipelineCursor.destroy();
		
		} catch (SQLException e) {
		IDataUtil.put( pipelineCursor, "databaseCreated", "false");
		pipelineCursor.destroy();
		}
		// --- <<IS-END>> ---

                
	}



	public static final void dropTablesFromEmbeddedDatabase (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(dropTablesFromEmbeddedDatabase)>> ---
		// @sigtype java 3.5
		// [o] field:0:required databaseDropTable
		IDataCursor pipelineCursor = pipeline.getCursor();
		String dbName = "MESSAGING_HUB";
		Connection conn;
		
		EmbeddedDataSource ds = new EmbeddedDataSource();
		ds.setDatabaseName(dbName);
		ds.setCreateDatabase("false");
		
		try {
			conn = ds.getConnection();
			Statement s = conn.createStatement();
			String queryConnections = "drop table connections";
			s.execute(queryConnections);
		    s.close();
		    
		    s = conn.createStatement();
		    String queryInterfaces = "drop table interfaces";
		    s.execute(queryInterfaces);
		    s.close();
		    
		    conn.close();
		    
		    IDataUtil.put( pipelineCursor, "databasedropTable", "true");
			pipelineCursor.destroy();
		    
		} catch (SQLException e) {
			IDataUtil.put( pipelineCursor, "databaseDropTable", "false");
			pipelineCursor.destroy();
		}
		// --- <<IS-END>> ---

                
	}
}

