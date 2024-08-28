const { z } = require("zod");
const { GET_CUSTOMER_ORDERS } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class GetCustomerOrders extends ShopifyBaseTool {
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
                status: z.enum(["open", "closed", "cancelled", "any"]).optional()
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: GET_CUSTOMER_ORDERS
        });
    }

    async _call(arg) {
        var customer_id = arg['customer_id'];
        delete arg['customer_id'];
        const response = await this.shopify.customer.orders(customer_id, arg);
        return JSON.stringify(response);
    }
}
 
module.exports = {GetCustomerOrders}; 