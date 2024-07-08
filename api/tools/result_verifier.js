async function resultVerifier(state){
	const {llm, query, finalResult, apis} = state;

	var messages = [
		{
			"role": "system",
			"content": `You are intelligent supervisor whose task is to verify if the user query has been served or not. To determine this you should analyze finalResults and if that is not sufficient then use resultHistory to form a result. If you think user query cannot be served by both means then you should determine the next tool to use to fulfill the user's request. You may suggest prompt for the next step or parameters that should be used.

				{
					finalResult: ${JSON.stringify(finalResult)},
					resultHistory: [],
					tools: ${JSON.stringify(apis)},
					query: ${query}
				}

				Output must be in json format as follows:
				{
					"is_result_acceptable": "true or false",
					"prompt": "llm_generated_prompt_if_any",
					"tool": {
						"name":"next_tool_name_to_use",
						"parameters": {
							param_1_name: param_1_value,
							param_2_name: param_2_value,
							param_3_name: param_3_value,
							.
							.
							.
							param_n_name: param_n_value,
						}
				}
			`
		}
	]

	var response = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
  	response = JSON.parse(response[0]['message']['content']);

  	console.log(response);

  	return {
		"is_result_acceptable": response['is_result_acceptable'],
		"prompt": response['prompt'],
		"tool": response['tool'],
		"next_node": response['tool']['name']
	}
}

function nextActionDecisionMaker(state){
	const {next_node, is_result_acceptable } = state;
	if(is_result_acceptable){
		return "pdfGenerator";	
	}else{
		return next_node;		
	}
	
}

module.exports = {
	resultVerifier,
	nextActionDecisionMaker
}