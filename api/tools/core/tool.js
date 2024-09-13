const { z, ZodObject } = require('zod');
const { zodToJsonSchema } = require('zod-to-json-schema');

function isZodObject(schema){
	return schema instanceof ZodObject;
}

module.exports = {
	bestToolSelector: async function(state){
		const {conversation, apis, llm} = state;

		var userQuery = conversation[conversation.length-1]['content'];

		var toolDescList = [];

		for(var i=0; i<apis.length-1; i++){
			toolDescList.push({
				name: apis[i].name,
				description: apis[i].description
			})
		}

		var messages = [
			{role: "system",
						content: `Choose a tool from the given list of tools which could possibly resolve the given user query
							query: ${userQuery},
							tools: ${JSON.stringify(toolDescList)}
			
							Output must be in json format as follows:
							{tool_name: 'one_of_the_tool_name_from_list'}
							If no match is found then output:
							{tool_name: null}
						`}
		];

		var result = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
		var response = result['messages'][0]['content'];
		var bestApi;
		var next_node = "human_loop_node";
		if(response && response['tool_name']){
			for(var api of apis){
				if(api['name'] === response['tool_name']){
					bestApi = api;
					break;
				}
			}
			next_node: "extract_params_node";
		}

		return {
			"bestApi": bestApi,
			"next_node": next_node
		}
	}


}