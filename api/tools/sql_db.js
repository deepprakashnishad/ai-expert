const { SqlDatabase } = require("langchain/sql_db");
const { DataSource } = require("typeorm");

const { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const { ChatOpenAI } = require("@langchain/openai");
const { createOpenAIToolsAgent, AgentExecutor } = require("langchain/agents");
const { SqlToolkit } = require("langchain/agents/toolkits/sql");
const { AIMessage } = require("langchain/schema");

var db = null;
var sqlToolKit = null;

async function initializeDB(llm){
	const datasource = new DataSource({
	  type: "postgres",
	  host: "localhost",
	  port: 5432,
	  username: "demo",
	  password: "demo",
	  database: "ecmps",
	  synchronize: false,
	  logging: false
	});

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

	const res = JSON.parse(await db.run(query))
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

async function sql_lang_graph(state){
	
}

module.exports = {
	initializeDB,
	execute_query,
	execute_db_operation
}