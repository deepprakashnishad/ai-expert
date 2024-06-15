const fs = require("fs");
const { DataSource } = require("typeorm");
const { SqlDatabase } = require("langchain/sql_db");
const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { TRIMMED_CORPUS_PATH } = require("./constants.js");

const {findMissingParams} = require('./utils');

const axios = require('axios');

module.exports = {
	apiCaller: async function(method, url, queryParams={}, body={}, params=[], options={}){
		if(method==="GET"){
			if(params){
				params.forEach(param => {
					url = `${url}/${param}`;
				});
			}

			if(queryParams && Object.keys(queryParams) > 0){
				if(url.slice(-1)!=="?"){
					url = `${url}?`;
				}
				Object.keys(queryParams).forEach(key=>{
					url = `${url}${key}=${queryParams[key]}`
				});
			}
			var result = await axios.get(url, options);
		}else if(method==="POST"){
			var result = await axios.post(url, body, options);
		}else if(method==="PUT"){
			var result = await axios.put(url, body, options);
		}else if(method==="PATCH"){
			var result = await axios.patch(url, body, options);
		}else if(method==="DELETE"){
			if(params){
				params.forEach(param => {
					url = `${url}/${param}`;
				});
			}

			if(queryParams && Object.keys(queryParams) > 0){
				if(url.slice(-1)!=="?"){
					url = `${url}?`;
				}
				Object.keys(queryParams).forEach(key=>{
					url = `${url}${key}=${queryParams[key]}`
				});
			}
			var result = await axios.delete(url, options);
		}

		return {response: result.data, status: result.status};
	},

	sqlDBCaller: async function(database_name, prompt, question, use_tables=[], llm, finalResponsePrompt){
		const datasource = new DataSource({
		  type: "sqlite",
		  database: database_name,
		});

		let db;

		if(use_tables.length > 0){
			db = await SqlDatabase.fromDataSourceParams({
			  appDataSource: datasource,
			  includesTables: use_tables
			});	
		}else{
			db = await SqlDatabase.fromDataSourceParams({
			  appDataSource: datasource,
			});	
		}
		

		const mPrompt =
		  PromptTemplate.fromTemplate(`Based on the provided SQL table schema below, write a SQL query that would answer the user's question.
		------------
		SCHEMA: {schema}
		------------
		QUESTION: {question}
		------------
		SQL QUERY:`);
		
		// const llmInstance = indexModule.getLangchainLLMInstance();

		const sqlQueryChain = RunnableSequence.from([
		  {
		    schema: async () => db.getTableInfo(),
		    question: (input) => input.question,
		  },
		  mPrompt,
		  llm.bind({ stop: ["\nSQLResult:"] }),
		  new StringOutputParser(),
		]);

		const res = await sqlQueryChain.invoke({
		  "question": question,
		});

		const finalChain = RunnableSequence.from([
		  {
		    question: (input) => input.question,
		    query: sqlQueryChain,
		  },
		  {
		    schema: async () => db.getTableInfo(),
		    question: (input) => input.question,
		    query: (input) => input.query,
		    response: (input) => db.run(input.query),
		  },
		  finalResponsePrompt,
		  llm,
		  new StringOutputParser(),
		]);

		const finalResponse = await finalChain.invoke({
		  "question": question,
		});

		console.log({ finalResponse });

		return finalResponse;
	},

	webSearch: async function(){
		console.log("Web search tool has been invoked");
		return true;
	},

	getApis: async function(state){
		const { categories } = state;
		/*if (!categories || categories.length === 0) {
		    throw new Error("No categories passed to get_apis_node");
		}*/
		/*const allData = JSON.parse(
		    fs.readFileSync(TRIMMED_CORPUS_PATH, "utf8")
		);*/

		const apis = await Tool.find({type: "api"});
		console.log(apis);
		/*const apis = categories
		    .map((c) => allData.filter((d) => d.category_name === c))
		    .flat();*/

		return {
		    apis,
		    "lastExecutedNode": "get_apis_node"
		};
	},

	verifyParams: function(state) {
	  const { bestApi, params } = state;
	  if (!bestApi) {
	    throw new Error("No best API found");
	  }
	  if (!params) {
	    console.log("NO PARAMS");
	    return "human_loop_node";
	  }
	  const requiredParamsKeys = bestApi.required_parameters.map(
	    ({ name }) => name
	  );
	  const extractedParamsKeys = Object.keys(params);
	  const missingKeys = findMissingParams(
	    requiredParamsKeys,
	    extractedParamsKeys
	  );
	  if (missingKeys.length > 0) {
	    return "human_loop_node";
	  }
	  return "execute_request_node";
	}
} 