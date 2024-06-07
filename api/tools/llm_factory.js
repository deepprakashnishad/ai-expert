const indexModule = require('./index');

module.exports = {
	getLangchainLLMInstance: function(type="OPENAI"){
		if(type==="OPENAI"){
			return new ChatOpenAI();
		}else{
			return new ChatOpenAI();
		}
	}
}