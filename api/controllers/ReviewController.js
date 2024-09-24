module.exports = {

	create: async function(req, res){
		try{
			req.body.appId = req.body.appId.toString();
			const reviewColl = await Review.getDatastore().manager.collection(Review.tableName);
			var result = await reviewColl.updateOne(
				{"chatId": req.body.chatId},
				{$set: req.body},
				{
					upsert: true
				}
			);

			return res.json({"success": true})
		}catch(e){
			console.log(e);
			return res.json(e);
		}
		res.successResponse({agent: agent}, 201, null, true, "Agent created successfully");
	},

	get: async function(req, res){
		try{
			var reviews = await Review.find({appId: req.query.appId.toString()});
			return res.json({success:true, "reviews":reviews});	
		}catch(e){
			console.log(reviews);
			return res.json({success: false, "msg": "Internal server error"});
		}
	}
}