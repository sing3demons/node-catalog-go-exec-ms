import { ICatalogRepository } from "../../interface/catalog.repository.interface"
import { MockCatalogRepository } from "../../repository/mock.catalog.repository"
import { CatalogService } from "../catalog.service"

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
            const mockData = {
                name: 'iPhone 16',
                description: 'smartphone',
                price: 100000,
                image: 'image 1',
                stock: 10,
            }
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
    })


})