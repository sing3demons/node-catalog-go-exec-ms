import { ICatalogRepository } from "../interface/catalog.repository.interface";
import { Product } from "../models/product.model";
import prisma, { TPrismaClient } from "../db";


export class CatalogRepository implements ICatalogRepository {
    constructor(private readonly _prisma: TPrismaClient = prisma) { }

    private query = () => {
        this._prisma.$on('query', (e) => {
            console.log(JSON.stringify({
                query: e.query.replace(/"/g, `'`),
                params: e.params.replace(/"/g, `'`),
                duration: `${e.duration} ms`,
                target: e.target
            }, null, 2))
        })
        return this._prisma
    }

    async create(product: Product): Promise<Product> {
        try {
            const data = {
                ...product,
                createBy: 'admin',
                updateBy: 'admin',
            }
            return await this.query().product.create({
                data,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    image: true,
                    stock: true,
                },
            }) as Product;
        } catch (error) {
            throw new Error('unable to create product');
        }
    }

    async update(product: Product): Promise<Product> {
        const productExist = await this.query().product.findUnique({
            where: { id: product.id, deleted: false }
        })

        if (!productExist) { throw new Error('Product not found') }

        const result = await this.query().product.update({
            where: { id: product.id, deleted: false },
            data: {
                name: product.name,
                description: product.description || productExist?.description,
                price: product.price || productExist?.price,
                image: product.image || productExist?.image,
                stock: product.stock || productExist?.stock,
                updateBy: 'admin',
            },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image: true,
                stock: true,
            },
        })

        return result as Product;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.query().product.update({
            where: { id, deleted: false },
            data: {
                deleted: true,
                updateBy: 'admin',
            }
        })
        if (!result) {
            return false
        }
        return true
    }

    async findAll({ limit, offset }: { limit: number, offset: number }): Promise<{ total: number, data: Product[] }> {
        try {
            const [result, total] = await this.query().$transaction([
                this.query().product.findMany({
                    take: limit,
                    skip: offset,
                    where: { deleted: false },
                }),
                this.query().product.count({ where: { deleted: false } })
            ])

            return {
                total,
                data: result
            };
        } catch (error) {
            return {
                total: 0,
                data: []
            }
        }
    }

    async findById(id: string): Promise<Product> {
        try {
            return await this.query().product.findUnique({
                where: { id, deleted: false },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    image: true,
                    stock: true,
                },
            }) as Product;
        } catch (error) {
            throw new Error('Product not found');
        }
    }
}