const GET_SOPIFY_ORDER_DESCRIPTION = `A tool for fetching orders in shopify.`;

const GET_SOPIFY_PRODUCT_LIST_DESCRIPTION = `A tool for fetching products in shopify.`;

const GET_CUSTOMER_LIST = `A tool for fetching list of customers`;

const GET_CUSTOMER_DETAIL = `A tool for retrieving single customer`;

const GET_CUSTOMER_ORDERS = `A tool for retrieving orders of a customer or for generating invoice`;

const SEARCH_CUSTOMER = `A tool to search a customer for the given query`;

const CANCEL_ORDER = `A tool to cancel customer order`;

const GET_REFUNDS = `This tool retrieves list refunds related to an order or for last order for a given customer_id or customer_email
	Output must be list of refunds in json.
`;

const CALCULATE_REFUND = `This tool calculates refund for the given orderId`;

const GET_PRODUCT_VARIANTS = `This tool fetch variants of the given product id or product title`;

const GET_ORDER_FULFILLMENT = `Retrieves fulfillments associated with an order.`;

module.exports = {
	GET_SOPIFY_ORDER_DESCRIPTION,
	GET_SOPIFY_PRODUCT_LIST_DESCRIPTION,
	GET_CUSTOMER_LIST,
	GET_CUSTOMER_DETAIL,
	GET_CUSTOMER_ORDERS,
	SEARCH_CUSTOMER,
	CANCEL_ORDER,
	GET_REFUNDS,
	CALCULATE_REFUND,
	GET_PRODUCT_VARIANTS,
	GET_ORDER_FULFILLMENT
}