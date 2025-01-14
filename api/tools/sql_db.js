const { SqlDatabase } = require("langchain/sql_db");
const { DataSource } = require("typeorm");
const fs = require('fs');

const { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, PromptTemplate } = require("@langchain/core/prompts");
const { ChatOpenAI } = require("@langchain/openai");
const { createOpenAIToolsAgent, AgentExecutor } = require("langchain/agents");
const { SqlToolkit } = require("langchain/agents/toolkits/sql");
const { AIMessage } = require("langchain/schema");

const { Pool } = require('pg');

var db = null;
var sqlToolKit = null;
var pool = null;

async function initializeDB(llm, appId){

	var datasource;
	var dbConfig = await AppData.findOne({cid: appId?appId.toString(): "1", type: "database"});
	if(!dbConfig){
		dbConfig = await AppData.findOne({cid: "1", type: "database"});
	}

	dbConfig = dbConfig.data;

	if(dbConfig.database_type==="postgres"){
		pool = new Pool({
		  user: dbConfig.db_user,
		  host: dbConfig.db_host,
		  database: dbConfig.db_name,
		  password: dbConfig.db_password,
		  port: dbConfig.db_port,
		  /*ssl: {
		    rejectUnauthorized: false,
		    // ca: sslCert
		  }*/
		});
	}

	/*datasource = new DataSource({
	  type: dbConfig.database_type,
	  user: dbConfig.db_user,
	  host: dbConfig.db_host,
	  database: dbConfig.db_name,
	  password: dbConfig.db_password,
	  port: dbConfig.db_port,
	  synchronize: false,
	  logging: false,
	  // ssl: {
	  //   rejectUnauthorized: false,
	  //   ca: sslCert
	  // }
	});*/

	/*if(sails.config.environment === 'development'){
		pool = new Pool({
		  user: sails.config.custom.SQL_DB.user,
		  host: sails.config.custom.SQL_DB.host,
		  database: sails.config.custom.SQL_DB.database,
		  password: sails.config.custom.SQL_DB.password,
		  port: sails.config.custom.SQL_DB.port, // default PostgreSQL port
		  // ssl: {
		  //   rejectUnauthorized: sails.config.custom.SQL_DB.is_ssl,
		  //   ca: sslCert
		  // }
		});

		datasource = new DataSource({
		  type: sails.config.custom.SQL_DB.dbType,
		  host: sails.config.custom.SQL_DB.host,
		  port: sails.config.custom.SQL_DB.port,
		  username: sails.config.custom.SQL_DB.user,
		  password: sails.config.custom.SQL_DB.password,
		  database: sails.config.custom.SQL_DB.database,
		  synchronize: false,
		  logging: false,
		  ssl: {
		    rejectUnauthorized: sails.config.custom.SQL_DB.is_ssl,
		    // ca: sslCert
		  }
		});	
	}else{
		//Specific to aws cert
		// const sslCert = fs.readFileSync('rds-combined-ca-bundle.pem').toString();
		pool = new Pool({
		  user: sails.config.custom.SQL_DB.user,
		  host: sails.config.custom.SQL_DB.host,
		  database: sails.config.custom.SQL_DB.database,
		  password: sails.config.custom.SQL_DB.password,
		  port: sails.config.custom.SQL_DB.port, // default PostgreSQL port
		  ssl: {
		    rejectUnauthorized: true,
		    // ca: sslCert
		  }
		});

		datasource = new DataSource({
		  type: sails.config.custom.SQL_DB.dbType,
		  host: sails.config.custom.SQL_DB.host,
		  port: sails.config.custom.SQL_DB.port,
		  username: sails.config.custom.SQL_DB.user,
		  password: sails.config.custom.SQL_DB.password,
		  database: sails.config.custom.SQL_DB.database,
		  synchronize: false,
		  logging: false,
		  ssl: {
		    rejectUnauthorized: true,
		    // ca: sslCert
		  }
		});	
	}*/

	

	/*db = await SqlDatabase.fromDataSourceParams({
	  appDataSource: datasource,
	});

	sqlToolKit = new SqlToolkit(db, llm)*/

	// console.log(db.allTables.map((t) => t));
}

