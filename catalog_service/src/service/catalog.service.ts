import { ICatalogRepository } from "../interface/catalog.repository.interface";
import type { HttpLogger } from "../logger";
import { IProduct, Product } from "../models/product.model";
import { BaseResponse, t } from "../my-router";

export class CatalogService {
    constructor(private readonly repository: ICatalogRepository) { }
    private CATALOG_BASE_URL = process.env.CATALOG_BASE_URL || ''

    async createProduct(product: Product, logger: HttpLogger): Promise<BaseResponse> {
        const response: BaseResponse = {}
        try {
            const data = await this.repository.create(product, logger)
            response.data = data
            response.statusCode = 20100
            response.message = 'Product created successfully'
            return response

        } catch (error) {
            response.statusCode = 50000
            response.message = error instanceof Error ? error.message : 'unable to create product'
            return response
        }
    }

    async update(product: Partial<Product>, logger: HttpLogger): Promise<BaseResponse> {
        const response: BaseResponse = {}
        try {
            const result = await this.repository.update(product, logger);
            response.data = result
            response.statusCode = 20000
            response.message = 'Product updated successfully'
            return response
        } catch (error) {
            response.statusCode = 40400
            response.message = error instanceof Error ? error.message : 'unable to update product'

            return response

        }
    }

    async delete(id: string, logger: HttpLogger): Promise<BaseResponse> {
        const response: BaseResponse = {}
        const data = await this.repository.delete(id, logger);
        response.statusCode = data ? 20000 : 40400
        response.message = data ? 'Product deleted successfully' : 'Product not found'
        return response
    }

    async findAll(filter: IProduct, logger: HttpLogger): Promise<BaseResponse<Product[]>> {
        logger.info(`service`)
        const { data, total } = await this.repository.findAll(filter, logger);
        const response: BaseResponse<Product[]> = {
            statusCode: total > 0 ? 20000 : 40400,
            message: total > 0 ? 'Product found' : 'Product not found',
            data: data.map((product) => {
                return {
                    id: product.id,
                    href: `${this.CATALOG_BASE_URL}/product/${product.id}`,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    image: product.image,
                    stock: product.stock,
                }
            }),
            total
        }
        data.length === 0
        return response
    }

    async findById(id: string, logger: HttpLogger): Promise<BaseResponse<Product>> {
        const response: BaseResponse<Product> = {}
        const data = await this.repository.findById(id, logger);
        if (!data) {
            response.statusCode = 40400
            response.message = 'Product not found'
            response.data = {} as unknown as Product
            return response
        }

        response.data = {
            id: data.id,
            href: `${this.CATALOG_BASE_URL}/product/${data.id}`,
            name: data.name,
            description: data.description,
            price: data.price,
            image: data.image,
            stock: data.stock,
        }
        response.statusCode = 20000
        response.message = 'Product found'
        return response
    }

}