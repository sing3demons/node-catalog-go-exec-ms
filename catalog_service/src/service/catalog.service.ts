import { ICatalogRepository } from "../interface/catalog.repository.interface";
import { Product } from "../models/product.model";

export class CatalogService {
    constructor(private readonly repository: ICatalogRepository) {
    }

    async createProduct(product: Product): Promise<{ err: boolean, data: Product }> {
        try {
            const data = await this.repository.create(product);
            if (!data.id) {
                throw new Error('unable to create product');
            }
            return {
                err: false,
                data
            }
        } catch (error) {
            return {
                err: true,
                data: error as Product
            }

        }
    }

    async update(product: Product): Promise<Product> {
        return this.repository.update(product);
    }

    async delete(id: string): Promise<void> {
        return this.repository.delete(id);
    }

    async findAll(filter: { limit: number, offset: number }): Promise<Product[]> {
        return this.repository.findAll(filter);
    }

    async findById(id: string): Promise<Product> {
        return this.repository.findById(id);
    }

}