async function execute_query(llm, query){
	console.log("Initializing DB");
	if(!db){
		await initializeDB(llm);
	}

	console.log(`Running query - ${query}`);
	var res;

	if(db){
		res = await db.run(query);
		res = JSON.parse(res);
	}else{
		const client = await pool.connect(); // Get a client from the pool
	    try {
	        res = await client.query(query); // Execute the query
	        console.log('Query Result:', res.rows); // Print the result
	        res = res.rows;
	    } catch (err) {
	        console.error('Error executing query:', err.stack); // Print error if it occurs
	    } finally {
	        client.release(); // Release the client back to the pool
	    }
	}
	res = res
    	.flat()
    	.filter(el => el != null);
  	return res;
}

async function execute_db_operation(llm, input){
	if(!sqlToolKit){
		await initializeDB(llm);
	}
	const tools = sqlToolKit.getTools()
	const SQL_PREFIX = `You are an agent designed to interact with a SQL database.
	Given an input question, create a syntactically correct {dialect} query to run, then look at the results of the query and return the answer.
	Unless the user specifies a specific number of examples they wish to obtain, always limit your query to at most {top_k} results using the LIMIT clause.
	You can order the results by a relevant column to return the most interesting examples in the database.
	Never query for all the columns from a specific table, only ask for a the few relevant columns given the question.
	You have access to tools for interacting with the database.
	Only use the below tools.
	Only use the information returned by the below tools to construct your final answer.
	You MUST double check your query before executing it. If you get an error while executing a query, rewrite the query and try again.

	DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.

	If the question does not seem related to the database, just return "I don't know" as the answer.`;
	const SQL_SUFFIX = `Begin!

	Question: {input}
	Thought: I should look at the tables in the database to see what I can query.
	{agent_scratchpad}`;
	const prompt = ChatPromptTemplate.fromMessages([
	  ["system", SQL_PREFIX],
	  HumanMessagePromptTemplate.fromTemplate("{input}"),
	  new AIMessage(SQL_SUFFIX.replace("{agent_scratchpad}", "")),
	  new MessagesPlaceholder("agent_scratchpad"),
	]);
	const newPrompt = await prompt.partial({
	  dialect: sqlToolKit.dialect,
	  top_k: "10",
	});
	const runnableAgent = await createOpenAIToolsAgent({
	  llm,
	  tools,
	  prompt: newPrompt,
	});
	const agentExecutor = new AgentExecutor({
	  agent: runnableAgent,
	  tools,
	});

	var res = await agentExecutor.invoke({
	   	"input": input
	});
	console.log(res)
	return res;
}

