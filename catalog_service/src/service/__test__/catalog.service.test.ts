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
const p = productFactory.build()

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
            expect(result).toEqual({
                id: expect.any(String),
                name: expect.any(String),
                description: expect.any(String),
                price: expect.any(Number),
                image: expect.any(String),
                stock: expect.any(Number),
            })

        })

        test('should throw error when unable to create product', async () => {
            const reqBody = mockProduct({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                price: +faker.commerce.price(),
                image: faker.image.url(),
                stock: faker.number.int({ min: 1, max: 100 }),
            })

            jest.spyOn(repository, 'create').mockImplementationOnce(() => Promise.resolve({} as Product))

            const service = new CatalogService(repository)
            await expect(service.createProduct(reqBody)).rejects.toThrow('unable to create product')
        })

        test('should throw error when product already exists', async () => {
            const reqBody = mockProduct({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                price: +faker.commerce.price(),
                image: faker.image.url(),
                stock: faker.number.int({ min: 1, max: 100 }),
            })

            jest.spyOn(repository, 'create').mockImplementationOnce(() => Promise.reject(new Error('product already exists')))

            const service = new CatalogService(repository)
            await expect(service.createProduct(reqBody)).rejects.toThrow('product already exists')
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
            expect(result).toEqual(reqBody)
        })

        test('should throw error when product not found', async () => {
            const reqBody = mockProduct({
                id: faker.string.uuid(),
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                price: +faker.commerce.price(),
                image: faker.image.url(),
                stock: faker.number.int({ min: 1, max: 100 }),
            })

            jest.spyOn(repository, 'update').mockImplementationOnce(() => Promise.reject(new Error('product not found')))

            const service = new CatalogService(repository)
            await expect(service.update(reqBody)).rejects.toThrow('product not found')
        })

        test('should throw error when product already exists', async () => {
            const service = new CatalogService(repository)

            jest.spyOn(repository, 'update')
                .mockImplementationOnce(() => Promise.reject(new Error('product already exists')))

            await expect(service.update({} as Product)).rejects.toThrow('product already exists')
        })
    })

    describe('getAllProducts', () => {
        test('should get products by offset and limit', async () => {
            const reqBody = {
                limit: faker.number.int({ min: 1, max: 100 }),
                offset: faker.number.int({ min: 1, max: 100 })
            }

            const products = productFactory.buildList(reqBody.limit)
            jest.spyOn(repository, 'findAll').mockImplementationOnce(() => Promise.resolve(products))

            const service = new CatalogService(repository)
            const result = await service.findAll(reqBody)
            expect(result.length).toEqual(reqBody.limit)
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
            expect(result).toEqual(product)

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

            jest.spyOn(repository, 'delete').mockImplementationOnce(() => Promise.resolve())

            const service = new CatalogService(repository)
            const result = await service.delete(reqBody.id)
            expect(result).toBeUndefined()
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