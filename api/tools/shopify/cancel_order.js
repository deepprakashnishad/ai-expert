const { z } = require("zod");
const { CANCEL_ORDER } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class ShopifyCancelOrder extends ShopifyBaseTool {

    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "shopify_cancel_order"
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z.object({
                orderId: z.number()
            })
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: CANCEL_ORDER
        });
    }

    async _call(arg) {
        try{
            const response = await this.shopify.order.cancel(arg['orderId']);
            return JSON.stringify(response);    
        }catch(ex){
            console.log(ex);
        }
        return undefined;
    }
}
 
module.exports = {ShopifyCancelOrder}; 