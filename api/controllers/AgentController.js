const {ChatOpenAI} = require("@langchain/openai");
const {ChatPromptTemplate, MessagesPlaceholder} = require("@langchain/core/prompts");
const {createOpenAIFunctionsAgent, AgentExecutor} = require("langchain/agents");
const {TavilySearchResults} = require("@langchain/community/tools/tavily_search");
const {HumanMessage, AIMessage} = require("@langchain/core/messages");
const {toolExecutor, actionExecutor, agentSelector, actionParamsVerifier, actionInitializer, requestParams} = require("./../tools/tool-executor.js");
const coreTool = require("./../tools/core/tool.js");
const {createRetrieverTool} = require("langchain/tools/retriever");

const { END, StateGraph }  = require("@langchain/langgraph");

// const { z } = require("zod");
const { DynamicTool, DynamicStructuredTool } = require("@langchain/core/tools");
const utils = require('./../tools/utils.js');
const toolLib = require('./../tools');
const { ObjectId } = require('mongodb');


var chatHistories = {};
var chatHistory = [];
var agents = {};

function generateObjectId() {
    const timestamp = Math.floor(Date.now() / 1000).toString(16); // 4-byte timestamp
    const machineId = Math.floor(Math.random()*100000); // Placeholder for 5-byte machine identifier
    const pid = Math.floor(Math.random()*1000);; // Placeholder for 3-byte process identifier
    const increment = ('000000' + Math.floor(Math.random() * 0xFFFFFF).toString(16)).slice(-6); // 3-byte counter

    return timestamp + machineId + pid + increment;
}

