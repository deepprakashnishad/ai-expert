module.exports = {
	wakeUp: async function(req, res){
		console.log(req.body);
	    return res.ok(200);
	},
}