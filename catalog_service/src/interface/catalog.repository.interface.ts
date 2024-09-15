import { Product } from "../models/product.model";

export interface ICatalogRepository {
    create(product: Product): Promise<Product>;
    update(product: Partial<Product>): Promise<Product>;
    delete(id: string): Promise<boolean>;
    findAll(filter: { limit: number, offset: number }): Promise<{ total: number, data: Product[] }>;
    findById(id: string): Promise<Product>;
}