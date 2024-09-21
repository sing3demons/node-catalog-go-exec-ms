// import { ICatalogRepository } from "../interface/catalog.repository.interface";
// import { Product } from "../models/product.model";

// export class MockCatalogRepository implements ICatalogRepository {
//     async delete(id: string): Promise<boolean> {
//         throw new Error("Method not implemented.");
//     }
//     async findAll(filter: { limit: number; offset: number; }): Promise<{ total: number; data: Product[]; }> {
//         throw new Error("Method not implemented.");
//     }
//     async create(product: Product): Promise<Product> {
//         return Promise.resolve({
//             id: '123',
//             ...product
//         })
//     }
//     async update(product: Product): Promise<Product> {
//         return Promise.resolve(product)
//     }

//     async findById(id: string): Promise<Product> {
//         throw new Error("Method not implemented.");
//     }
// }