var Odoo = require('./odoo/index.js');
const axios = require('axios');
const {getCorrectedDataFromLLM} = require("./utils.js");

var odooProtocol = sails.config.custom.ODOO.https? "https": "http";

var odooConfig = {
	https: sails.config.custom.ODOO.https,
  	host: sails.config.custom.ODOO.host,
	port: sails.config.custom.ODOO.port,
	database: sails.config.custom.ODOO.db,
	username: sails.config.custom.ODOO.username,
	password: sails.config.custom.ODOO.password,
	url: sails.config.custom.ODOO.url
};

var odoo = new Odoo(odooConfig);

async function connectToOdoo(){
	try{
		await new Promise((resolve, reject) => {
	      	odoo.connect(function (err) {
		        if (err) {
		          reject(err);
		        } else {
		          resolve();
		        }
		    });
	    });
	}catch(e){
		console.log(e);
	}
}

async function getFromOdoo(model, id){
	try{
		if(!odoo.sid){
			await connectToOdoo();	
		}		
		const result = await new Promise((resolve, reject) => {
      		odoo.get(model, id, function (err, result) {
		        if (err) {
		          reject(err);
		        } else {
		          resolve(result);
		        }
		    });
	    });

		// console.log('Result', result);	
		return result;
	}catch(e){
		console.log(e);
	}
}

async function searchOdoo(model, params){
	try{
		if(!odoo.sid){
			await connectToOdoo();	
		}
		const result = await new Promise((resolve, reject)=>{
			odoo.search(model, params, function(err, result){
				if (err) {
		          reject(err);
		        } else {
		          resolve(result);
		        }
			})
		});

		return result;
	}catch(e){
		console.log(e);
	}
}

async function getModelDetailsByName(partialModelName){
	var modelSearchParams = {
        model: 'ir.model',
        method: "search_read",
        args: [
          [['model', 'ilike', partialModelName]]
        ],
        kwargs: {
          fields: ['model', 'name'],
          limit: 10
        }
    };

    var models = await searchReadOdoo('ir.model', modelSearchParams);
    const modelNames = models.map(m => m.model);

    var fieldSearchParams = {
        model: 'ir.model.fields',
        method: "search_read",
        args: [
            [['model', 'in', modelNames]]
        ],
        kwargs: {
            fields: ['model', 'name', 'field_description', 'ttype', 'relation', 'required'],
            limit: 200
        }
    }

    var fields = await searchReadOdoo('ir.model.fields', fieldSearchParams);
    console.log(fields);
    return fields;
}

async function searchReadOdoo(model, params, iteration=0){
	try{
		if(!odoo.sid){
			await connectToOdoo();	
		}
		const result = await new Promise((resolve, reject)=>{
			odoo.search_read(model, params, function(err, result){
				if (err) {
		          reject(err);
		        } else {
		          resolve(result);
		        }
			})
		});
		return result;
	}catch(e){
		console.log(e)
		if(iteration < 5){
			iteration++;
			console.log(`Attempt ${iteration}`);
			var response = await getCorrectedDataFromLLM({
				context: "odoo search_read", 
				instruction: `Please provide a valid JSON object with the following structure: {model: string, domain: array, fields: array, order: string, limit: number}. Ensure that each field is appropriately filled with standard values with respect to odoo standard model. Include only fields that are relavant to user query only. Do not include any additional text, just return the JSON`,
				data_used: params,
				error: e.data.message
			});

			var params = JSON.parse(response);
			
			return await searchReadOdoo(params['model'], params, iteration);
		}
		return e.data.message;
	}
}

async function browseByIdOdoo(model, params){
	try{
		if(!odoo.sid){
			await connectToOdoo();	
		}
		const result = await new Promise((resolve, reject)=>{
			odoo.browse_by_id(model, params, function(err, result){
				if (err) {
		          reject(err);
		        } else {
		          resolve(result);
		        }
			})
		});

		return result;
	}catch(e){
		console.log(e);
	}
}

async function createRecordOdoo(model, params){
	try{
		if(!odoo.sid){
			await connectToOdoo();	
		}
		const result = await new Promise((resolve, reject)=>{
			odoo.create(model, params, function(err, result){
				if (err) {
		          reject(err);
		        } else {
		          resolve(result);
		        }
			})
		});

		return result;
	}catch(e){
		console.log(e);
	}
}

