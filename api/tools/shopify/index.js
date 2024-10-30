const Shopify = require('shopify-api-node');
const {createStorefrontApiClient} = require('@shopify/storefront-api-client');

const {ChatOpenAI} = require("@langchain/openai");
// export {ShopifyGetOrders} from './get_order.js';
const { initializeAgentExecutorWithOptions } = require("langchain/agents");
const {ShopifyGetOrders} = require("./get_order_list.js");
const {ShopifyGetProducts} = require("./get_product_list.js");
const {GetCustomerDetail} = require("./get_customer_detail.js");
const {GetCustomerList} = require("./get_customer_list.js");
const {SearchCustomers} = require("./get_customers_by_query.js");
const {GetCustomerOrders} = require("./get_customer_orders.js");
const {ShopifyGetOrderFulfillment} = require("./get_order_fulfillment.js");
const {ShopifyCancelOrder} = require("./cancel_order.js");
const {ShopifyGetProductVariants} = require("./get_product_variants.js");
const {ShopifyGetRefunds} = require("./get_refunds.js")
const {ShopifyCalculateRefund} = require("./calculate_refund.js")
const {SearchProductByQuery} = require("./search_product_by_query.js");
const {GenericAnswerTool} = require("./generic_answer_tool.js");
const {FetchInventory} = require("./get_inventory.js");
const {ShopifyGetProductRecommendations} = require("./product_recommendation.js");
// const coreToolExecutor = require('./../core/tool.js');

const axios = require('axios')

async function getShopifyCustomerDetails(state){
	var {user} = state;

	var shopifyOptions = await AppData.findOne({cid: user.appId.toString(), type: "shopify"});
	if(shopifyOptions){
		shopifyOptions = shopifyOptions.data;
	}else{
		return {};
	}
	shopifyOptions.current ??= 10;
	shopifyOptions.max ??= 40;
	shopifyOptions.autoLimit ??= true;
	shopifyOptions.adminAPIVersion ??= '2024-07';
	shopifyOptions.storeAPIVersion ??= '2023-10';
	shopifyOptions.remaining ??= 30;

	const shopify = new Shopify({
		shopName: shopifyOptions.shopName,
	    accessToken: shopifyOptions.accessToken,
	    remaining: shopifyOptions.remaining,
	    current: shopifyOptions.current,
	    max: shopifyOptions.max,
	    autoLimit: shopifyOptions.autoLimit,
	    baseUrl: shopifyOptions.baseUrl
	});

	try{
		var response;
		if(user.email){
			response = await shopify.customer.search({email: user.email});	
		}else if(user.phone){
			response = await shopify.customer.search({phone: user.phone});	
		}

		if(response && response.length > 0){
			response[0]['name'] = user['name'];
			response[0]['appId'] = user['appId'];
		}else{
			return {}
		}	

		return {
			user: response[0]
		}
	}catch(e){
		console.log(e);
		return {}
	}
}

