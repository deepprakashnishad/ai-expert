const Shopify = require('shopify-api-node');
const { z } = require("zod");
const { StructuredTool } = require("@langchain/core/tools");
const { getEnvironmentVariable } = require("@langchain/core/utils/env");

class ShopifyBaseTool extends StructuredTool {
    constructor(fields) {
        super(...arguments);
        Object.defineProperty(this, "CredentialsSchema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z
                .object({
                shopName: z
                    .string()
                    .min(1)
                    .default(getEnvironmentVariable("shopName") ?? ""),
                apiKey: z
                    .string()
                    .default(getEnvironmentVariable("apiKey") ?? ""),
                password: z
                    .string()
                    .default(getEnvironmentVariable("password") ?? ""),
                accessToken: z
                    .string()
                    .default(getEnvironmentVariable("accessToken") ?? ""),    
                remaining: z.number().default(30),
                current: z.number().default(10),
                max: z.number().default(30),
                autoLimit: z.boolean().default(true),
            })
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Shopify"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "A tool to perform operations related to shopify"
        });
        this.shopify = this.getShopify(this.CredentialsSchema.parse(fields));
    }

    getShopify(credentials) {
        console.log(credentials);
        const shopify = new Shopify(credentials);
        return shopify;
    }
}

module.exports = {ShopifyBaseTool}