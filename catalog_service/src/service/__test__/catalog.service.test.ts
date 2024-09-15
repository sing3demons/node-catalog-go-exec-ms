import { ICatalogRepository } from "../../interface/catalog.repository.interface"
import { Product } from "../../models/product.model"
import { MockCatalogRepository } from "../../repository/mock.catalog.repository"
import { CatalogService } from "../catalog.service"
import { faker } from '@faker-js/faker'
import { Factory } from 'rosie'

const productFactory = new Factory<Product>()
    .attr('id', faker.string.uuid())
    .attr('name', faker.commerce.productName())
    .attr('description', faker.commerce.productDescription())
    .attr('price', +faker.commerce.price())
    .attr('image', faker.image.url())
    .attr('stock', faker.number.int({ min: 1, max: 100 }))


const mockProduct = (rest: any) => {
    return {
        // name: faker.commerce.productName(),
        // description: faker.commerce.productDescription(),
        // price: +faker.commerce.price(),
        // image: faker.image.url(),
        // stock: faker.number.int({ min: 1, max: 100 }),
        ...rest
    }
}
describe('catalogService', () => {
    let repository: ICatalogRepository

    beforeEach(() => {
        repository = new MockCatalogRepository()
    })

    afterEach(() => {
        repository = {} as ICatalogRepository
    })

    describe('createProduct', () => {
        it('should create product', async () => {
            const mockData = mockProduct({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                price: +faker.commerce.price(),
                image: faker.image.url(),
                stock: faker.number.int({ min: 1, max: 100 }),
            })
            const service = new CatalogService(repository)
            const result = await service.createProduct(mockData)
            expect(result.statusCode).toEqual(20100)

        })
    })

    describe('updateProduct', () => {
        test('should update product', async () => {
            const reqBody = mockProduct({
                id: faker.string.uuid(),
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                price: +faker.commerce.price(),
                image: faker.image.url(),
                stock: faker.number.int({ min: 1, max: 100 }),
            })

            jest.spyOn(repository, 'update').mockImplementationOnce(() => Promise.resolve(reqBody))

            const service = new CatalogService(repository)
            const result = await service.update(reqBody)
            expect(result.statusCode).toEqual(20000)
        })
    })

    describe('getAllProducts', () => {
        test('should get products by offset and limit', async () => {
            const reqBody = {
                limit: faker.number.int({ min: 1, max: 100 }),
                offset: faker.number.int({ min: 1, max: 100 })
            }

            const products = productFactory.buildList(reqBody.limit)
            jest.spyOn(repository, 'findAll').mockImplementationOnce(() => Promise.resolve({ total: reqBody.limit, data: products }))

            const service = new CatalogService(repository)
            const result = await service.findAll(reqBody)
            expect(result.data?.length).toEqual(reqBody.limit)
        })
    })

    describe('getProductById', () => {
        test('should get product by id', async () => {
            const reqBody = {
                id: faker.string.uuid()
            }

            const product = productFactory.build()
            jest.spyOn(repository, 'findById').mockImplementationOnce(() => Promise.resolve(product))

            const service = new CatalogService(repository)
            const result = await service.findById(reqBody.id)
            expect(result.statusCode).toBe(20000)

        })

        test('should throw error when product not found', async () => {
            const reqBody = {
                id: faker.string.uuid()
            }

            jest.spyOn(repository, 'findById').mockImplementationOnce(() => Promise.reject(new Error('product not found')))

            const service = new CatalogService(repository)
            await expect(service.findById(reqBody.id)).rejects.toThrow('product not found')
        })
    })

    describe('deleteProduct', () => {
        test('should delete product by id', async () => {
            const reqBody = {
                id: faker.string.uuid()
            }

            jest.spyOn(repository, 'delete').mockImplementationOnce(() => Promise.resolve(true))

            const service = new CatalogService(repository)
            const result = await service.delete(reqBody.id)
            expect(result.statusCode).toEqual(20000)
        })

        test('should throw error when product not found', async () => {
            const reqBody = {
                id: faker.string.uuid()
            }

            jest.spyOn(repository, 'delete').mockImplementationOnce(() => Promise.reject(new Error('product not found')))

            const service = new CatalogService(repository)
            await expect(service.delete(reqBody.id)).rejects.toThrow('product not found')
        })
    })


})