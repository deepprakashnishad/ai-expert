const {ChatOpenAI} = require("@langchain/openai");
const {ChatPromptTemplate, MessagesPlaceholder} = require("@langchain/core/prompts");
const {createOpenAIFunctionsAgent, AgentExecutor} = require("langchain/agents");
const {TavilySearchResults} = require("@langchain/community/tools/tavily_search");
const {HumanMessage, AIMessage} = require("@langchain/core/messages");

const {createRetrieverTool} = require("langchain/tools/retriever");

const { END, StateGraph }  = require("@langchain/langgraph");

// const { z } = require("zod");
const { DynamicTool, DynamicStructuredTool } = require("@langchain/core/tools");

const toolLib = require('./../tools');

var chatHistories = {};
var chatHistory = [];
var agents = {};

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

		console.log(messages);

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

		var chatId = lChatHistory.id;

		var graphApp = await sails.helpers.graphGenerator.with({state: lChatHistory.graphState, id: req.body.agentId});

		const llm = new ChatOpenAI({
		    modelName: "gpt-4-turbo-preview",
		    temperature: 0,
		});

		var query = req.body.userInput;

		var stream;

		if(lChatHistory.graphState){
			/*const splitParams = query.split(":::");
			splitParams.forEach((param) => {
			    const [key, value] = param.split(",");
			    lChatHistory.graphState.params[key] = value.trim();
			});*/

			lChatHistory.graphState.question = null;

			lChatHistory.graphState.conversation.push({"role": "user", "content": query})
		
			stream = await graphApp.stream({
							"llm": llm,
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
						});
		}else{
			stream = await graphApp.stream({
			    llm,
			    query,
			    chatId
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
		      // console.log("Value(s): ", Object.values(event)[0]);
		    }
		}

		if(finalResult.question){
			res.successResponse({result: finalResult['question'], chatId: chatId}, 200, null, true, "Information required");	
		}else if(finalResult.finalResult){
			res.successResponse({result: finalResult['finalResult'], chatId: chatId}, 200, null, true, "Processing completed")
		}else if(finalResult.response){
			res.successResponse({result: finalResult['response'], chatId: chatId}, 200, null, true, "Processing completed")
		}else if(finalResult && typeof finalResult === "string"){
			res.successResponse({result: finalResult, chatId: chatId}, 200, null, true, "Processing completed")
		}else if(finalResult && typeof finalResult==="object"){
			return res.successResponse({result: finalResult, chatId: chatId}, 200, null, true, "Processing Completed");	
		}else{
			return res.successResponse({result: "I am not sure how to solve your query. I can create a ticket for your issue though.", chatId: chatId}, 200, null, true, "Processing Completed");	
		}
	},

	test: async function(req, res){
		var userInput = req.body.userInput;

		/*{
								"name": "get_apis_node",
								"description": "This tool can fetch list of api's available from database"
							},
							{
								"name": "select_api_node",
								"description": "Makes a call to llm to determine best api  from list of the available apis"
							},*/

		var messages = [
			{
				"role": "system",
				"content": `You are a workflow designer who prepares workflow containing nodes(tools, agents, function names), edges, conditional edges, start node and end node to find solution to user query. You are free to chose which nodes can be used and which can be dropped. You must make includes nodes from the list of nodes provided to you only. You will be provided with the list of nodes alongwith their description. You must not add nodes own your own. If you feel nodes provided are insufficient to solve the user query the provide in suggestion tools that should be added to resolve the query.
					While designing the workflow keep in mind that user must get a well formatted result at the end.
					You reply must be in json format as follows:

					{
						"nodes": [Array of nodes],
						"edges": [
							{start_node: 'node_name', end_node: 'node_name'}
						],
						"conditional_edges":[
							{start_node: 'node_name', conditional_test: 'node_name'},
						],
						"entry_node": "node_name",
						"finish_node": "node_name"
					}
				`
			},
			{
				"role": "user",
				"content": `Following is the user query and details of available node. Please design a workflow so that user query can be solved.
					{
						"query": ${userInput},
						"nodes": [
							{
								"name": "get_apis_node",
								"description": "This tool can fetch list of api's available from database"
							},
							{
								"name": "select_api_node",
								"description": "Makes a call to llm to determine best api  from list of the available apis"
							},
							{
								"name": "extract_params_node",
								"description": "Makes call to llm to extract parameters from user's statement"
							},
							{
								"name": "human_loop_node",
								"description": "This is used to interrupt execution and ask user for input. Question to be asked is designed by the llm"
							},
							{
								"name": "execute_request_node",
								"description": "Use this tool to make any kind of rest calls."
							},
							{
								"name": "response_formatter_node",
								"description": "Use this node to format any result in human readable format"
							},
							{
								"name": "verifyParams",
								"description": "Use this tool to ensure if all values are present of not execute a given tool"
							},
							{
								"name": "extractCategory",
								"description": "Use this node to categorize the problem from the available list of categories"
							},
							{
								"name": "gmail_agent",
								"description": "Use this tool to perform any activity related to Gmail. It is a complete agent with multiple Gmail related tools alongwith ability to search over internet."
							},
							{
								"name": "sql_query_node",
								"description": "Use this agent to construct an sql query using llm and execute it on database to get final result"
							},
							{
								"name": "document_retriever",
								"description": "This can extract information available from custom knowledge base. Whenever query specific to business this tool can be used so that user is not served with irrelevant information"
							},
							{
								"name": "pdfGenerator",
								"description": "This tool should be used when final result needs to be written to pdf document."
							}
						]						
					}

					Please generate workflow based on provided user query and node list.
				`
			}
		]

		var result = await sails.helpers.callChatGpt.with({
			"messages": messages, 
			"max_tokens": 4096,
			"temperature": 0,
			"response_format": "json_object"
		});

		var responseContent = result[0]["message"]['content'];

		console.log(responseContent);

		return res.json(result);
	},
}