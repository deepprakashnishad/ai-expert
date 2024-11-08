const toolsLib = require("./..");
const { z, ZodObject } = require('zod');
const { zodToJsonSchema } = require('zod-to-json-schema');
const {TavilySearchResults} = require("@langchain/community/tools/tavily_search");
const { MyGmailSearch, MyGmailGetThread, MyGmailGetMessage, MyGmailSendMessage, MyGmailCreateDraft} = require("./../gmailApiService.js");
const { initializeAgentExecutorWithOptions } = require("langchain/agents");
const Shopify = require('shopify-api-node');
const path = require("path");
const {findZodMissingKeys, extractMissingParams} = require('./../utils');

const shopifyTools = require('../shopify/index.js');
const {promptLLM} = require('../prompt.config.js');

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


function isZodObject(schema){
	return schema instanceof ZodObject;
}

module.exports = {
	bestToolSelector: async function(state){
		const {conversation, apis, llm, user, chatId} = state;

		var userQuery = conversation[conversation.length-1]['content'];

		var toolDescList = [];

		for(var i=0; i<apis.length; i++){
			toolDescList.push({
				name: apis[i].name,
				description: apis[i].description
			})
		}

		var messages = [
			{
				role: "system",
				content: `Choose a tool from the given list of tools which would be best to use to reply to user's query.
					tools: ${JSON.stringify(toolDescList)}
	
					Output must be in json format as follows:
					{tool_name: 'one_of_the_tool_name_from_list'}
					If no match is found then output:
					{tool_name: null}
				`
			},
			{
				role: "user",
				content: userQuery
			}
		];

		var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
		var response = result[0]['message']['content'];
		var bestApi;
		var next_node = "human_loop_node";
		response = JSON.parse(response);
		if(response && response['tool_name']){
			for(var api of apis){
				if(api['name'] === response['tool_name']){
					bestApi = api;
					break;
				}
			}
			next_node: "extract_params_node";
		}

		if(bestApi){
			console.log(`Best API - ${bestApi.name}`);
			var parameters = bestApi.schema;
			try{
				parameters = zodToJsonSchema(parameters);
			}catch(e){
				console.log(e);
			}
			var messages = [
				{
					role: "system",
					content: `From the given info extract parameters as mentioned in the params list and decide is function can be called or not.
						info: {"user_query":${userQuery}, "customer_id": ${user.id}, "appId": ${user.appId.toString()}, "chatId": ${chatId}},
						params: ${JSON.stringify(parameters)}
		
						Output must be in json format as follows:
						{param_name1: param1_val, param_name2: param2_val}
						If no parameter is required then return empty object:
						{}
						If parameters are not sufficient return null
					`
				}
			];

			var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
			result = await bestApi._call(JSON.parse(result[0]['message']['content']));
			
			messages = [
				{
					role: "system",
					content: `For the given user query form a response from the provided info. Do not add anything from you side.
						info: ${result},
						query: ${userQuery}
						Output must be in json format
					`
				}
			];

			result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
			console.log(result[0]['message']['content']);
			return result[0]['message']['content'];
			
		}else{
			return "--END--"
		}

		return {
			"bestApi": bestApi
		}
	},

	toolInitializer: async function(actionType, actionName, extraData){
		var instance;
		const toolRef = toolMap[actionName];
		const user = extraData['user'];
		if(actionType === "shopify"){
			var shopifyOptions = await AppData.findOne({cid: extraData['user'].appId.toString(), type: "shopify"});
			if(shopifyOptions){
				shopifyOptions = shopifyOptions.data;
				shopifyOptions.current ??= 10;
				shopifyOptions.max ??= 40;
				shopifyOptions.remaining ??= 30;
				shopifyOptions.autoLimit ??= true;
				shopifyOptions.adminAPIVersion ??= '2024-07';
				shopifyOptions.storeAPIVersion ??= '2024-10';
				shopifyOptions.currency = user?.currency ? user?.currency : "INR";

				const shopify = new Shopify({
					shopName: shopifyOptions.shopName,
				    accessToken: shopifyOptions.accessToken,
				    remaining: shopifyOptions.remaining,
				    current: shopifyOptions.current,
				    max: shopifyOptions.max,
				    autoLimit: shopifyOptions.autoLimit,
				    baseUrl: shopifyOptions.baseUrl
				});

				/*try{
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
				}*/
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
		}else if(actionType === "customTool"){
			instance = await Tool.findOne({id: actionName});
		}else{
			instance = new toolRef();
		}

		return instance;
	},

	toolExtractParameters: async function(args){
		var {bestApi, existingParams, conversation, extraData} = args;
		const messages = 
		    [
		      {
		        "role": "system",
		        "content": `Given a conversation, extraInfo and a list of parameters with types, extract and return parameter values as a JSON object. Omit parameters without values or mismatched types.
		          Parameters: [{params}],
		          conversation: {conversation},
		          extraInfo: ${JSON.stringify(extraData)}

		          Your json object as output must only contain keys from parameters. If any parameter have default value and you do not find value for that parameter then you must include it in your response with given default value. Try your best to get the values for params from the provided conversation and extraInfo. Never make any kind of assumptions and insert values on your own.
		          `
		      }
		];
		var userQuery;
		if(conversation.length>0){
			userQuery = conversation[conversation.length-1]['content'];
		}

		  if(!bestApi){
		    return "No tool is selected";
		  }

		  var required_parameters = [];
		  var optional_parameters = [];

		  let requiredParams, optionalParams, filteredParams;

		  if(bestApi.required_parameters || bestApi.optional_parameters){
		    requiredParams = bestApi?.required_parameters
		    .map(
		      (p) => `{Name: ${p.name}, Description: ${p.description}, Type: ${p.type}}`
		    )
		    .join("\n");

		    optionalParams = bestApi?.optional_parameters
		    .map(
		      (p) => `{Name: ${p.name}, Description: ${p.description}, Type: ${p.type}}`
		    )
		    .join("\n");
		    requiredParams = requiredParams.concat(optionalParams);
		    messages[0]['content'] = messages[0]['content'].replace("{params}", requiredParams)
		  }else{
		    requiredParams = zodToJsonSchema(bestApi.schema);  

		    const missingKeys = findZodMissingKeys(bestApi.schema, existingParams);
		  
		    const combinedMissingKeys = [
		      ...(missingKeys.all || []),
		      ...(missingKeys.atleast_2 || []),
		      ...(missingKeys.atleast_1 || []),
		      ...(missingKeys.atleast_3 || [])
		    ];
		    filteredParams = Object.keys(requiredParams.properties)
		    .filter(key => {
		      return !Object.keys(existingParams).includes(key)
		    })
		    .reduce((obj, key) => {
		      obj[key] = requiredParams.properties[key]; // Access the value from `properties`
		      return obj;
		    }, {});
		    messages[0]['content'] = messages[0]['content'].replace("{params}", JSON.stringify(filteredParams)).replace("{conversation}", JSON.stringify(conversation));
		  }
		  
		  var tempMessages = messages;
		  console.log(messages)
		  if(conversation){
		    tempMessages = messages.concat(conversation)
		  }
		  
		  console.log(tempMessages);
		  var response = await sails.helpers.callChatGpt.with({"messages": tempMessages, "max_tokens": 4096});
		  var res_params = JSON.parse(response[0]['message']['content']);
		  /*console.log(filteredParams);
		  var res_params = await promptLLM("toolExtractParams", 
		  	{"params": filteredParams, "conversation": conversation}, 
		  	{"userQuery": userQuery}, 
		  	conversation);*/
		  console.log(res_params);
		  return {
		      ...existingParams,
		      ...res_params
		    } 
	},

	optionPresenter: async function(context){
		var {mainOptions} = require('./../description.js');
		var {user, conversation, agentId, userInput} = context;

		mainOptions = mainOptions[agentId];

		return {
        	msg: "Please make a choice", options: mainOptions
        }

		var userQuery;
		if(conversation && conversation.length>0){
			userQuery = conversation[conversation.length-1]['content'];
		}else if(!userQuery && userInput){
			userQuery = userInput;
		}

		if(userQuery==="all_available_options"){
			return {
	        	msg: "Please make a choice", options: mainOptions
	        }			
		}

		var result = await promptLLM("optionPresenter", {"mainOptions": mainOptions}, {"userQuery": userQuery}, conversation);
		console.log(result);
        selectedOptions = result['options'];
        const filteredOptions = mainOptions.filter(option =>
		    selectedOptions.includes(option.actionName) || selectedOptions.includes(option.displayName)
		);

        return {msg: result['msg'], options: filteredOptions};
	},

	getSubOptions: async function(reqdOptions){
		var {subOptions} = require('./../description.js');

		const filteredOptions = subOptions
							    .filter(subOption => 
							      reqdOptions.some(reqdOption => reqdOption.actionName === subOption.actionName)
							    )
							    .map(subOption => {
							      const matchedReqdOption = reqdOptions.find(reqdOption => reqdOption.actionName === subOption.actionName);
							      
							      // Replace displayName if it exists in reqdOptions
							      if (matchedReqdOption && matchedReqdOption.displayName) {
							        subOption.displayName = matchedReqdOption.displayName;
							      }

							      return subOption;
							    });

		return filteredOptions;		
	}
}