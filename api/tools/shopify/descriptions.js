const GET_SOPIFY_ORDER_DESCRIPTION = `A tool for fetching orders in shopify.

	INPUT example:
	{
	  "limit": 10,
	  "status": "open"
	}

	OUTPUT:
	The output is a list of orders for the given condition.
`;

const GET_SOPIFY_PRODUCT_LIST_DESCRIPTION = `A tool for fetching products in shopify.

	INPUT example:
	{
	  "limit": 10
	}

	OUTPUT:
	The output is a list of products for the given condition.
`;

const GET_CUSTOMER_LIST = `A tool for fetching list of customers
	INPUT example:
	{
	  "limit": 10
	}

	OUTPUT:
	The output is a list of products for the given condition.
`;

const GET_CUSTOMER_DETAIL = `A tool for retrieving single customer
	INPUT example:
	{
	  "customer_id": 10
	}

	OUTPUT:
	The output is a details of the customer whose id is provived. Output must be in json format
`;

const GET_CUSTOMER_ORDERS = `A tool for retrieving orders of a customer
	INPUT example:
	{
	  "customer_id": 10,
	  "status": "open"
	}

	OUTPUT: List of orders for the given customer.
`;

const SEARCH_CUSTOMER = `A tool to search a customer for the given query
	INPUT example:
	{
	  "limit": 10
	}

	OUTPUT: List of orders for the given customer.
`;

module.exports = {
	GET_SOPIFY_ORDER_DESCRIPTION,
	GET_SOPIFY_PRODUCT_LIST_DESCRIPTION,
	GET_CUSTOMER_LIST,
	GET_CUSTOMER_DETAIL,
	GET_CUSTOMER_ORDERS,
	SEARCH_CUSTOMER
}