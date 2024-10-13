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

	flowDecisionMaker: async function(state){
		const {paths} = require('./description.js');
		var {user, conversation} = state;

		var userQuery = conversation[conversation.length-1]['content'];

		var messages = [
            {
                "role": "system",
                "content": `Choose one of the paths that is best for solving user query:
                    {paths: ${JSON.stringify(paths)}}
                    Output should be the name of the path only.
                `
            },
            {
            	"role": "user",
            	"content": userQuery
            }
        ];

        var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096, "response_format": "text"});
        console.log(result[0]['message']['content'])
        return {
        	next_node: result[0]['message']['content']
        }
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
		const {llm, query, finalResult, extraData, user} = state;

		/*const prompt = `Please format the following information into a well-structured HTML response for human readability. Ensure that the output is detailed and does not include any JSON objects and is presented in a clear and readable format using HTML tags like paragraphs, lists, and tables.

			User Query: ${query}
			Final Result: ${typeof finalResult === "string" ? finalResult : JSON.stringify(finalResult)}`;*/
		
		const prompt = `Form a well-structured HTML response for human readability strictly based on query and final_result only. Also decide from user query if response needs to be sent in pdf file or not. Html output must be detailed and cover maximum information from Final Result and presented in a clear and readable format using HTML tags like paragraphs, lists, and tables. Always limit width of Images within 251px and height auto. All links must open in new tab.

			query: ${query}
			final_result: ${typeof finalResult === "string" ? finalResult : JSON.stringify(finalResult)}

			Output must be in following json format only:
			{
				html: "formatted_html_string",
				is_pdf: true/false
			}`;

		if(extraData && extraData['template']){
			var mTemplate = await AppData.findOne({cid: user.appId, type: extraData['template']});
			prompt = `Form a well-structured HTML response for human readability strictly based on query and final_result only. Use provided format to generate your response. Also decide from user query if response needs to be sent in pdf file or not. Html output must be detailed and cover maximum information from Final Result and presented in a clear and readable format using HTML tags like paragraphs, lists, and tables. Always limit width of Images within 251px and height auto. All links must open in new tab.

			query: ${query}
			final_result: ${typeof finalResult === "string" ? finalResult : JSON.stringify(finalResult)}

			Output must be in following json format only:
			{
				html: "formatted_html_string",
				is_pdf: true/false,
				format: ${mTemplate['data']['format']}
			}`;
		}			

		var messages = [
			{
				"role": "system",
				"content": prompt
			}
		]
		var response = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
		response = JSON.parse(response[0]['message']['content']);
		if(response['is_pdf']){
			return {
				"finalResult": response['html'],
				"response": response['html'],
				"next_node": "pdfGenerator"
			};
		}else{
			return {
				"finalResult": response['html'],
				"response": response['html']
			};
		}
	},

	addActionButtons: async function(state){
		var { llm, finalResult, conversation} = state;

		var query = conversation[conversation.length-1]['content'];

		var messages = [
			{
				role: "system", 
				content: `Embed action buttons within the finalResult based on the user query. It could be at the end of the final result as html buttons or in different sections as you deemed it to be fit:
					
				  finalResult: ${finalResult},
				  query: ${query},
				  actions: {
				    product: [
				      { name: "add_to_cart", display_name: "Add to cart", data-prod-id: product_id },
				      { name: "add_to_favorite", display_name: "Add to favorite", data-prod-id: product_id }
				    ],
				    refund: [
				    	{name: "raise_dispute", display_name: "Raise Dispute", refund_id: refund_id}
				    ]
				  }
					
					Action button should be as follows:
					<button class="btn-action" data-action-name="{{name}}" data-extra="Stringified object of data">{{display_name}}</button>

				Final output must be similar to finalResult with action buttons if required.
				`
			}
		];

		var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096, "response_format": "text"});

		result = result[0]['message']['content'];

		console.log(result);

		return {
			finalResult: result
		}
	},

	isNextNode: function(state){
		const {next_node} = state;

		if(next_node){
			return next_node;
		}else{
			return "__end__";
		}
	},

	pdfGenerator: async function(state){
		var {llm, finalResult, conversation, user} = state;

		var query = conversation[conversation.length-1]['content'];

		if(!finalResult){
			return {
		    	"finalResult": `
		    		<p>No result obtained for the given details</p>
	    		`,
		    	"lastExecutedNode": "pdfGenerator"
		    }	
		}
		

		if(typeof finalResult === "object"){
			finalResult = JSON.stringify(finalResult);
		}

		var templates = await AppData.find({cid: user.appId.toString(), type: "template"});

		var templateNames = templates.map(ele=>ele.data.name);
		console.log(templateNames);

		console.log(query)
		var messages = [
			{
				"role": "system",
				"content": `You are an expert bot to select best template based on their names for the given user query.
				templates: [${templateNames.join(", ")}]
				Your output must be one of the names from the provided above list of templates and null if no match is found. Return the template only when crystal clear match is found.
				eg: 
				templates: ['abc', 'xyz', 'pqr']
				output: xyz
				`
			},
			{
				"role": "user",
				"content": query
			}
		];

		var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096, "response_format": "text"});

		result = result[0]['message']['content'];

		console.log(`Selected template - ${result}`);

		var htmlContent = templates.find(ele => ele.data.name===result);
		if(htmlContent && htmlContent!==null){
			htmlContent = htmlContent.data.template;	
		}
		

		var mPath = `generatedDocs/${generateObjectId()}.pdf`;
		const outputPath = path.join(sails.config.paths.public, mPath);

		var messages = [
			{
				"role": "system",
				"content": `You are an intelligent html page designer who prepares html based on provided template. If template is null or not provided or doesn't matches the user query consider creating your own template. You will replace the values of the placeholder in template with the provided data. You have should replace values of placeholder with the appropriate values. Your replay should contain plain html and nothing else. This html will be written in pdf document. If you feel provided template doesn't fits for provided data then you decide your own template for giving a good look to the document. Also take users query into consideration to decide title and other formatting for html.
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

		var responseContent = result[0]["message"]['content'];

		// Ensure the directory exists
		const dir = path.dirname(outputPath);
		if (!fs.existsSync(dir)) {
		    fs.mkdirSync(dir, { recursive: true });
		}

		const browser = await puppeteer.launch({
			executablePath: process.env.NODE_ENV==="production" || 
							process.env.NODE_ENV==="staging" ?
							process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath(),
			headless: true,
			args: [
				'--no-sandbox', 
				'--disable-setuid-sandbox',
				'--single-process',
				'--no-zygote'
			]
		});
	    const page = await browser.newPage();
	    await page.setContent(responseContent);
	    var res = await page.pdf({ path: outputPath, format: 'A4' });
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