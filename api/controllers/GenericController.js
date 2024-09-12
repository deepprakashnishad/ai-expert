module.exports = {

	updateAppData: async function(req, res){
		try{
			const appDataColl = await AppData.getDatastore().manager.collection(AppData.tableName);
			var result = await appDataColl.updateOne(
				{"cid": req.body.appId, "type": req.body.type},
				{$set: {"data": req.body.data}},
				{
					upsert: true
				}
			);

			return res.json({"success": true})
		}catch(e){
			console.log(e);
			return res.json(e);
		}
		
	},

	wakeUp: async function(req, res){
		console.log(req.body);
	    return res.ok(200);
	},

	resetPassword: async function(req, res){
		console.log("Password reset function called");
		console.log(req.body);
		return res.ok(200);
	}
}