import { ICatalogRepository } from "../interface/catalog.repository.interface";
import { Product } from "../models/product.model";

export class CatalogRepository implements ICatalogRepository {
    create(product: Product): Promise<Product> {
        throw new Error("Method not implemented.");
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