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
		String queryInterfaces = "create table interfaces( "
		+ "id_interface int not null generated always as identity unique, "
		+ "interface_name varchar(128) not null, "
		+ "interface_type varchar(128) not null, "
		+ "environment varchar(128) not null, "
		+ "enabled boolean not null, "
		+ "source_topic varchar(128) not null, "
		+ "message_filter varchar(128), "
		+ "delivery_method varchar(128) not null, "
		+ "custom_service_name varchar(128), "
		+ "delivery_endpoint varchar(128), "
		+ "delivery_format varchar(128), "
		+ "exclude_fields varchar(128), "
		+ "auth_type varchar(128), "
		+ "auth_user_name varchar(128), "
		+ "auth_password varchar(128), "
		+ "auth_token_service varchar(128), "
		+ "package_name varchar(128), "
		+ "um_connection varchar(128), "
		+ "global_prefix varchar(128), "
		+ "messaging_hub_forwarding varchar(128), "
		+ "trigger_execution_user varchar(128))";
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

