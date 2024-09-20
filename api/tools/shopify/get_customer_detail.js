const { z } = require("zod");
const { GET_CUSTOMER_DETAIL } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class GetCustomerDetail extends ShopifyBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "get_customer_detail"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                customer_id: z.number()
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: GET_CUSTOMER_DETAIL
        });
    }

    async _call(arg) {
        if(!arg && !arg['customer_id']){
            return "Customer id is required to get customer details"; 
        }
        const response = await this.shopify.customer.get(arg);
        return JSON.stringify(response);
    }
}
 
module.exports = {GetCustomerDetail}; 