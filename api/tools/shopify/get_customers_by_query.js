const { z } = require("zod");
const { SEARCH_CUSTOMER } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class SearchCustomers extends ShopifyBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "get_customer_orders"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                customer_id: z.number(),
                status: z.enum(["open", "closed", "cancelled", "any"])
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: SEARCH_CUSTOMER
        });
    }

    async _call(arg) {
        const response = await this.shopify.customer.search(arg);
        return JSON.stringify(response);
    }
}
 
module.exports = {SearchCustomers}; 