async function updateRecordOdoo(model, id, params){
	try{
		if(!odoo.sid){
			await connectToOdoo();	
		}
		const result = await new Promise((resolve, reject)=>{
			odoo.update(model, id, params, function(err, result){
				if (err) {
		          reject(err);
		        } else {
		          resolve(result);
		        }
			})
		});

		return result;
	}catch(e){
		console.log(e);
	}
}

async function deleteRecordOdoo(model, id){
	try{
		if(!odoo.sid){
			await connectToOdoo();	
		}
		const result = await new Promise((resolve, reject)=>{
			odoo.delete(model, id, function(err, result){
				if (err) {
		          reject(err);
		        } else {
		          resolve(result);
		        }
			})
		});

		return result;
	}catch(e){
		console.log(e);
	}
}

async function rpc_call(params){
	try{
		if(!odoo.sid){
			await connectToOdoo();	
		}

		var url = `${odooProtocol}://${odoo.host}:${odoo.port}/jsonrpc`;
		var headers = {
			cookie: odoo.sid,
			content: "application/json"
		}

		console.log(params);

		const result = await axios.post(url, {
			"jsonrpc": "2.0",
			"method":"call",
			"params": params
		}, {
			"headers": headers
		});

		return result.data;
	}catch(e){
		console.log(e);
		return JSON.stringify(e);
	}
}

async function odooAgent(state){
	const {llm, conversation} = state;
	let query = conversation[conversation.length-1]['content'];
	var messages = [
		{
			"role": "system",
			"content": `You are an empathic assistant that helps users formulate queries for an Odoo ERP database for making the rpc call.

				Greetings: 
				Please repond with greeting message as follows:
				{type: "greeting", msg: "reponse_to_user_message"}

				Odoo related query:
				Please provide a valid JSON object with the following structure: {type: "odoo", params: {model: string, domain: array, fields: array, order: string, limit: number}}. Ensure that each field is appropriately filled with standard values with respect to odoo standard model. Include only fields that are relavant to user query only. Do not include any additional text, just return the JSON.
			`
		},
		{
			"role": "user",
			"content": `User query: "${query}".`
		}
	];

	var response = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
  	response = JSON.parse(response[0]['message']['content']);	
  	console.log(response);
  	if(response['type']==="odoo"){
  		return {
	  		next_node: "odooExecutor",
	  		finalResult: response['params'],
	  		params: response['params']
	  	}
  	}else{
  		return {
	  		next_node: "response_formatter_node",
	  		finalResult: response['msg'],
	  	}
  	}
}

async function odooExecutor(state){
	var {query, llm, bestApi, params, toolUsed, finalResult} = state;
	const { model, domain = [], fields = [], order = '' } = params;
	var data = [];
	try{
		finalResult = await searchReadOdoo(model, params);
		console.log(finalResult);	
	}catch(e){
		console.log(e);
		return {
			finalResult: "Due to a technical error, I was unable to retrieve the result"
		}
	}
	
	/*if(finalResult['method']==="search_read"){
		params = {
			service: "object",
	        model: finalResult['params']['model'],
	        method: finalResult['params']['method'],
	        args: [
	          finalResult['params']['domain'],  // Domain to filter (empty list means no filtering)
	          finalResult['params']['fields'],  // Fields to retrieve
	        ],
	        kwargs: finalResult['params']['kwargs'] || {}
	    }
	}else if(finalResult['params']['method']==="write" || finalResult['params']['method']==="unlink"){
		params = {
			service: "common",
			model: finalResult['params']['model'],
	        method: finalResult['params']['method'],
	        args: finalResult['params']['args'],
	        kwargs: finalResult['params']['kwargs'] || {}
		}
	}else if(finalResult['params']['method']==="search"){
		params = {
			service: "object",
	        model: finalResult['params']['model'],
	        method: finalResult['params']['method'],
	        args: finalResult['params']['args'].length>0?finalResult['params']['args'].length:[[finalResult['params']['domain']]],  // Search 
	        kwargs: finalResult['params']['kwargs'] || {},
	    }
	}else if(finalResult['params']['method']==="create"){
		params = {
			service: "common",
			model: finalResult['params']['model'],
	        method: finalResult['params']['method'],
	        args: finalResult['params']['args'],
	        kwargs: finalResult['params']['kwargs'] || {}
		}
	}*/
	return {
		lastExecutedNode: "odooExecutor",
		toolUsed: toolUsed,
		finalResult: finalResult
	}
}