module.exports = {

	create: async function(req, res){
		var agent = await Agent.create({
			"name": req.body.name,
			"title": req.body.title,
			"role": req.body.role,
			"avatar": req.body.avatar,
			"sPrompt": req.body.sPrompt,
			"iPrompt": req.body.iPrompt,
			"iPromptKeys": req.body.iPromptKeys,
			"oPromptKeys": req.body.oPromptKeys,
			"chatKey": req.body.chatKey
		}).fetch();

		res.successResponse({agent: agent}, 201, null, true, "Agent created successfully");
	},

	update: async function(req, res){
		data = {};

		if(req.body.name){
			data['name'] = req.body.name;
		}

		if(req.body.title){
			data['title'] = req.body.title;
		}

		if(req.body.role){
			data['role'] = req.body.role;
		}

		if(req.body.sPrompt){
			data['sPrompt'] = req.body.sPrompt;
		}

		if(req.body.iPrompt){
			data['iPrompt'] = req.body.iPrompt;
		}

		if(req.body.iPromptKeys){
			data['iPromptKeys'] = req.body.iPromptKeys;
		}

		if(req.body.oPromptKeys){
			data['oPromptKeys'] = req.body.oPromptKeys;
		}

		if(req.body.avatar){
			data['avatar'] = req.body.avatar;
		}

		if(req.body.chatKey){
			data['chatKey'] = req.body.chatKey;
		}
		
		var agent = await Agent.update({id: req.body.id}, data);

		res.successResponse({data:agent}, 200, null, true, "Agent updated successfully");
	},

	get: async function(req, res){
		var agent = await Agent.findOne({id: req.params.id}).populate("tools");
		if(agent){
			res.successResponse({"agent" :agent}, 200, null, true, "Agent retrieved successfully");
		}else{
			res.successResponse({}, 200, null, false, "Agent not found");
		}
		
	},

	list: async function(req, res){
		var agents = await Agent.find();

		res.successResponse({"agents": agents}, 200, null, true, "Agent retrieved successfully");
	},

	delete: async function(req, res){
		var result = await Agent.destroyOne({id: req.params.id});

		res.successResponse({result: result}, 200, null, true, "Agent deleted successfully");
	},

	assignTools: async function(req, res){
		var response = await Agent.addToCollection(req.body.agentId, 'tools').members(req.body.toolIds);
		res.successResponse({result: response}, 200, null, true, "Tools assigned successfully");
	},

	unassignTools: async function(req, res){
		var response = await Agent.removeFromCollection(req.body.agentId, 'tools').members(req.body.toolIds);
		res.successResponse({result: response}, 200, null, true, "Tools assigned successfully");
	},

	execute: async function(req, res){
		const model = new ChatOpenAI({
			modelName: 'gpt-3.5-turbo-1106',
			temperature: 0.7
		});
		
		if(!req.body.agentId){
			return res.successResponse({}, 200, null, false, "Agent not found");
		}

		var mAgent;

		if(!agents[req.body.agentId]){
			mAgent = await Agent.findOne({"id": req.body.agentId}).populate("tools");
			if(!mAgent){
				return res.successResponse({}, 200, null, false, "Agent not found");
			}
			agents[req.body.agentId] = mAgent;
		}else {
			mAgent = agents[req.body.agentId];
		}

		var tools = [];

		for(var tool of mAgent.tools){
			if(tool.langchainTool){
				tools.push()	
			}else{
				tools.push(new DynamicTool({
					name: tool.functionName,
					description: tool.description,
					func: async (tool)=>{
						toolGeneratorFactory(tool.name, tool.params)
					}
				}));
			}	
		}

		const prompt = ChatPromptTemplate.fromMessages([
			["system", mAgent.sPrompt],
			["human", req.body.input],
			new MessagesPlaceholder("agent_scratchpad"),
		]);

		const agent = await createOpenAIFunctionsAgent({
			llm: model,
			prompt: prompt,
			tools: tools
		});

		var lChatHistory = {ch: [], a: req.body.agentId, "p": req.body.userId, ei: {}};

		if(!req.body.chatId){
			var ch = await ChatHistory.create({"a": req.body.agentId, "p": req.body.userId, "ch": []}).fetch();
			if(ch){
				lChatHistory = ch;
			}
		}else if(chatHistory[req.body.chatId]){
			lChatHistory = chatHistory[req.body.chatId]
		}else{
			lChatHistory = await ChatHistory.findOne({id: req.body.chatId});
		}

		const agentExecutor = new AgentExecutor({
			agent,
			tools,
			chat_history: lChatHistory.ch
		})

		const response = await agentExecutor.invoke({
			input: req.body.input
		});

		chatHistory.push(new HumanMessage(req.body.query));
		chatHistory.push(new AIMessage(response.output));

		return res.successResponse({chatId: lChatHistory.id, data: responseContent}, 200, null, true, "Record found");
	},

	chat: async function(req, res){
		var userInput = req.body.userInput;
		
		if(!req.body.agentId){
			return res.successResponse({}, 200, null, false, "Agent not found");
		}

		var mAgent;

		if(!agents[req.body.agentId]){
			mAgent = await Agent.findOne({"id": req.body.agentId}).populate("tools");
			if(!mAgent){
				return res.successResponse({}, 200, null, false, "Agent not found");
			}
			agents[req.body.agentId] = mAgent;
		}else {
			mAgent = agents[req.body.agentId];
		}

		console.log(mAgent)

		var lChatHistory = {ch: [{"role":"system", "content": mAgent.sPrompt}], a: req.body.agentId, "p": req.body.userId, ei: {}};

		if(!req.body.chatId){
			var ch = await ChatHistory.create({"a": req.body.agentId, "p": req.body.userId, "ch": [{"role":"system", "content": mAgent.sPrompt}]}).fetch();
			if(ch){
				lChatHistory = ch;
			}
		}else if(chatHistories[req.body.chatId]){
			lChatHistory = chatHistories[req.body.chatId]
		}else{
			lChatHistory = await ChatHistory.findOne({id: req.body.chatId});
		}

		var messages = lChatHistory['ch'];
		var inputMessage = `${mAgent.iPrompt}`;

		inputMessage = inputMessage.replace("UserInput", req.body.userInput);

		inputMessage = `${inputMessage}`;

		messages.push({role: "user", content: inputMessage});

		var result = await sails.helpers.callChatGpt.with({
			"messages": messages, 
			"max_tokens": req.body.max_tokens?req.body.max_tokens:4096,
			"temperature": 0,
			"response_format": "text"
		});

		console.log(result);

		var responseContent = result[0]["message"];

		
		lChatHistory['ch'].push({"role": "assistant", "content": result[0]["message"]['content']});	
		
		ch = await ChatHistory.update({"id": lChatHistory.id}, {"ch": lChatHistory.ch, "ei": lChatHistory.ei});
		chatHistories[lChatHistory.id] = lChatHistory;

		return res.successResponse({chatId: lChatHistory.id, result: responseContent['content']}, 200, null, true, "Record found");
	},

	langGraphChat: async function(req, res){
		var lChatHistory = {ch: []};

		if(!req.body.chatId){
			var ch = await ChatHistory.create({"ch": []}).fetch();
			if(ch){
				lChatHistory = ch;
			}
		}else if(chatHistories[req.body.chatId]){
			lChatHistory = chatHistories[req.body.chatId]
		}else{
			lChatHistory = await ChatHistory.findOne({id: req.body.chatId});
		}

		if(req.body.appId && typeof req.body.appId==="number"){
			req.body.appId = req.body.appId.toString();
		}

		var chatId = lChatHistory.id;

		var conversation;

		var graphApp = await sails.helpers.graphGenerator.with({state: lChatHistory.graphState, id: req.body.agentId, action: req.body.action});

		const llm = new ChatOpenAI({
		    modelName: "gpt-3.5-turbo-0125", //"gpt-4-turbo-preview",
		    temperature: 0,
		});

		var query = req.body.userInput;

		var stream;

		if(lChatHistory.graphState){

			lChatHistory.graphState.question = null;

			lChatHistory.graphState.conversation.push({"role": "user", "content": query});
			conversation = lChatHistory.graphState.conversation;
			stream = await graphApp.stream({
							"llm": llm,
							"next_node": lChatHistory.graphState.next_node,
							"selected_apis": lChatHistory.graphState.selected_apis,
							"query": lChatHistory.graphState.query,
							"chatId": lChatHistory.graphState.chatId,
							"categories": lChatHistory.graphState.categories,
							"apis": lChatHistory.graphState.apis,
							"bestApi": lChatHistory.graphState.bestApi,
							"params": lChatHistory.graphState.params,
							"response": lChatHistory.graphState.response,
							"question": lChatHistory.graphState.question,
							"finalResult": lChatHistory.graphState.finalResult,
							"conversation": lChatHistory.graphState.conversation,
							"lastExecutedNode": lChatHistory.graphState.lastExecutedNode,
							"user": lChatHistory.graphState.user,
							"toolUsed": lChatHistory.graphState.toolUsed
						});
		}else{
			conversation = [{"role": "user", "content": query}];
			stream = await graphApp.stream({
			    "llm": llm,
			    "query": query,
			    "chatId": chatId,
			    "conversation": conversation,
			    "user": req.body.user
			});	
		}

		let finalResult = null;
		for await (const event of stream) {
		    console.log("\n------\n");
		    if (Object.keys(event)[0] === END) {
		      console.log("---FINISHED---");
		      finalResult = event[END];
		      break;
		    } else {
		      console.log("Stream event: ", Object.keys(event)[0]);
		      // Uncomment the line below to see the values of the event.
		      console.log("Value(s): ", Object.values(event)[0]);
		    }
		}
		/*console.log(chatId);
		var state = await ChatHistory.findOne({id: chatId});
		console.log(state);
		state = state['graphState'];
		console.log(state);*/
		// const chatHistoryColl = ChatHistory.getDatastore().manager.collection(ChatHistory.tableName);
		if(finalResult.question){
			conversation.push({"role":"assistant", "content": finalResult.question});
			res.successResponse({result: finalResult['question'], chatId: chatId}, 200, null, true, "Information required");	
		}else if(finalResult.finalResult){
			conversation.push({"role":"assistant", "content": finalResult.finalResult});
			res.successResponse({result: finalResult['finalResult'], chatId: chatId}, 200, null, true, "Processing completed")
		}else if(finalResult.response){
			conversation.push({"role":"assistant", "content": finalResult.response});
			res.successResponse({result: finalResult['response'], chatId: chatId}, 200, null, true, "Processing completed")
		}else if(finalResult && typeof finalResult === "string"){
			conversation.push({"role":"assistant", "content": finalResult});
			res.successResponse({result: finalResult, chatId: chatId}, 200, null, true, "Processing completed")
		}else if(finalResult && typeof finalResult==="object"){
			conversation.push({"role":"assistant", "content": finalResult});
			res.successResponse({result: finalResult, chatId: chatId}, 200, null, true, "Processing Completed");	
		}else{
			var msg = "I am not sure how to solve your query. I can create a ticket for your issue though."
			conversation.push({"role":"assistant", "content": msg});
			res.successResponse({result: msg, chatId: chatId}, 200, null, true, "Processing Completed");	
		}
		if(!req.body.isHidden){
			finalResult.conversation = conversation;
			await ChatHistory.update({"id": chatId}, {"ch": conversation, "graphState": finalResult});	
		}
		
	},

	executeTool: async function(req, res){
		var instance = await coreTool.toolInitializer(req.body.tool.actionType, req.body.tool.actionName, req.body.extraInfo);
		try{
			var toolInput = await coreTool.toolExtractParameters({
				bestApi: instance, 
				existingParams: req.body.tool.toolInput,
				conversation: req.body.conversation
			});
			var toolOutput = await instance._call(toolInput);
			var finalResponse = await utils.dynamicResponseFormatter({
				finalResult: toolOutput,
				extraData: req.body.extraInfo,
				query: req.body.userInput
			})
			return res.successResponse({result: finalResponse, chatId: req.body.chatId}, 200, null, true, "Processing completed")
		}catch(e){
			console.log(e);
			return res.successResponse({result: "Some technical error occurred", chatId: req.body.chatId}, 200, null, true, "Processing completed")
		}
	},

	test: async function(req, res){
		const llm = new ChatOpenAI({
		    modelName: "gpt-4-turbo-preview",
		    temperature: 0,
		});
		let conversation = [{content: "Get me my last order details"}];
		response = await toolLib.customShopifyAgent({
			llm: llm,
			conversation: conversation,
			finalResult: true,
			user: {"name": "deep", "email": "rakhiparkale1999@gmail.com", "appId": "6"}
		});
		
	    return res.json(response);	
	},

	pdfTester: async function(req, res){
		const puppeteer = require("puppeteer");
		const path = require('path');
		const fs = require("fs");

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
		const outputPath = path.join(sails.config.paths.public, mPath);

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
	    await page.setContent(htmlContent);
	    await page.pdf({ path: outputPath, format: 'A4' });
	    await browser.close();

		res.json({path: `${sails.config.custom.baseUrl}/${mPath}`})
	}
}