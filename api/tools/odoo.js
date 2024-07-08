var Odoo = require('./odoo/index.js');

var odoo = new Odoo({
  host: 'localhost',
  port: 8069,
  database: 'ecmps',
  username: 'admin',
  password: 'admin'
});

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

async function searchReadOdoo(model, params){
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
		console.log(e);
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

async function rpc_call(endpoint, params){
	try{
		if(!odoo.sid){
			await connectToOdoo();	
		}
		const result = await new Promise((resolve, reject)=>{
			odoo.rpc_call(endpoint, params, function(err, result){
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

  	var selected_apis = apis.filter(ele => selectedApiNames.index(ele.name) > -1);

  	console.log(selected_apis);

  	return {
  		bestApi: selected_apis[0],
  		selected_apis: selected_apis,
  		apis: selected_apis,
  		next_node: "odooExecutor"
  	}
}

async function odooExecutor(state){
	const {query, llm, bestApi, params} = state;

	var result = await rpc_call(bestApi.endpoint, {
		kwargs: {
	      context: odoo.context
	    },
	    model: bestApi.model,
	    method: bestApi.method,
	    args: [params]
	})

	return {
		lastExecutedNode: "odooExecutor",
		finalResult: result
	}
}

module.exports = {
	odooApiSelector,	
	odooExecutor
}