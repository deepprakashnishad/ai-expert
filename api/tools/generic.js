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
const puppeteer = require("puppeteer");
const path = require('path');

function generateObjectId() {
    const timestamp = Math.floor(Date.now() / 1000).toString(16); // 4-byte timestamp
    const machineId = Math.floor(Math.random()*100000); // Placeholder for 5-byte machine identifier
    const pid = Math.floor(Math.random()*1000);; // Placeholder for 3-byte process identifier
    const increment = ('000000' + Math.floor(Math.random() * 0xFFFFFF).toString(16)).slice(-6); // 3-byte counter

    return timestamp + machineId + pid + increment;
}

module.exports = {

	getApiByName: async function(){
		var api = await Tool.findOne({"name": "Odoo Invoice Summary Retriever"});
		// var api2 = await Tool.findOne({"name": "Odoo Invoice Detail Retriever"});
		return {
			bestApi: api
		}
	},

	predefinedWorkFlowExecutor: async function(){
		var graphPlan = {
			
		};


	},

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
	  const { bestApi, params, next_node } = state;
	  if (!bestApi || bestApi.length===0) {
	    throw new Error("No best API found");
	  }
	  if (!params && bestApi.required_parameters.length>0) {
	    console.log("NO PARAMS");
	    return "human_loop_node";
	  }

	  if(bestApi.min_reqd_params && bestApi.min_reqd_params <= Object.keys(params).length){
	  	return next_node? next_node: "execute_request_node";
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
	  return next_node? next_node: "execute_request_node";
	},

	responseFormatter: async function(state){
		const {llm, query, finalResult} = state;

		const prompt = `
			User Query: ${query}

			Final Result: ${typeof finalResult==="string"? finalResult: JSON.stringify(finalResult)}

			Please format this information into a well-structured response for a human to read. You should not add any information from your side. Just based on the user query and provided Final Result only you must produce the response. Make sure that response doesn't contains any type of json object and is in the form of html which can be displayed in best way to user.
			For example any array of json can be displayed in html table, paragraph can be returned in <p> tags, Points can formatted using li tag etc.
			`;

		var messages = [
			{
				"role": "system",
				"content": prompt
			}
		]
		console.log(messages)
		var response = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096, "response_format": "text"});
		response = response[0]['message']['content'];

		// Call the language model
		// const response = await llm.call(prompt);

		return {
			"finalResult": response,
			"response": response
		};
	},

	pdfGenerator: async function(state){
		var {llm, finalResult, query} = state;

		if(typeof finalResult === "object"){
			finalResult = JSON.stringify(finalResult);
		}

		var htmlContent = `<!DOCTYPE html>
			<html lang="en">
			<head>
			    <meta charset="UTF-8">
			    <meta name="viewport" content="width=device-width, initial-scale=1.0">
			    <title>Draft Invoice</title>
			    <style>
			        body {
			            font-family: Arial, sans-serif;
			            margin: 20px;
			        }
			        .invoice-container {
			            border: 1px solid #000;
			            padding: 20px;
			            max-width: 800px;
			            margin: auto;
			        }
			        .invoice-header, .invoice-footer {
			            text-align: center;
			            margin-bottom: 20px;
			        }
			        .invoice-body {
			            margin-bottom: 20px;
			        }
			        .invoice-section {
			            margin-bottom: 10px;
			        }
			        .invoice-table {
			            width: 100%;
			            border-collapse: collapse;
			            margin-bottom: 20px;
			        }
			        .invoice-table th, .invoice-table td {
			            border: 1px solid #000;
			            padding: 8px;
			            text-align: left;
			        }
			        .invoice-footer a {
			            color: #000;
			            text-decoration: none;
			        }
			    </style>
			</head>
			<body>
			    <div class="invoice-container">
			        <div class="invoice-header">
			            <h1>Draft Customer Invoice</h1>
			        </div>
			        <div class="invoice-body">
			            <div class="invoice-section">
			                <p><strong>Untaxed Amount:</strong> {{untaxed_amount}}</p>
			                <p><strong>Tax (18%):</strong> {{tax}}</p>
			                <p><strong>Total:</strong> {{total}}</p>
			            </div>
			            <div class="invoice-section">
			                <p><strong>Shipping Address:</strong></p>
			                <p>{{shipping_address}}</p>
			                <p>{{recipient_name}}</p>
			            </div>
			            <div class="invoice-section">
			                <table class="invoice-table">
			                    <thead>
			                        <tr>
			                            <th>Description</th>
			                            <th>Quantity</th>
			                            <th>Unit Price</th>
			                            <th>Taxes</th>
			                            <th>Amount</th>
			                        </tr>
			                    </thead>
			                    <tbody>
			                    </tbody>
			                </table>
			            </div>
			            <div class="invoice-section">
			                <p>Terms & Conditions: <a href="https://odoo-171419-0.cloudclusters.net/terms">https://odoo-171419-0.cloudclusters.net/terms</a></p>
			            </div>
			        </div>
			        <div class="invoice-footer">
			            <p><strong>Unique Corp</strong></p>
			            <p>Address: 772 Raviwar Peth, Pune, Maharashtra - 411002 India.</p>
			            <p>Phone No: +91-9822431229, +91-7350023007.</p>
			            <p>Email: <a href="mailto:sales@uniqueequips.com">sales@uniqueequips.com</a></p>
			            <p>GSTIN: 27AEEPD4000P1ZP.</p>
			        </div>
			    </div>
			</body>
			</html>`;

		var mPath = `generatedDocs/${generateObjectId()}.pdf`;
		const outputPath = path.join(sails.config.paths.assets, mPath);

		var messages = [
			{
				"role": "system",
				"content": `You are an intelligent html page designer who prepares html based on provided template. You will replace the values of the placeholder in template with the provided data. You have should replace values of placeholder with the appropriate values. Your replay should contain plain html and nothing else. This html will be written in pdf document. If you feel provided template doesn't fits for provided data then you decide your own template for giving a good look to the document. Also take users query into consideration to decide title and other formatting for html.
					Extra information is document is printed in A4 size in portrait mode.
				`
			},
			{
				"role": "user",
				"content": `Following is the html template and data provided in json format
					{
						"template": ${htmlContent},
						"data": ${finalResult},
						"query": ${query}
					}

					Please generate final html for above template and data
				`
			}
		]

		var result = await sails.helpers.callChatGpt.with({
			"messages": messages, 
			"max_tokens": 4096,
			"temperature": 0,
			"response_format": "text"
		});

		console.log(result);

		var responseContent = result[0]["message"]['content'];

		console.log(responseContent);

		const browser = await puppeteer.launch();
	    const page = await browser.newPage();
	    await page.setContent(responseContent);
	    var res = await page.pdf({ path: outputPath, format: 'A4' });
	    console.log("Pdf Result")
	    console.log(res);

	    await browser.close();

	    return {
	    	"finalResult": `
	    		<a href="${sails.config.custom.baseUrl}/${mPath}" target="_blank">
	    			<i class="fa-duotone fa-solid fa-file-pdf fa-beat fa-2xl" style="--fa-primary-color: #ff3300; --fa-secondary-color: #1e00ff;"></i>
	    		</a>
	    		<div style="margin-top:15px">Document Title</div>
		        <div class="doc-actions" style="text-align: right">
		            <a href="${sails.config.custom.baseUrl}/${mPath}" target="_blank"><i class="fas fa-eye"></i></a>
		            <a href="${sails.config.custom.baseUrl}/${mPath}" download target="_blank"><i class="fas fa-download"></i></a>
		        </div>
    		`,
	    	"lastExecutedNode": "pdfGenerator"
	    }
	}

} 