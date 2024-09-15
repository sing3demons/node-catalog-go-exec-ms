import { ICatalogRepository } from "../interface/catalog.repository.interface";
import { IProduct, Product } from "../models/product.model";
import Prisma, { TPrismaClient } from "../db";
import type { HttpLogger } from "../logger";


export class CatalogRepository implements ICatalogRepository {
    constructor(private readonly _prisma: TPrismaClient = Prisma()) { }

    private query = (logger: HttpLogger) => {
        this._prisma.$on('query', (e) => {
            const query = {
                query: e.query.replace(/"/g, `'`),
                params: e.params.replace(/"/g, `'`),
                duration: `${e.duration} ms`,
                target: e.target
            }
            logger.write(query)

        })

        return this._prisma
    }

    async create(product: Product & { username: string }, logger: HttpLogger): Promise<Product> {
        try {
            const result = await this.query(logger).product.create({
                data: {
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    image: product.image,
                    stock: product.stock,
                    createBy: product.username,
                    updateBy: product.username,
                }
            }) as Product;
            logger.info(result, `product created`)
            return result
        } catch (error) {
            throw new Error('unable to create product');
        }
    }

    async update(product: Product & { username: string }, logger: HttpLogger): Promise<Product | null> {
        const productExist = await this.query(logger).product.findUnique({
            where: { id: product.id, deleted: false }
        })

        if (!productExist) {
            return null
        }

        const result = await this.query(logger).product.update({
            where: { id: product.id, deleted: false },
            data: {
                name: product.name,
                description: product.description || productExist?.description,
                price: product.price || productExist?.price,
                image: product.image || productExist?.image,
                stock: product.stock || productExist?.stock,
                updateBy: product.username,
            },
        })

        return result as Product;
    }

    async delete(id: string, logger: HttpLogger): Promise<boolean> {
        const result = await this.query(logger).product.update({
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

    async findAll({ limit, offset, name }: IProduct, logger: HttpLogger): Promise<{ total: number, data: Product[] }> {
        try {
            const [result, total] = await this.query(logger).$transaction([
                this._prisma.product.findMany({
                    take: limit,
                    skip: offset,
                    where: { deleted: false, name: { contains: name } },
                }),
                this._prisma.product.count({ where: { deleted: false, name: { contains: name } } })
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

    async findById(id: string, logger: HttpLogger): Promise<Product | null> {
        try {
            return await this.query(logger).product.findUnique({
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