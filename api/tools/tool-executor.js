const toolsLib = require("./../tools");
const { z, ZodObject } = require('zod');
const { zodToJsonSchema } = require('zod-to-json-schema');
const {TavilySearchResults} = require("@langchain/community/tools/tavily_search");
const { MyGmailSearch, MyGmailGetThread, MyGmailGetMessage, MyGmailSendMessage, MyGmailCreateDraft} = require("./gmailApiService.js");
const shopifyTools = require('./shopify/index.js');
const { initializeAgentExecutorWithOptions } = require("langchain/agents");
const Shopify = require('shopify-api-node');
const path = require("path");
const {findZodMissingKeys} = require('./utils');

function isZodObject(schema){
	return schema instanceof ZodObject;
}

const toolMap = {
	TavilySearchResults,
	MyGmailSearch,
	MyGmailSendMessage,
	MyGmailGetMessage,
	MyGmailGetThread,
	MyGmailCreateDraft,

	...shopifyTools
	// ...toolsLib
}

module.exports = {
	toolExecutor: async function(state){
		const {llm, user} = state;

		var {finalResult, conversation, params} = state;

		var userQuery = conversation[conversation.length-1]['content'];

		const {actionName, actionCat, actionType, prompt, type} = state.extraData;

		const ToolRef = toolMap[actionName];
		var instance;
		if(type==="tool"){
			if(actionCat.toLowerCase().includes("google")){
				const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), './auto-gpt-service-account.json');
				const serviceAccount = require(SERVICE_ACCOUNT_PATH);

				// These are the default parameters for the Gmail tools
				const gmailParams = {
				    credentials: {
				      clientEmail: serviceAccount.client_email,
				      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'), // Ensure proper formatting
				    },
				    scopes: ["https://mail.google.com/"],
				};
				instance = new ToolRef(gmailParams);	
			}else{
				instance = new ToolRef();
			}
		}else if(type==="llm"){
			var messages = [
				{
					role: "system",
					content: prompt
				}
			];

			var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096, "response_format": "text"});
			console.log(result);
			try{
				result = JSON.parse(result[0]['message']['content']);	
				if(!params){
					params={}
				}
				Object.assign(params, result);
				finalResult = result;
			}catch(e){
				result = result[0]['message']['content'];
				finalResult = result;
			}
		}

		if(actionType==="react-agent"){
			const agentExecutor = await initializeAgentExecutorWithOptions([instance], llm, {
			    agentType: "structured-chat-zero-shot-react-description",
			    verbose: true,
		  	});

		  	var result = await agentExecutor.invoke({input: prompt});
		  	finalResult = result['output']
		}

		return {
			params: params,
			finalResult: result
		}
	},

	agentSelector: async function(state){
		const {mainOptions} = require('./description.js');
		var {user, conversation} = state;
		var userQuery = conversation[conversation.length-1]['content'];

		var messages = [
            {
                "role": "system",
                "content": `Role: You are an interactive and empathetic proactive support and sales chatbot. Your goal is to engage users, assist customers and provide relevant options based on their statements from following available choices. After all this your main goal is to increase sales.
                	{available_choices: ${JSON.stringify(mainOptions)}}
					Greeting Response:
					When a user sends a greeting, respond warmly.
					Present a selection of relevant options that align with the user's potential interests from the available options. Ensure the options are tailored and remove any that don't fit. Do not filter options if there is any for user to choose.

					Response Structure:
					You response must contain a message for user and list of probable options that you selected from the given available_choices.
					Format your responses in JSON like this:
					{
					  "msg": "html_formatted_response",
					  "options": ["option_object1", "option_object2", "option_object3"]
					}
				`

				/*User Engagement:
					If the user seems bored or disengaged, acknowledge their sentiment and encourage interaction by offering engaging and diverse options.*/
				/*"options": [{"option_name1": "display option 1"}, {"option_name2": "display option 2"}, {"option_name3": "display option 3"}]*/
                /*"content": `You are an interactive, empathetic and proactive chatbot who responds to user query based on his statement.
        			If a greeting is sent you respond with greeeting alongwith options you have.
        			You may filter out some options if you are sure that the option is not at all related to user's requirement.
        			Ensure that user is presented with some and options and he is bored.
                    {options: ${JSON.stringify(mainOptions)}}
                    Output must be in json format.
                    {msg: "html_formatted_response", options: [option_name1, option_name5, option_name10]}
                `*/
            },
            {
            	"role": "user",
            	"content": userQuery
            }
        ];

        var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
        result = JSON.parse(result[0]['message']['content']);
        selectedOptions = result['options'];
        const filteredOptions = mainOptions.filter(option =>
		    selectedOptions.includes(option.name)
		);

        return {
        	finalResult: {msg: result['msg'], options: selectedOptions}
        }
	},

	actionInitializer: async function(state){
		const {llm, user} = state;

		var {finalResult, conversation, params} = state;

		var userQuery = conversation[conversation.length-1]['content'];

		const {actionName, type, actionType} = state.extraData.action;
		const toolRef = toolMap[actionName];

		var instance;
		if(actionType === "shopify"){
			var shopifyOptions = await AppData.findOne({cid: user.appId.toString(), type: "shopify"});
			if(shopifyOptions){
				shopifyOptions = shopifyOptions.data;
				shopifyOptions.current ??= 10;
				shopifyOptions.max ??= 40;
				shopifyOptions.remaining ??= 30;
				shopifyOptions.autoLimit ??= true;
				shopifyOptions.adminAPIVersion ??= '2024-07';
				shopifyOptions.storeAPIVersion ??= '2024-10';
				shopifyOptions.currency = user.currency?user.currency:"INR";

				const shopify = new Shopify({
					shopName: shopifyOptions.shopName,
				    accessToken: shopifyOptions.accessToken,
				    remaining: shopifyOptions.remaining,
				    current: shopifyOptions.current,
				    max: shopifyOptions.max,
				    autoLimit: shopifyOptions.autoLimit,
				    baseUrl: shopifyOptions.baseUrl
				});

				try{
					if(user.email){
						response = await shopify.customer.search({email: user.email});	
					}else if(user.phone){
						response = await shopify.customer.search({phone: user.phone});	
					}

					if(response && response.length > 0){
						params['customer_id'] = response[0]['id'];
						params['customer_phone'] = response[0]['email'];
						params['customer_email'] = response[0]['phone'];
						// state['user']['name'] = response[0]['name'];
					}
				}catch(e){
					console.log(e);
				}
			}
			instance = new toolRef(shopifyOptions);

		} else if(actionType === "gmail"){
			const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), './auto-gpt-service-account.json');
			const serviceAccount = require(SERVICE_ACCOUNT_PATH);

			// These are the default parameters for the Gmail tools
			const gmailParams = {
			    credentials: {
			      clientEmail: serviceAccount.client_email,
			      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'), // Ensure proper formatting
			    },
			    scopes: ["https://mail.google.com/"],
			};
			instance = new toolRef(gmailParams);
		}else{
			instance = new toolRef();
		}
		if(!params){
			params = {}
		}
		return {
			bestApi: instance,
			params: params
		}
	},

	actionParamsVerifier: function(state){
		const {llm, user, bestApi, params, next_node} = state;

		const missingKeys = findZodMissingKeys(bestApi.schema, params);
		if (Object.keys(missingKeys).length > 0) {
			for(var key of Object.keys(missingKeys)){
				if(missingKeys[key].length>0){
					return "requestParams";
				}
			}
	  	}
		return next_node? next_node: "actionExecutor";
	},

	requestParams: async function(state){
		const {llm, user, bestApi, params, next_node} = state;

		const missingKeys = findZodMissingKeys(bestApi.schema, params);

		var messages = 
		    [
		      {
		        "role": "system",
		        "content": `You are an expert customer representative who rephrases provided list of missing information into user-friendly questions for users to reply. You may collect less information so that user is not stressed by seeing many questions at a time. Your reply must be in form of json format with serial number as keys. You should STRICTLY limit your questions to collect missing_info provided by the user and DO NOT add questions on your own. Do not repeat question if parameters are repeated. 
		          `
		      },{
		        "role": "user",
		        "content": `missing_info: ${JSON.stringify(missingKeys)}`
		      }
		];

		var response = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
		var res_params = JSON.parse(response[0]['message']['content']);

		var question = "";
		Object.keys(res_params).forEach(key => {
			question = `${question}${res_params[key]}\n`;
		})
		  // const question = `LangTool couldn't find all the required params for the API.\nMissing params:\n${missingParamsString}\nPlease provide the missing params in the following format:\n${paramsFormat}\n`;  


		state['question'] = question;

		if(state['conversation']){
		    state['conversation'].push({"role":"assistant", "content": question});
		}else{
		    state['conversation'] = [{"role":"assistant", "content": question}];
		}
		
		return {"question": question}
	},

	actionExecutor: async function(state){
		const {llm, user, bestApi, prompt} = state;

		var {finalResult, conversation, params} = state;

		var userQuery = conversation[conversation.length-1]['content'];

		const {action} = state.extraData;

		if(action.type==="react-agent"){
			const agentExecutor = await initializeAgentExecutorWithOptions([bestApi], llm, {
			    agentType: "structured-chat-zero-shot-react-description",
			    verbose: true,
		  	});
			finalResult = await agentExecutor.invoke({input: prompt});	

		}
		else if(action.type==="tool"){
			finalResult = bestApi._call(params)
		}
		else {
			const agentExecutor = await initializeAgentExecutorWithOptions([bestApi], llm, {
			    agentType: "structured-chat-zero-shot-react-description",
			    verbose: true,
		  	});
			var result = await agentExecutor.invoke({input: prompt});	
		}

		return {
			finalResult: finalResult
		}
	},
}