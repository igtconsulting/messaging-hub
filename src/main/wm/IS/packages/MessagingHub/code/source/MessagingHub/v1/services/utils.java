package MessagingHub.v1.services;

// -----( IS Java Code Template v1.2

import com.wm.data.*;
import com.wm.util.Values;
import com.wm.app.b2b.server.Service;
import com.wm.app.b2b.server.ServiceException;
// --- <<IS-START-IMPORTS>> ---
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.regex.*;
// --- <<IS-END-IMPORTS>> ---

public final class utils

{
	// ---( internal utility methods )---

	final static utils _instance = new utils();

	static utils _newInstance() { return new utils(); }

	static utils _cast(Object o) { return (utils)o; }

	// ---( server methods )---




	public static final void matches (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(matches)>> ---
		// @sigtype java 3.5
		// Toni Immordino
		
				// pipeline
				IDataCursor pipelineCursor = pipeline.getCursor();
				String regex = IDataUtil.getString( pipelineCursor, "regex" );
				String input = IDataUtil.getString( pipelineCursor, "input" );
				pipelineCursor.destroy();
				
				String match = "false";
				
				Pattern pattern = Pattern.compile(regex);
				Matcher matcher = pattern.matcher(input);
				
				if (matcher.matches())
				{
					match = "true";
				}
				
				
				// pipeline
				IDataCursor pipelineCursor_1 = pipeline.getCursor();
				IDataUtil.put( pipelineCursor_1, "match", match );
				pipelineCursor_1.destroy();
				
		// --- <<IS-END>> ---

                
	}



	public static final void timestampStringToEpoch (IData pipeline)
        throws ServiceException
	{
		// --- <<IS-START(timestampStringToEpoch)>> ---
		// @sigtype java 3.5
		// [i] field:0:required dateTimeString
		// [i] field:0:required dateTimeFormat
		// [o] field:0:required epoch
		IDataCursor pipelineCursor = pipeline.getCursor();
		String	dateTimeString = IDataUtil.getString( pipelineCursor, "dateTimeString" );
		String	dateTimeFormat = IDataUtil.getString( pipelineCursor, "dateTimeFormat" );
		
		// input validation
		if(dateTimeString == null || dateTimeString.equals("") ) {
		throw new ServiceException("dateTimeString is missing");
		}
		
		if(dateTimeFormat == null || dateTimeFormat.equals("") ) {
		throw new ServiceException("dateTimeFormat is missing");
		}
		
		Long milis;	
		
		try
		{
			DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern(dateTimeFormat);
			//TODO: Improve this condition detecting timestamp/date
			if(!dateTimeFormat.contains("HH")&&!dateTimeFormat.contains("hh")){
				LocalDate date = LocalDate.parse(dateTimeString, DateTimeFormatter.ofPattern(dateTimeFormat));
				ZonedDateTime zdt = date.atStartOfDay(ZoneId.of("Europe/Zurich"));
				milis = zdt.toInstant().toEpochMilli();
			} else {
				LocalDateTime date = LocalDateTime.parse(dateTimeString, inputFormatter);
				ZonedDateTime zdt = date.atZone(ZoneId.of("Europe/Zurich"));
				milis = zdt.toInstant().toEpochMilli();
			}
			
			IDataUtil.put( pipelineCursor, "epoch", String.valueOf(milis));
			
		}
		catch (Exception e)
		{
		throw new ServiceException("dateTimeString \'" + dateTimeString + "\' doesn't match the format \'" + dateTimeFormat + "\'" );
		}
		
			
		// --- <<IS-END>> ---

                
	}
}

