const { z } = require("zod");
const { GET_SOPIFY_ORDER_DESCRIPTION } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class ShopifyGetOrders extends ShopifyBaseTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "retrieve_shopify_order"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                limit: z.number().default(10),
                status: z.string().optional(),
                financial_status: z.enum(["authorized", "pending", "paid", "partially_paid", "refunded", "voided", "partially_refunded", "any", "unpaid"]).optional(),
                fulfillment_status: z.enum(["shipped", "partial", "unshipped", "any", "unfulfilled"]).optional(),
                status: z.enum(["open", "closed", "cancelled", "any"]).optional(),
                ids: z.string().array().optional(),
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: GET_SOPIFY_ORDER_DESCRIPTION
        });
    }

    async _call(arg) {
        try{
            const response = await this.shopify.order.list(arg);
            console.log(response);
            return JSON.stringify(response);    
        }catch(ex){
            console.log(ex);
        }
        return undefined;
    }
}
 
module.exports = {ShopifyGetOrders}; 