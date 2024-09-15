import { ICatalogRepository } from "../interface/catalog.repository.interface";
import { Product } from "../models/product.model";
import { BaseResponse } from "../my-router";

export class CatalogService {
    constructor(private readonly repository: ICatalogRepository) {
    }

    async createProduct(product: Product): Promise<BaseResponse> {
        const response: BaseResponse = {}
        try {
            const data = await this.repository.create(product);
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

    async update(product: Partial<Product>): Promise<BaseResponse> {
        const response: BaseResponse = {}
        try {
            const result = await this.repository.update(product);
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

    async delete(id: string): Promise<BaseResponse> {
        const response: BaseResponse = {}
        const data = await this.repository.delete(id);
        response.statusCode = data ? 20000 : 40400
        response.message = data ? 'Product deleted successfully' : 'Product not found'
        return response
    }

    async findAll(filter: { limit: number, offset: number }): Promise<BaseResponse<Product[]>> {
        const { data, total } = await this.repository.findAll(filter);
        const response: BaseResponse<Product[]> = {
            statusCode: total > 0 ? 20000 : 40400,
            message: total > 0 ? 'Product found' : 'Product not found',
            data: data.map((product) => {
                return {
                    id: product.id,
                    href: `http://localhost:8000/api/product/${product.id}`,
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

    async findById(id: string): Promise<BaseResponse<Product>> {
        const response: BaseResponse<Product> = {}
        const data = await this.repository.findById(id);
        if (!data) {
            response.statusCode = 40400
            response.message = 'Product not found'
            return response
        }

        response.data = {
            id: data.id,
            href: `/product/${data.id}`,
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