const { z, ZodObject } = require('zod');
const { zodToJsonSchema } = require('zod-to-json-schema');

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
}