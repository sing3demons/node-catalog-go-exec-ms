import { HttpLogger } from "../logger";
import { IProduct, Product } from "../models/product.model";

export interface ICatalogRepository {
    create(product: Product, logger: HttpLogger): Promise<Product>;
    update(product: Partial<Product>, logger: HttpLogger): Promise<Product | null>;
    delete(id: string, logger: HttpLogger): Promise<boolean>;
    findAll(filter: IProduct, logger: HttpLogger): Promise<{ total: number, data: Product[] }>;
    findById(id: string, logger: HttpLogger): Promise<Product | null>;
}