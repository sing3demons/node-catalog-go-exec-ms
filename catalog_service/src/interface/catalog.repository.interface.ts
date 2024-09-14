import { Product } from "../models/product.model";

export interface ICatalogRepository {
    create(product: Product): Promise<Product>;
    update(product: Product): Promise<Product>;
    delete(id: string): Promise<void>;
    findAll(filter: { limit: number, offset: number }): Promise<Product[]>;
    findById(id: string): Promise<Product>;
}