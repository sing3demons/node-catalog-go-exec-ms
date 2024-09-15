import { t } from "../my-router";

export class Product {
    constructor(
        public readonly name: string,
        public readonly description: string,
        public readonly price: number,
        public readonly image: string,
        public readonly stock: number,
        public readonly id?: string,
        public readonly href?: string,
    ) { }
}

export const ProductSchema = t.object({
    name: t.string(),
    description: t.string(),
    price: t.number(),
    image: t.string(),
    stock: t.number()
})

export const ProductUpdateSchema = t.object({
    name: t.string(),
    description: t.string().optional(),
    price: t.number().optional(),
    image: t.string().optional(),
    stock: t.number().optional()
})