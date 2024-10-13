module.exports = {
	getEnv: async function(req, res){
		console.log(sails.config.custom.ENV)
		return res.json({"success": true})		
	},

	getCurrentWorkingDirectory: async function(req, res){
		console.log('Current Working Directory:', process.cwd());
		return res.json({cwd: process.cwd()});
	},

	updateAppData: async function(req, res){
		try{
			var dataName = req.body.data.name;
			const appDataColl = await AppData.getDatastore().manager.collection(AppData.tableName);
			if(dataName){
				var result = await appDataColl.updateOne(
					{"cid": req.body.appId.toString(), "type": req.body.type, "data.name": dataName},
					{$set: {"data": req.body.data}},
					{
						upsert: true
					}
				);	
			}else{
				var result = await appDataColl.updateOne(
					{"cid": req.body.appId.toString(), "type": req.body.type},
					{$set: {"data": req.body.data}},
					{
						upsert: true
					}
				);
			}
			

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