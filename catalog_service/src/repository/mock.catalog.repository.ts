import { ICatalogRepository } from "../interface/catalog.repository.interface";
import { Product } from "../models/product.model";

export class MockCatalogRepository implements ICatalogRepository {
    create(product: Product): Promise<Product> {
        return Promise.resolve({
            id: '123',
            ...product
        })
    }
    update(product: Product): Promise<Product> {
        return Promise.resolve(product)
    }
    delete(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    findAll(filter: { limit: number, offset: number }): Promise<Product[]> {
        return Promise.resolve([])
    }
    findById(id: string): Promise<Product> {
        throw new Error("Method not implemented.");
    }
}