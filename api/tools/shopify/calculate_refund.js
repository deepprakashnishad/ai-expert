const { z } = require("zod");
const { CALCULATE_REFUND } = require("./descriptions.js");
const { ShopifyBaseTool } = require('./base.js');

class ShopifyCalculateRefund extends ShopifyBaseTool {

    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "calculate_refund"
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
            value: CALCULATE_REFUND
        });
    }

    async _call(arg) {
        try{
            const response = await this.shopify.refund.calculate(arg['orderId']);
            return JSON.stringify(response);    
        }catch(ex){
            console.log(ex);
        }
        return undefined;
    }
}
 
module.exports = {ShopifyCalculateRefund}; 