async function odooApiSelector(state){
	const {query, llm} = state;

	var apis = await Tool.find({type: "odoo"});

	var apis_description_list = apis.map(ele=>{return {name: ele.name, description: ele.description}});

	var messages = [
		{
			"role": "system",
			"content": `You are an odoo agent you should decide from the given list which all apis should be used to complete users request. Your response should consist of list of api names in the order in which they should be executed.
				{
					apis: ${JSON.stringify(apis_description_list)}
				}
				Output must be in json format as follows:
				Output eg:
				[
					api_name_1,
					api_name_2
					.
					.
					.
					api_name_n
				]
			`
		},
		{
			"role": "user",
			"content": query
		}
	];

	var response = await sails.helpers.callChatGpt.with({"messages": messages, "max_tokens": 4096});
  	var selectedApiNames = JSON.parse(response[0]['message']['content']);

  	var selected_apis = apis.filter(ele => selectedApiNames.apis.indexOf(ele.name) > -1);

  	return {
  		bestApi: selected_apis[0],
  		selected_apis: selected_apis,
  		apis: apis,
  		next_node: "odooExecutor"
  	}
}

/*async function odooExecutor(state){
	var {query, llm, bestApi, params, toolUsed} = state;

	var data = [];

	if(typeof params === "object"){
		for (var key of Object.keys(params)) {
			if(Array.isArray(params[key])){
				data.push([key, 'in', params[key]])	
			}else if(typeof params[key] === 'string' || 
				typeof params[key] === 'number' || 
				typeof params[key] === 'boolean'){
				data.push([key, '=', params[key]])
			}
		}
	}
	if(bestApi.method==="search_read"){
		var result = await rpc_call(bestApi.endpoint, {
			kwargs: {
		      context: odoo.context
		    },
		    model: bestApi.model,
		    method: bestApi.method,
		    domain: data
		})
	}else{
		var result = await rpc_call(bestApi.endpoint, {
			kwargs: {
		      context: odoo.context
		    },
		    model: bestApi.model,
		    method: bestApi.method,
		    args: data
		})
	}

	if(!toolUsed){
		toolUsed = []	
	}

	if(result && result['result']){
		toolUsed.push({"tool": bestApi, "result": result['result']['records']})
	}else{
		toolUsed.push({"tool": bestApi, "result": undefined})
	}	

	return {
		lastExecutedNode: "odooExecutor",
		toolUsed: toolUsed,
		finalResult: result['result']? result['result']['records']: undefined
	}
}*/

async function getNextNode(state){
	const {finalResult, next_node, bestApi} = state;

	if(!finalResult){
		return 'pdfGenerator';
	}else if(next_node){
		return next_node;
	}else if(bestApi['next_node']){
		return bestApi['next_node'];
	}else{
		return 'pdfGenerator';
	}
}

async function setInvoiceGenerator(state){
	var api = await Tool.findOne({"name": "Odoo Invoice Summary Retriever"});
	return {
		bestApi: api,
		next_node: "odooExecutor"
	}
}

async function getCompleteInvoiceDetail(state){
	var {finalResult} = state;

	if(!finalResult || finalResult.length === 0){
		return {
			finalResult: undefined
		}
	}

	console.log(finalResult);

	if(finalResult[0]['line_ids']){
		var invoiceApi = await Tool.findOne({"name": "Odoo Invoice Detail Retriever"});

		var result = await rpc_call(invoiceApi.endpoint, {
			kwargs: {
		      context: odoo.context
		    },
		    model: invoiceApi.model,
		    method: invoiceApi.method,
		    args: [
		    	finalResult[0]['line_ids'],
		    	["sequence","product_id","name","quantity","product_uom_category_id","product_uom_id","price_unit","discount","tax_ids","price_subtotal","partner_id","currency_id","company_id","company_currency_id","display_type"]
	    	]
		});
	}

	return {
		finalResult: {
			"invoice": finalResult[0],
			"itemDetails": result['result']
		}
	}
}

module.exports = {
	odooApiSelector,	
	odooExecutor,
	setInvoiceGenerator,
	getCompleteInvoiceDetail,
	connectToOdoo,
	odooAgent
}