/*Custom agent to introduce human node*/
/*async function customShopifyAgent(state){

	var {user, conversation} = state;

	var userQuery = conversation[conversation.length-1]['content'];

	var tools = [];

	var shopifyOptions = await AppData.findOne({cid: user.appId.toString(), type: "shopify"});
	if(shopifyOptions){
		shopifyOptions = shopifyOptions.data;
		shopifyOptions.current ??= 10;
		shopifyOptions.max ??= 40;
		shopifyOptions.remaining ??= 30;
		shopifyOptions.autoLimit ??= true;
		shopifyOptions.adminAPIVersion ??= '2024-07';
		shopifyOptions.storeAPIVersion ??= '2024-07';
		shopifyOptions.currency = user.currency?user.currency:"INR";

		const shopify = new Shopify({
			shopName: shopifyOptions.shopName,
		    accessToken: shopifyOptions.accessToken,
		    remaining: shopifyOptions.remaining,
		    current: shopifyOptions.current,
		    max: shopifyOptions.max,
		    autoLimit: shopifyOptions.autoLimit,
		    baseUrl: shopifyOptions.baseUrl
		});

		var response;
		try{
			if(user.email){
				response = await shopify.customer.search({email: user.email});	
			}else if(user.phone){
				response = await shopify.customer.search({phone: user.phone});	
			}

			if(response && response.length > 0){
				state['user']['id'] = response[0]['id'];
				state['user']['name'] = response[0]['name'];
			}
		}catch(e){
			console.log(e);
		}
		
		// var getProductListTool = new ShopifyGetProducts(shopifyOptions);
		var getCustomerDetailTool = new GetCustomerDetail(shopifyOptions);
		var getCustomerOrderTool = new GetCustomerOrders(shopifyOptions);
		var getOrderFulfillment = new ShopifyGetOrderFulfillment(shopifyOptions);
		// var calculateRefund = new ShopifyCalculateRefund(shopifyOptions);
		var cancelOrder = new ShopifyCancelOrder(shopifyOptions);
		var getProductVariants = new ShopifyGetProductVariants(shopifyOptions);
		var getRefunds = new ShopifyGetRefunds(shopifyOptions);
		var searchProductByQuery = new SearchProductByQuery(shopifyOptions);
		var inventoryTool = new FetchInventory(shopifyOptions);
		var productRecommendationTool = new ShopifyGetProductRecommendations(shopifyOptions);
		tools = [
			// getProductListTool, 
			getCustomerDetailTool, 
			getCustomerOrderTool, 
			getOrderFulfillment,
			cancelOrder,
			getProductVariants,
			getRefunds,
			searchProductByQuery,
			inventoryTool,
			productRecommendationTool,
		];
	}

	// var genericAnswerTool = new GenericAnswerTool();

	// tools.push(genericAnswerTool);

	state['apis'] = tools;

	var result = await coreToolExecutor.bestToolSelector(state);

	return {
		finalResult: result
	};
}
*/
/*langchain ReAct agent to be used in langgraph*/
async function shopifyAgent(state){
	var {llm, conversation, user, extraData, chatId} = state;

	var userQuery = conversation[conversation.length-1]['content'];

	var tools = [];

	var shopifyOptions = await AppData.findOne({cid: user.appId.toString(), type: "shopify"});
	if(shopifyOptions){
		shopifyOptions = shopifyOptions.data;
		shopifyOptions.current ??= 10;
		shopifyOptions.max ??= 40;
		shopifyOptions.remaining ??= 30;
		shopifyOptions.autoLimit ??= true;
		shopifyOptions.adminAPIVersion ??= '2024-07';
		shopifyOptions.storeAPIVersion ??= '2024-10';
		shopifyOptions.currency = user.currency?user.currency:"INR";

		const shopify = new Shopify({
			shopName: shopifyOptions.shopName,
		    accessToken: shopifyOptions.accessToken,
		    remaining: shopifyOptions.remaining,
		    current: shopifyOptions.current,
		    max: shopifyOptions.max,
		    autoLimit: shopifyOptions.autoLimit,
		    baseUrl: shopifyOptions.baseUrl
		});

		var response;
		try{
			if(user.email){
				response = await shopify.customer.search({email: user.email});	
			}else if(user.phone){
				response = await shopify.customer.search({phone: user.phone});	
			}

			if(response && response.length > 0){
				user['id'] = response[0]['id'];
				user['name'] = response[0]['name'];
			}
		}catch(e){
			console.log(e);
		}


		// var getProductListTool = new ShopifyGetProducts(shopifyOptions);
		var getCustomerDetailTool = new GetCustomerDetail(shopifyOptions);
		var getCustomerOrderTool = new GetCustomerOrders(shopifyOptions);
		var getOrderFulfillment = new ShopifyGetOrderFulfillment(shopifyOptions);
		// var calculateRefund = new ShopifyCalculateRefund(shopifyOptions);
		var cancelOrder = new ShopifyCancelOrder(shopifyOptions);
		var getProductVariants = new ShopifyGetProductVariants(shopifyOptions);
		var getRefunds = new ShopifyGetRefunds(shopifyOptions);
		var searchProductByQuery = new SearchProductByQuery(shopifyOptions);
		var inventoryTool = new FetchInventory(shopifyOptions);
		var productRecommendationTool = new ShopifyGetProductRecommendations(shopifyOptions);
		tools = [
			// getProductListTool, 
			getCustomerDetailTool, 
			getCustomerOrderTool, 
			getOrderFulfillment,
			cancelOrder,
			getProductVariants,
			getRefunds,
			searchProductByQuery,
			inventoryTool,
			productRecommendationTool,
		];
	}else{
		return {
			finalResult: "Shopify store details are missing. We regret the inconvenience.",
			next_node: "__end__"
		}
	}
	/*var genericAnswerTool = new GenericAnswerTool();

	tools.push(genericAnswerTool);*/
	try{
		const shopifyAgent = await initializeAgentExecutorWithOptions(tools, llm, {
		    // agentType: "structured-chat-zero-shot-react-description",
		    agentType: "openai-functions",
		    verbose: true,
		});

		if(user && user.id){
			userQuery = `Based on provided information and tools try to find detailed answer to user_query alongwith the action_name, template and additional data. {"user_query":${userQuery}, "customer_id": ${user.id}, "appId": ${user.appId.toString()}, "chatId": ${chatId}.}`;	
		}else{
			userQuery = `Based on provided information and tools try to find detailed answer to user_query alongwith the action_name, template and additional data. {"user_query":${userQuery}, "appId": ${user.appId.toString()}, "chatId": ${chatId}.}`;		
		}
		
		const result = await shopifyAgent.invoke({ input: userQuery });	
		if(!extraData){
			extraData = {};
		}	
		if(result['output'] && result['output']['template_name']){
			extraData['template_name'] = result['output']['template_name'];		
		}

		return {
			finalResult: result['output']['data']?result['output']['data']:result['output'],
			extraData: extraData,
			next_node: undefined
		}
	}catch(e){
		console.log(e);

		return {
			finalResult: "Due to technical issue unable to fetch the results right now. Try again later.",
			next_node: undefined
		}
	}
}

