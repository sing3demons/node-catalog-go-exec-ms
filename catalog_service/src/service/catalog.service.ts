import { ICatalogRepository } from "../interface/catalog.repository.interface";
import { Product } from "../models/product.model";

export class CatalogService {
    constructor(private readonly repository: ICatalogRepository) {
    }

    async createProduct(product: Product): Promise<Product> {
        return await this.repository.create(product);
    }

    update(product: Product): Promise<Product> {
        return this.repository.update(product);
    }

    delete(id: string): Promise<void> {
        return this.repository.delete(id);
    }

    findAll(filter: { limit: number, offset: number }): Promise<Product[]> {
        return this.repository.findAll();
    }

    findById(id: string): Promise<Product> {
        return this.repository.findById(id);
    }

}