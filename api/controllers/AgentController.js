module.exports = {

	create: async function(req, res){
		var agent = await Agent.create({
			"title": req.body.title,
			"role": req.body.role,
			"sPrompt": req.body.sPrompt
		});

		res.successResponse({data:agent}, 201, null, true, "Agent created successfully");
	},

	update: async function(req, res){
		var agent = await Agent.update({id: req.body.id}, {
			"title": req.body.title,
			"role": req.body.role,
			"sPrompt": req.body.sPrompt
		});

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
	}

}