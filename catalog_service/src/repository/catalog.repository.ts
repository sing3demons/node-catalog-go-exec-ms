import { ICatalogRepository } from "../interface/catalog.repository.interface";
import { Product } from "../models/product.model";
import { v4 as uuidv4 } from 'uuid';

export class CatalogRepository implements ICatalogRepository {
    async create(product: Product): Promise<Product> {
        try {
            return {
                id: uuidv4(),
                ...product
            }
        } catch (error) {
            throw new Error('unable to create product');
        }
    }
    update(product: Product): Promise<Product> {
        throw new Error("Method not implemented.");
    }
    delete(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    findAll(filter: { limit: number, offset: number }): Promise<Product[]> {
        throw new Error("Method not implemented.");
    }
    findById(id: string): Promise<Product> {
        throw new Error("Method not implemented.");
    }
}