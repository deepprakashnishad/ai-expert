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
const coreToolExecutor = require('./../core/tool.js');

/*const shopifyOptions = {
	shopName: sails.config.custom.SHOPIFY.shop_name,
	apiKey: sails.config.custom.SHOPIFY.api_key,
	password: sails.config.custom.SHOPIFY.api_secret_key,
	accessToken: sails.config.custom.SHOPIFY.admin_token,
	storeToken: sails.config.custom.SHOPIFY.store_token,
	remaining: 30,
	current: 10,
	max: 40,
	autoLimit: true,
	adminAPIVersion: '2024-07',
	storeAPIVersion: '2023-10',
	baseUrl: "https://6cdc10-40.myshopify.com/"
}

const shopify = new Shopify({
	shopName: shopifyOptions.shopName,
    accessToken: shopifyOptions.accessToken,
    remaining: shopifyOptions.remaining,
    current: shopifyOptions.current,
    max: shopifyOptions.max,
    autoLimit: shopifyOptions.autoLimit,
    baseUrl: shopifyOptions.baseUrl
});*/

const axios = require('axios')

async function cancelOrder(){
	var arg = {"orderId":1006,"customer_id":"6831207317581","cancellation_reason":"customer"};

	var response = await axios.get(`${shopifyOptions.baseUrl}admin/api/orders/${arg['orderId']}.json`,
		{
			"headers": {
				"X-Shopify-Access-Token": shopifyOptions.accessToken
			}
		}
	);

	console.log(response);
	return response.data;
}

async function fetchProducts(){
	var response;
	const client = createStorefrontApiClient({
	  storeDomain: shopifyOptions.baseUrl,
	  apiVersion: shopifyOptions.storeAPIVersion,
	  publicAccessToken: shopifyOptions.storeToken,
	});

	const productQuery = `
	  query ProductQuery($handle: String) {
	    product(handle: $handle) {
	      id
	      title
	      handle
	    }
	  }
	`;
	const {data, errors, extensions} = await client.request(productQuery, {
	  variables: {
	    handle: 'bag-3',
	  },
	});

	console.log(data);

	return data;
}

async function fetchOrders(){
	console.log("Fetching orders")
	return await shopify.order
	  	.list({ limit: 5 });
}

async function getMetafields(){
	shopify.metafield
	  	.list({ metafield: { owner_resource: 'product'} })
		.then((metafields) => console.log(metafields))
  		.catch((err) => console.error(err));
}

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
async function customShopifyAgent(state){

	var {user, conversation} = state;

	var userQuery = conversation[conversation.length-1]['content'];

	var shopifyOptions = await AppData.findOne({cid: user.appId.toString(), type: "shopify"});
	if(shopifyOptions){
		shopifyOptions = shopifyOptions.data;
	}else{
		throw new Error("Shopify credentials not found"); 
	}
	shopifyOptions.current ??= 10;
	shopifyOptions.max ??= 40;
	shopifyOptions.remaining ??= 30;
	shopifyOptions.autoLimit ??= true;
	shopifyOptions.adminAPIVersion ??= '2024-07';
	shopifyOptions.storeAPIVersion ??= '2023-10';
	shopifyOptions.currency = user.currency?user.currency:"INR";

	var getProductListTool = new ShopifyGetProducts(shopifyOptions);
	var getCustomerDetailTool = new GetCustomerDetail(shopifyOptions);
	var getCustomerOrderTool = new GetCustomerOrders(shopifyOptions);
	var getOrderFulfillment = new ShopifyGetOrderFulfillment(shopifyOptions);
	// var calculateRefund = new ShopifyCalculateRefund(shopifyOptions);
	var cancelOrder = new ShopifyCancelOrder(shopifyOptions);
	var getProductVariants = new ShopifyGetProductVariants(shopifyOptions);
	var getRefunds = new ShopifyGetRefunds(shopifyOptions);

	const tools = [
		getProductListTool, 
		getCustomerDetailTool, 
		getCustomerOrderTool, 
		getOrderFulfillment,
		cancelOrder,
		getProductVariants,
		getRefunds
	];

	state['apis'] = tools;

	var result = await coreToolExecutor.bestToolSelector(state);

	return {
		finalResult: result
	};
}


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
	var genericAnswerTool = new GenericAnswerTool();

	tools.push(genericAnswerTool);

	const shopifyAgent = await initializeAgentExecutorWithOptions(tools, llm, {
	    // agentType: "structured-chat-zero-shot-react-description",
	    agentType: "openai-functions",
	    verbose: true,
	});

	if(user && user.id){
		userQuery = `Based on provided information and tools try to find detailed answer to user_query. {"user_query":${userQuery}, "customer_id": ${user.id}, "appId": ${user.appId.toString()}, "chatId": ${chatId}.}`;	
	}else{
		userQuery = `Based on provided information and tools try to find detailed answer to user_query. {"user_query":${userQuery}, "appId": ${user.appId.toString()}, "chatId": ${chatId}.}`;		
	}
	try{
		const result = await shopifyAgent.invoke({ input: userQuery });	
		if(!extraData){
			extraData = {};
		}	
		if(result['output'] && result['output']['template_name']){
			extraData['template_name'] = result['output']['template_name'];		
		}

		return {
			finalResult: result['output']['data']?result['output']['data']:result['output'],
			extraData: extraData
		}
	}catch(e){
		console.log(e);

		return {
			finalResult: "Due to technical issue unable to fetch the results right now. Try again later."
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
	fetchOrders,
	cancelOrder,
	fetchProducts,
	getMetafields,
	mShopifyAgent,
	shopifyAgent,
	customShopifyAgent,
	getShopifyCustomerDetails
}