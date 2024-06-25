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

async function initializeDB(llm){

	var datasource;

	console.log(sails.config.environment);

	if(sails.config.environment === 'development'){
		const sslCert = fs.readFileSync('rds-combined-ca-bundle.pem').toString();
		pool = new Pool({
		  user: sails.config.custom.SQL_DB.user,
		  host: sails.config.custom.SQL_DB.host,
		  database: sails.config.custom.SQL_DB.database,
		  password: sails.config.custom.SQL_DB.password,
		  port: sails.config.custom.SQL_DB.port, // default PostgreSQL port
		  ssl: {
		    rejectUnauthorized: true,
		    ca: sslCert
		  }
		});

		datasource = new DataSource({
		  type: "postgres",
		  host: "localhost",
		  port: 5432,
		  username: "demo",
		  password: "demo",
		  database: "ecmps",
		  synchronize: false,
		  logging: false,
		  ssl: {
		    rejectUnauthorized: true,
		    ca: sslCert
		  }
		});	
	}else{
		//Specific to aws cert
		const sslCert = fs.readFileSync('rds-combined-ca-bundle.pem').toString();
		pool = new Pool({
		  user: sails.config.custom.SQL_DB.user,
		  host: sails.config.custom.SQL_DB.host,
		  database: sails.config.custom.SQL_DB.database,
		  password: sails.config.custom.SQL_DB.password,
		  port: sails.config.custom.SQL_DB.port, // default PostgreSQL port
		  ssl: {
		    rejectUnauthorized: true,
		    ca: sslCert
		  }
		});

		datasource = new DataSource({
		  type: "postgres",
		  host: "localhost",
		  port: 5432,
		  username: "demo",
		  password: "demo",
		  database: "ecmps",
		  synchronize: false,
		  logging: false,
		  ssl: {
		    rejectUnauthorized: true,
		    ca: sslCert
		  }
		});	
	}

	

	db = await SqlDatabase.fromDataSourceParams({
	  appDataSource: datasource,
	});

	sqlToolKit = new SqlToolkit(db, llm)

	// console.log(db.allTables.map((t) => t));
}

async function execute_query(llm, query){
	if(!db){
		await initializeDB(llm);
	}

	console.log(db);

	console.log(`Running query - ${query}`);
	var res = await db.run(query);
	console.log("Query result");
	console.log(res);
	res = JSON.parse(res);
	console.log(res);
	res = res
    	.flat()
    	.filter(el => el != null);
	console.log("After flattening");
	console.log(res);
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

async function get_schema(){
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
		await initializeDB(llm);
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
  	let schemaDescription = 'Tables:\n';
  	if(useful_tables.length === 0){
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
  	}else{
  		useful_tables.forEach(table => {
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
  	}
  

  return schemaDescription;
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
	const {query, llm} = state;

	if(!sqlToolKit){	
		await initializeDB(llm);
	}

	const schema = await get_schema();
	const {tables} = schema;

	console.log("SQL query node execution initiated");

	var messages = [{"role": "system", "content":`Find list of useful tables from the provided list of tables for the given user query. Your response must be in json format as {useful_tables: array_of_table_names}. Given tables:
		${tables.join("\n")}`},
		{"role": "user", "content": `query: ${query}`}];

	var response = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});

	var useful_tables = JSON.parse(response[0]['message']['content']);

	console.log(`Useful tables are:\n ${useful_tables}`);

  	const formattedSchema = formatSchema(schema, useful_tables['useful_tables']);

	// const userQuery = "List all users and their orders";
	var final_messages = [
		{
			"role": "system",
			"content": `Here is the database schema:
						${formattedSchema}
						Please construct an SQL query to answer user query. Query should limit the result to top 10 row untill specified exclusively about the row count in query. You should columns only necessary to reply the answer. Your reply must be in json format as {"sql_query": "constructed_sql_query"}. Think slowly and carefully to form a query that is syntactically and semantically correct.`
		},
		{
			"role": "user",
			"content": `query: ${query}`
		}
	]

	var response2 = await sails.helpers.callChatGpt.with({"messages": final_messages, "max_tokens": 4096});
	response2 = JSON.parse(response2[0]['message']['content']);

	if(!state['conversation']){
		state['conversation'] = [];
	}

	state.conversation.push({"role": "user", "content": query});
	state.conversation.push({"role": "assistant", "content": response2['sql_query']});


	console.log(`User Query: ${query}`);
	console.log(`SQL from model: ${response2['sql_query']}`);
	var final_query_result = await execute_query(llm, response2['sql_query']);
	console.log(final_query_result);
	state.conversation.push({"role": "assistant", "content": JSON.stringify(final_query_result)});
	return {
		lastExecutedNode: "sql_query_node",
		finalResult: final_query_result,
		conversation: state['conversation']
	}
}

module.exports = {
	initializeDB,
	execute_query,
	sql_lang_graph_db_query,
	sql_lang_graph_with_human_response,
	execute_db_operation
}