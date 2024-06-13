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
		var agent = await Agent.findOne({id: req.params.id});
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

		var tools = [];

		for(var tool of mAgent.tools){
			if(tool.langchainTool){
				tools.push()	
			} else{
				if(tool.functionName==="sqlDBCaller"){
					tool.params.query.description = `
								SQL query extracting info to answer the user's question.
                                SQL should be written using this database schema:
                                ${tool.params.query.description}
                                The query should be returned in plain text, not in JSON.`;
				}	
				tools.push({
					"type": "function",
			        "function": {
			            "name": tool.functionName,
			            "description": tool.description,
			            "parameters": {
			                "type": "object",
			                "properties": tool.params
			            },
			        }
				});
			}	
		}

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
		var inputMessage = `${mAgent.iPrompt}\nOutput must be in JSON format`;

		for (var i = 0; i < mAgent.iPromptKeys.length; i++) {
			var key = mAgent.iPromptKeys[i];
			inputMessage.replace(key, lChatHistory.ei[key]);
		}

		inputMessage = inputMessage.replace("UserInput", req.body.userInput);

		inputMessage = `${inputMessage}`;

		messages.push({role: "user", content: inputMessage});

		console.log(messages);

		var result = await sails.helpers.callChatGpt.with({
			"messages": messages, 
			"max_tokens": req.body.max_tokens?req.body.max_tokens:2500,
			"tools": tools,
			"temperature": 0
		});

		console.log(result);

		var responseContent = result[0]["message"];

		if(result[0]['finish_reason']==="tool_calls"){			
			for(var mTool of responseContent['tool_calls']){
				if(mTool.type === "function"){
					toolLib.toolGeneratorFactory(mTool['function']['name'], JSON.parse(mTool['function']['arguments']))
					var toolCallMsg = `${mTool['function']['name']} called. Your request is in progress.`;
					lChatHistory['ch'].push({"role": "assistant", "content": toolCallMsg});
					responseContent['content'] = toolCallMsg;			
				}
			}
		}else{
			lChatHistory['ch'].push({"role": "assistant", "content": result[0]["message"]['content']});	
		}

		ch = await ChatHistory.update({"id": lChatHistory.id}, {"ch": lChatHistory.ch, "ei": lChatHistory.ei});
		chatHistories[lChatHistory.id] = lChatHistory;

		return res.successResponse({chatId: lChatHistory.id, data: responseContent}, 200, null, true, "Record found");
	},

	langchainAgentChat: async function(req, res){
		const model = new ChatOpenAI({
			modelName: 'gpt-3.5-turbo-1106',
			temperature: 0.7
		});

		await toolLib.execute_db_operation(model, req.body.query)
		return res.ok(200);

		const prompt = ChatPromptTemplate.fromMessages([
			["system", "You are helpful assistant called Govind"],
			["human", "{input}"],
			new MessagesPlaceholder("agent_scratchpad"),
		]);

		const tools = [
		  new DynamicTool({
		    name: "FOO",
		    description:
		      "call this to get the value of foo. input should be an empty string.",
		    func: async () => "baz",
		  }),
		  new DynamicStructuredTool({
		    name: "random-number-generator",
		    description: "generates a random number between two input numbers",
		    schema: z.object({
		      low: z.number().describe("The lower bound of the generated number"),
		      high: z.number().describe("The upper bound of the generated number"),
		    }),
		    func: async ({ low, high }) =>
		      (Math.random() * (high - low) + low).toString(), // Outputs still must be strings
		  }),
		];

		/*const searchTool = new TavilySearchResults();
		const retrieverTool = new createRetrieverTool({
			name: "lcel_search",
			description: "Use this tool when searching for Lang Chain Expression Language(LCEL)"
		});

		const tools = [searchTool, retrieverTool];*/

		const agent = await createOpenAIFunctionsAgent({
			llm: model,
			prompt: prompt,
			tools: tools
		});

		const agentExecutor = new AgentExecutor({
			agent,
			tools,
			chat_history: chatHistory
		})

		const response = await agentExecutor.invoke({
			input: req.body.input
		});

		chatHistory.push(new HumanMessage(req.body.query));
		chatHistory.push(new AIMessage(response.output));

		res.json(response);
	},

	langchainAgentChat1: async function(req, res){
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

		var graphApp = await sails.helpers.graphGenerator.with({state: lChatHistory.graphState});

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
		if (!finalResult) {
		    throw new Error("No final result");
		}
		if (!finalResult.bestApi) {
		    throw new Error("No best API found");
		}

		if(finalResult.question){
			res.successResponse({result: finalResult['question'], chatId: chatId}, 200, null, true, "Information required");	
		}else{
			res.successResponse({result: finalResult['response'], chatId: chatId}, 200, null, true, "Processing completed")
		}
	}

}