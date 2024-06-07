module.exports = {
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