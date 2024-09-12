const Shopify = require('shopify-api-node');
const { z } = require("zod");
const { StructuredTool } = require("@langchain/core/tools");
const { getEnvironmentVariable } = require("@langchain/core/utils/env");
const {createStorefrontApiClient} = require('@shopify/storefront-api-client');


class ShopifyBaseTool extends StructuredTool {
    constructor(fields) {
        super(...arguments);
        this.baseUrl = fields['baseUrl'];
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
                baseUrl: z.string(),
                storeAPIVersion: z.string(),
                storeToken: z.string()
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
        /*Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: fields['baseUrl']
        })*/
        this.shopify = this.getShopify(this.CredentialsSchema.parse(fields));

        this.storefrontClient = this.getStorefrontClient(this.CredentialsSchema.parse(fields));
    }

    getShopify(credentials) {
        const shopify = new Shopify({
            shopName: credentials.shopName,
            accessToken: credentials.accessToken,
            remaining: credentials.remaining,
            current: credentials.current,
            max: credentials.max,
            autoLimit: credentials.autoLimit,
            baseUrl: credentials.baseUrl
        });
        /*this.shopifyStore = new Shopify({

        });*/
        return shopify;
    }

    getStorefrontClient(credentials){
        const client = createStorefrontApiClient({
          storeDomain: credentials.baseUrl,
          apiVersion: credentials.storeAPIVersion,
          publicAccessToken: credentials.storeToken,
        });

        return client;
    }
}

module.exports = {ShopifyBaseTool}