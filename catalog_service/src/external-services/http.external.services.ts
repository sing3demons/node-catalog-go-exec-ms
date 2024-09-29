import axios, { AxiosRequestConfig, AxiosResponse, AxiosBasicCredentials, AxiosError } from 'axios'
import axiosRetry from 'axios-retry'
import https from 'https'
import { logger as Logger } from '../logger'
import { v7 as uuid } from 'uuid'
import { Request } from 'express'

type ConfigService = {
    endpoint: string
    timeout?: number
    headers?: Record<string, string>
    auth?: AxiosBasicCredentials
    retries?: number
    httpsAgent?: https.AgentOptions
}

type HttpResponse<T> = {
    err: boolean
    data: T,
    status: number,
    message: string
}

type HttpServiceOptions = {
    headers?: Record<string, string>
    req?: Request
    auth?: AxiosBasicCredentials
}

export class HttpService {
    constructor(
        private readonly configService: ConfigService,
        private readonly _logger = Logger
    ) { }
    async get<TParams, TResponse>(data: TParams, option: HttpServiceOptions, transactionId: string = `${uuid()}`): Promise<HttpResponse<TResponse>> {
        const result: HttpResponse<TResponse> = {
            err: true,
            data: {} as TResponse,
            status: 500,
            message: ''
        }
        const logger = this._logger.child({ transactionId: option.req?.headers['x-transaction-id'] || transactionId })
        if (this.configService.retries) {
            axiosRetry(axios, {
                retries: this.configService.retries,
                retryDelay: (retryCount) => {
                    logger.error(`Retry attempt: ${retryCount}`)
                    return retryCount * 1000; // Time in ms, e.g., 1000ms = 1s
                },
                retryCondition: (error) => {
                    logger.error(`Retry condition: ${error.code} ${error.response?.status} ${error.response?.data}`)
                    return error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.response?.status === 429 || error.response?.status === 503
                },
            })
        }
        const config: AxiosRequestConfig<TParams> = {
            method: 'get',
            headers: this.configService.headers ? this.configService.headers : option.headers || {},
            auth: this.configService.auth || option.auth,
            timeout: this.configService.timeout,
            params: data,
            httpsAgent: this.configService.httpsAgent ? new https.Agent(this.configService.httpsAgent) : {},
        }
        if (config.auth && Object.keys(config.auth).length === 0) {
            delete config.auth
        }
        if (!this.configService.timeout) {
            delete config.timeout
        }

        if (config?.headers && Object.keys(config.headers).length === 0) {
            delete config.headers
        }

        if (!this.configService.httpsAgent) {
            delete config.httpsAgent
        }

        logger.info(config, `config axios`)
        try {
            const response = await axios.request<TParams, AxiosResponse<TResponse, TResponse>, TParams>(config)
            logger.info(response, `response axios`)
            result.err = false
            result.data = response.data
            result.status = response.status
            return result
        } catch (error) {
            if (error instanceof AxiosError) {
                logger.error(error, `AxiosError`)
                result.err = true
                result.message = error.message
                result.status = error.response?.status || 500
                result.data = error.response?.data || {} as TResponse

            } else if (error instanceof Error) {
                logger.error(error, `Error`)
                result.err = true
                result.message = error.message

            } else {
                logger.error(error, `error`)
                result.err = true
                result.message = 'unknown error'
            }
            return result
        }
    }

    async post<TBody, TResponse>(data: TBody, option: HttpServiceOptions, transactionId: string = `${uuid()}`): Promise<HttpResponse<TResponse>> {
        const result: HttpResponse<TResponse> = {
            err: true,
            data: {} as TResponse,
            status: 500,
            message: ''
        }

        const logger = this._logger.child({ transactionId: option.req?.headers['x-transaction-id'] || transactionId })


        if (this.configService.retries) {
            axiosRetry(axios, {
                retries: this.configService.retries,
                retryDelay: (retryCount) => {
                    logger.error(`Retry attempt: ${retryCount}`)
                    return retryCount * 1000;
                },
                retryCondition: (error) => {
                    logger.error(error, `Retry condition`)
                    return error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.response?.status === 429 || error.response?.status === 503
                },
            })
        }
        const config: AxiosRequestConfig<TBody> = {
            method: 'post',
            url: this.configService.endpoint,
            headers: this.configService.headers ? this.configService.headers : option.headers || {},
            auth: this.configService.auth,
            timeout: this.configService.timeout,
            data,
            httpsAgent: this.configService.httpsAgent ? new https.Agent(this.configService.httpsAgent) : {},
        }
        if (!this.configService.auth) {
            delete config.auth
        }
        if (!this.configService.timeout) {
            delete config.timeout
        }

        if (config?.headers && Object.keys(config.headers).length === 0) {
            delete config.headers
        }

        if (!this.configService.httpsAgent) {
            delete config.httpsAgent
        }

        logger.info(config, `config axios`)
        try {
            const response = await axios.request<TBody, AxiosResponse<TResponse, TResponse>, TBody>(config)
            logger.info(response, `response axios`)
            result.err = false
            result.data = response.data
            result.status = response.status
            return result
        } catch (error) {
            console.error('===================>', error)
            if (error instanceof AxiosError) {
                logger.error(error, `AxiosError`)
                result.err = true
                result.message = error.message
                result.status = error.response?.status || 500
                result.data = error.response?.data || {} as TResponse

            } else if (error instanceof Error) {
                logger.error(error, `Error`)
                result.err = true
                result.message = error.message

            } else {
                logger.error(error, `error`)
                result.err = true
                result.message = 'unknown error'
            }
            return result
        }
    }
}
