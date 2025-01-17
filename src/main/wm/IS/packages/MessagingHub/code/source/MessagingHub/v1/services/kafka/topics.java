package MessagingHub.v1.services.kafka;

// -----( IS Java Code Template v1.2

import com.wm.data.*;
import com.wm.util.Values;
import com.wm.app.b2b.server.Service;
import com.wm.app.b2b.server.ServiceException;
// --- <<IS-START-IMPORTS>> ---
import com.wm.lang.ns.NSField;
import com.wm.lang.ns.NSName;
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
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
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
}

