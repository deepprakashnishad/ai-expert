const { z } = require("zod");
const { GET_CUSTOMER_LIST } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class GetCustomerList extends ShopifyBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "get_customer_list"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                limit: z.number().default(10),
                ids: z.string().array().optional(),
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: GET_CUSTOMER_LIST
        });
    }

    async _call(arg) {
        const response = await this.shopify.customer.list(arg);
        return JSON.stringify(response);
    }
}
 
module.exports = {GetCustomerList}; 