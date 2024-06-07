module.exports = {

	create: async function(req, res){
		var tool = await Tool.create(req.body).fetch();

		res.successResponse({tool: tool}, 201, null, true, "Tool created successfully");
	},

	update: async function(req, res){
		data = req.body;
		
		var tool = await Tool.update({id: req.body.id}, data);

		res.successResponse({data:tool}, 200, null, true, "Tool updated successfully");
	},

	get: async function(req, res){
		var tool = await Tool.findOne({id: req.params.id});
		if(tool){
			res.successResponse({"tool" :tool}, 200, null, true, "Tool retrieved successfully");
		}else{
			res.successResponse({}, 200, null, false, "Tool not found");
		}
		
	},

	list: async function(req, res){
		var agents = await Tool.find();

		res.successResponse({"agents": agents}, 200, null, true, "Tool retrieved successfully");
	},

	delete: async function(req, res){
		var result = await Tool.destroyOne({id: req.params.id});

		res.successResponse({result: result}, 200, null, true, "Tool deleted successfully");
	},
}