async function get_schema(llm, appId){
	const tablesQuery = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public';
  `;
  
  const columnsQuery = `
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema='public';
  `;
  
  const constraintsQuery = `
    SELECT
      tc.table_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM
      information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE
      tc.table_schema = 'public';
  `;

  	if(!pool){
		await initializeDB(llm, appId);
	}
  
  const tablesResult = await pool.query(tablesQuery);
  const columnsResult = await pool.query(columnsQuery);
  const constraintsResult = await pool.query(constraintsQuery);

  const tables = tablesResult.rows.map(row => row.table_name);
  const columns = columnsResult.rows;
  const constraints = constraintsResult.rows;

  return { tables, columns, constraints };
}

function formatSchema({ tables, columns, constraints }, useful_tables=[]) {
  	if(useful_tables.length === 0){
  		let schemaDescription = 'Tables:\n';
  		tables.forEach(table => {
		    schemaDescription += `  ${table}:\n    columns:\n`;

		    columns.filter(col => col.table_name === table).forEach(col => {
		      schemaDescription += `      ${col.column_name}: ${col.data_type} (${col.is_nullable ? 'nullable' : 'not nullable'})\n`;
		    });

		    schemaDescription += '    constraints:\n';

		    constraints.filter(con => con.table_name === table).forEach(con => {
		      if (con.constraint_type === 'PRIMARY KEY') {
		        schemaDescription += `      primary key: ${con.column_name}\n`;
		      } else if (con.constraint_type === 'FOREIGN KEY') {
		        schemaDescription += `      foreign key: ${con.column_name} references ${con.foreign_table_name}(${con.foreign_column_name})\n`;
		      }
		    });
	  	});

	  	return schemaDescription
  	}else{
  		const schemaDescription = {};

		useful_tables.forEach(table => {
		  const tableSchema = {
		    columns: {},
		    constraints: {}
		  };

		  // Add columns
		  columns.filter(col => col.table_name === table).forEach(col => {
		    tableSchema.columns[col.column_name] = {
		      data_type: col.data_type,
		      nullable: col.is_nullable
		    };
		  });

		  // Add constraints
		  tableSchema.constraints = {
		    primary_keys: [],
		    foreign_keys: []
		  };

		  constraints.filter(con => con.table_name === table).forEach(con => {
		    if (con.constraint_type === 'PRIMARY KEY') {
		      tableSchema.constraints.primary_keys.push(con.column_name);
		    } else if (con.constraint_type === 'FOREIGN KEY') {
		      tableSchema.constraints.foreign_keys.push({
		        column_name: con.column_name,
		        references: `${con.foreign_table_name}(${con.foreign_column_name})`
		      });
		    }
		  });

		  // Assign the table schema to the main schema description
		  schemaDescription[table] = tableSchema;
		});

		// Convert schemaDescription to JSON
		return JSON.stringify(schemaDescription, null, 2);
  	}
}

async function sql_lang_graph_with_human_response(state){
	const { query, llm } = state;
	console.log("Langchain SQL Agent Activated");
	var res = await execute_db_operation(llm, query);
	console.log(res);
	return {
	    finalResult: res,
	    "lastExecutedNode": "sql_query_node"
	};
}

async function sql_lang_graph_db_query(state){
	const {llm, chatId, conversation, user} = state;

	if(!sqlToolKit){	
		await initializeDB(llm, user.appId.toString());
	}

	var query = conversation[conversation.length-1]['content'];

	const schema = await get_schema(llm, user.appId.toString());
	const {tables} = schema;

	var messages = [{
			"role": "system", 
			"content": `Find list of ATLEAST 5 useful tables from the provided list of tables for the given user query. Your response must be in json format as {useful_tables: array_of_table_names}. Given tables:
			${tables.join("\n")}
			YOUR RESPONSE MUST CONTAIN MINIMUM 5 tables which has high possibility of having answer.`
		},
		{"role": "user", "content": `query: ${query}`}];

	var response = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});

	var useful_tables = JSON.parse(response[0]['message']['content']);

	console.log(useful_tables);

  	const formattedSchema = formatSchema(schema, useful_tables['useful_tables']);

  	console.log(formattedSchema);

	// const userQuery = "List all users and their orders";
	var final_messages = [
		{
			"role": "system",
			"content": `Given the following database schema: 
				{database_schema: ${formattedSchema}}

				Understand the user query and carefully analyze provided database_schema and then construct an SQL query to answer the user's query strictly according to the given database_schema. The query should limit the result to the top 10 rows unless a different row count is explicitly specified in the query. Include only the columns necessary to respond to the user query and only if they are present in the table you are querying to. You may use multiple tables to retrieve the final results. 
				Your response must be in JSON format as {"sql_query": "constructed_sql_query"}. 
				Carefully ensure the SQL query is both syntactically and semantically correct, and avoid making any assumptions about the schema.`
		},
		{
			"role": "user",
			"content": `query: ${query}`
		}
	]

	var response2 = await sails.helpers.callChatGpt.with({"messages": final_messages, "max_tokens": 4096});
	response2 = JSON.parse(response2[0]['message']['content']);

	var final_query_result = await execute_query(llm, response2['sql_query']);
	
	return {
		lastExecutedNode: "sql_query_node",
		finalResult: final_query_result
	}
}

async function invoice_generator(state){
	const {llm, chatId, conversation, user} = state;
	if(!sqlToolKit){	
		await initializeDB(llm, user.appId.toString());
	}

	var query = conversation[conversation.length-1]['content'];

	const schema = await get_schema(llm, user.appId.toString());

  	const formattedSchema = formatSchema(schema, ['sale_order', 'res_company', 'res_currency', 'crm_lead', 'res_partner', 'account_payment_term', 'product_pricelist', 'res_users']);


}

async function quotation_generator(state){
	const {llm, chatId, conversation, user} = state;
	if(!sqlToolKit){	
		await initializeDB(llm, user.appId.toString());
	}

	var query = conversation[conversation.length-1]['content'];

	const schema = await get_schema(llm, user.appId.toString());

  	const formattedSchema = formatSchema(schema, ['sale_order', 'res_company', 'res_currency', 'crm_lead', 'res_partner', 'account_payment_term', 'product_pricelist', 'res_users']);

	// const userQuery = "List all users and their orders";
	var final_messages = [
		{
			"role": "system",
			"content": `Given the following sale_order schema: ${formattedSchema}, construct a SQL query to retrieve detailed sale_order information based strictly on the schema. The query must return the following fields: id, partner name, partner address, shipping details, phone, email, quotation date, expiration, and salesperson. Only include columns present in the provided schema. Your response should be in JSON format as {"sql_query": "constructed_sql_query"}. If any required columns are not present in the schema, omit them from the query.`
			/*"content": `Here is the sale_order schema:
						${formattedSchema}
						Please construct a SQL query to retrieve detailed sale_order for the given user query.
						SQL query result must be able to retrieve sale order details which must include id, partner name, partner address, shipping details, phone, email, quotation date, expiration, salesperson.  You should include columns only necessary to reply the answer. Your reply must be in json format as {"sql_query": "constructed_sql_query"}. Think slowly and carefully to form a query that is syntactically and semantically correct and uses columns and tables from the provided database schema only. Do not make any assumption and construct the query independent of schema. Before giving response ensure that columns and tables mentioned in the query are present in the provided schema.`*/
		},
		{
			"role": "user",
			"content": `query: ${query}`
		}
	]

	var response = await sails.helpers.callChatGpt.with({"messages": final_messages, "max_tokens": 4096});
	response = JSON.parse(response[0]['message']['content']);

	var sale_order = await execute_query(llm, response['sql_query']);

	const formattedSchema1 = formatSchema(schema, ['sale_order_line']);

	// const userQuery = "List all users and their orders";
	final_messages = [
		{
			"role": "system",
			"content": `Given the following sale_order_line schema: ${formattedSchema1}, construct a SQL query to retrieve necessary information from sale_order_line based on the id of provided sale_order: ${JSON.stringify(sale_order)}. Do not include any other condition in WHERE clause other than sale order id. The query should limit the results to the top 50 rows unless specified otherwise. Include only the columns present in the provided schema that are necessary to respond to the user query. Your response must be in JSON format as {"sql_query": "constructed_sql_query"}. Ensure the SQL query is syntactically and semantically correct, and avoid making assumptions about the schema.`
		},
		{
			"role": "user",
			"content": `query: ${query}`
		}
	]

	var response2 = await sails.helpers.callChatGpt.with({"messages": final_messages, "max_tokens": 4096});
	response2 = JSON.parse(response2[0]['message']['content']);
	var sale_order_detail = await execute_query(llm, response2['sql_query']);
	
	return {
		lastExecutedNode: "sql_query_node",
		finalResult: {"sale_order": sale_order, "sale_order_detail": sale_order_detail}
	}
}

module.exports = {
	initializeDB,
	execute_query,
	sql_lang_graph_db_query,
	sql_lang_graph_with_human_response,
	execute_db_operation,
	quotation_generator
}