/*Standalone langchain ReAct agent*/
async function mShopifyAgent(query){
	const llm = new ChatOpenAI({
	    modelName: "gpt-3.5-turbo-0125",//"gpt-4-turbo-preview",
	    temperature: 0,
	});

	var customerSearchTool = new SearchCustomers(shopifyOptions);
	var getProductListTool = new ShopifyGetProducts(shopifyOptions);
	// var getCustomerDetailTool = new GetCustomerDetail(shopifyOptions);
	var getCustomerOrderTool = new GetCustomerOrders(shopifyOptions);
	var getOrderFulfillment = new ShopifyGetOrderFulfillment(shopifyOptions);
	var calculateRefund = new ShopifyCalculateRefund(shopifyOptions);
	var cancelOrder = new ShopifyCancelOrder(shopifyOptions);
	var getProductVariants = new ShopifyGetProductVariants(shopifyOptions);
	var getRefunds = new ShopifyGetRefunds(shopifyOptions);

	const tools = [
		getProductListTool, 
		// getCustomerDetailTool, 
		getCustomerOrderTool, 
		getOrderFulfillment,
		getOrderFulfillment,
		calculateRefund,
		cancelOrder,
		getProductVariants,
		getRefunds,
		customerSearchTool
	];

	const shopifyAgent = await initializeAgentExecutorWithOptions(tools, llm, {
	    agentType: "structured-chat-zero-shot-react-description",
	    verbose: true,
	});

	query = `${query}. Note: Output must be same as returned by the tool.`;

	const result = await shopifyAgent.invoke({ input: query });
	    // Create Result {
	    //   output: 'I have created a draft email for you to edit. The draft Id is r5681294731961864018.'
	    // }
	console.log("Result", result);

	return result;
}

module.exports = {
	mShopifyAgent,
	shopifyAgent,
	// customShopifyAgent,
	getShopifyCustomerDetails,

	ShopifyGetOrders,
	ShopifyGetProducts,
	GetCustomerDetail,
	GetCustomerList,
	SearchCustomers,
	GetCustomerOrders,
	ShopifyGetOrderFulfillment,
	ShopifyCancelOrder,
	ShopifyGetProductVariants,
	ShopifyGetRefunds,	
	ShopifyCalculateRefund,	
	SearchProductByQuery,
	GenericAnswerTool,
	FetchInventory,
	ShopifyGetProductRecommendations,
}