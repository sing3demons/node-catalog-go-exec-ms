package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	httpService "github.com/sing3demons/20240914/excelize/http-service"
	"github.com/sing3demons/20240914/excelize/logger"
	"github.com/sing3demons/20240914/excelize/mlog"
	"github.com/sing3demons/20240914/excelize/xlsx"
)

type Data struct {
	NO      int    `json:"NO"`
	Name    string `json:"Name"`
	Status  string `json:"Status"`
	Message string `json:"Message"`
}

type P struct {
	ID          string  `json:"id"`
	Href        string  `json:"href"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Image       string  `json:"image"`
	Stock       int     `json:"stock"`
}

type ProductResponse struct {
	ID          string  `json:"ID"`
	Href        string  `json:"href"`
	Name        string  `json:"Name"`
	Description string  `json:"Description"`
	Price       float64 `json:"Price"`
	Image       string  `json:"Image"`
	Stock       int     `json:"Stock"`
}

type DataProducts struct {
	Description string  `json:"description"`
	Href        string  `json:"href"`
	ID          string  `json:"id"`
	Image       string  `json:"image"`
	Name        string  `json:"name"`
	Price       float64 `json:"price"`
	Stock       int     `json:"stock"`
}  

type ApiResponse[T any] struct {
	Success    bool   `json:"success"`
	Message    string `json:"message"`
	StatusCode int    `json:"statusCode"`
	Data       T      `json:"data"`
	Total      int    `json:"total"`
}

func init() {
	if os.Getenv("ENV_MODE") != "production" {
		if err := godotenv.Load(".env.dev"); err != nil {
			panic(err)
		}
	}

	if runtime.GOOS != "windows" {
		temp := "/tmp/live"
		_, err := os.Create(temp)
		if err != nil {
			os.Exit(1)
		}
		defer os.Remove(temp)
	}

	ict, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		panic(err)
	}

	time.Local = ict
}

type TProductResponse struct {
	Data ProductResponse `json:"data"`
}

func loadProducts() []string {
	apiResponseProduct, _ := httpService.HttpGetClient[ApiResponse[[]ProductResponse]](&httpService.Options{
		URL:     "http://localhost:8000/api/product",
		Timeout: 10,
		Param: url.Values{
			"limit":  []string{"1000"},
			"offset": []string{"0"},
		},
	})

	idList := []string{}
	for _, v := range apiResponseProduct.Data.Data {
		idList = append(idList, v.ID)
	}
	return idList
}

type UploadFileBody struct {
	Success    bool   `json:"success"`
	Message    string `json:"message"`
	StatusCode int    `json:"statusCode"`
	Data       struct {
		ID       string `json:"id"`
		Href     string `json:"href"`
		FileName string `json:"fileName"`
		FilePath string `json:"filePath"`
		Mimetype string `json:"mimetype"`
		Size     int    `json:"size"`
	} `json:"data"`
}

type CreateProductResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Price       int    `json:"price"`
		Stock       int    `json:"stock"`
		Description string `json:"description"`
		Image       string `json:"image"`
	} `json:"data"`
	StatusCode int `json:"statusCode"`
}

type ProductHandler struct {
}

func (p *ProductHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(128 * 1024)
	logger := mlog.L(r.Context())
	file, fileHeader, err := r.FormFile("file")
	if err != nil {
		logger.Error("error parsing the file.", "error", err)
		p.ResponseJson(w, map[string]string{"message": "Error parsing the file"}, http.StatusBadRequest)
		return
	}
	defer file.Close()

	apiResponse := httpService.HttpPostForm[UploadFileBody](
		httpService.OptionPostForm{
			URL: "http://localhost:8001/api/upload",
			FormFiles: []httpService.FormFile{
				{
					File:       file,
					FileHeader: fileHeader,
				},
			},
			Fields: map[string]string{
				"replaceFileName": r.FormValue("name"),
				"filePath":        r.FormValue("subfolder"),
			},
		},
	)

	p.ResponseJson(w, apiResponse, http.StatusOK)
}

func (p *ProductHandler) ResponseJson(w http.ResponseWriter, data interface{}, code int) {
	w.Header().Set(httpService.ContentType, httpService.ContentTypeJSON)
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(data)
}

type TCreateProduct struct {
	Name        string  `json:"name"`
	Price       float64 `json:"price"`
	Description string  `json:"description"`
	Image       string  `json:"image"`
	Stock       int     `json:"stock"`
}

func (p *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(128 * 1024)
	logger := mlog.L(r.Context())
	file, fileHeader, err := r.FormFile("file")
	if err != nil {
		logger.Error("Error parsing the file.")
		p.ResponseJson(w, map[string]string{
			"message": "Error parsing the file",
		}, http.StatusBadRequest)
		return
	}
	defer file.Close()

	apiResponse := httpService.HttpPostForm[UploadFileBody](
		httpService.OptionPostForm{
			URL: "http://localhost:8001/api/upload",
			FormFiles: []httpService.FormFile{
				{
					File:       file,
					FileHeader: fileHeader,
				},
			},
			Fields: map[string]string{
				"replaceFileName": r.FormValue("name"),
				"filePath":        "products",
			},
		},
	)

	price, _ := strconv.ParseFloat(r.FormValue("price"), 64)
	stock, _ := strconv.Atoi(r.FormValue("stock"))
	payload := TCreateProduct{
		Name:        r.FormValue("name"),
		Price:       price,
		Description: r.FormValue("description"),
		Image:       strings.Replace(apiResponse.Data.Data.Href, "{BASE_URL}", "http://localhost:8001", 1),
		Stock:       stock,
	}
	apiCreate := httpService.HttpPostClient[CreateProductResponse]("http://localhost:8000/api/product", payload, httpService.Options{})

	// set json content type
	logger.Info("Product created successfully.", "product", apiCreate)
	p.ResponseJson(w, apiCreate.Data, http.StatusOK)

}

func (p *ProductHandler) GetProductMulti(r *http.Request, idList []string) []ProductResponse {
	l := mlog.L(r.Context())

	const poolSize = 100   // Number of concurrent workers
	const batchSize = 1000 // Process requests in batches to avoid overwhelming system resources

	var wg sync.WaitGroup
	semaphore := make(chan struct{}, poolSize)
	responseCh := make(chan ProductResponse, batchSize)
	var products []ProductResponse

	// Function to process a batch of requests
	processBatch := func(batch []string) {
		for _, id := range batch {
			wg.Add(1)
			go func(id string) {
				defer wg.Done()
				semaphore <- struct{}{} // Limit concurrency
				defer func() { <-semaphore }()

				// HTTP request to fetch product data
				product, err := httpService.HttpGetClient[TProductResponse](&httpService.Options{
					URL:     fmt.Sprintf("http://localhost:8000/api/product/%s", id),
					Timeout: 60,
				})
				if err != nil {
					l.Error("Error fetching product", "id", id, "error", err)
					return
				}

				// Log product response
				l.Info("Received product", "id", id, "product", product)

				// Send product response to channel
				responseCh <- product.Data.Data
			}(id)
		}
	}

	// Batch processing to limit memory consumption
	for i := 0; i < len(idList); i += batchSize {
		end := i + batchSize
		if end > len(idList) {
			end = len(idList)
		}
		processBatch(idList[i:end])
	}

	// Wait for all goroutines to finish and close the channel
	go func() {
		wg.Wait()
		close(responseCh)
	}()

	// Collect product responses
	for data := range responseCh {
		products = append(products, data)
	}
	return products
}

type AutoGenerated struct {
	Data DataProducts`json:"data"`
	Message    string `json:"message"`
	StatusCode int    `json:"statusCode"`
	Success    bool   `json:"success"`
}

func main() {
	logger := logger.New()
	logger.Info("Starting the application...")

	idList := loadProducts()

	r := http.NewServeMux()
	h := &ProductHandler{}

	r.HandleFunc("POST /upload", h.UploadFile)
	r.HandleFunc("POST /product", h.CreateProduct)
	r.HandleFunc("GET /product", func(w http.ResponseWriter, r *http.Request) {
		start := time.Now().UnixMilli()
		products := h.GetProductMulti(r, idList)
		h.ResponseProducts(w, products, start)
	})

	r.HandleFunc("GET /products", func(w http.ResponseWriter, r *http.Request) {
		start := time.Now().UnixMilli()
		// var products []ProductResponse

		apiResponse, err := AsyncHTTP[AutoGenerated](idList)
		if err != nil {
			logger.Error("Error fetching product.")
			w.Write([]byte("Error fetching product."))
			return
		}

		// for _, v := range apiResponse {
		// 	products = append(products, v.Data)
		// }

		// for _, id := range idList {
		// 	apiResponse, err := httpService.HttpGetClient[TProductResponse](&httpService.Options{
		// 		URL:     fmt.Sprintf("http://localhost:8000/api/product/%s", id),
		// 		Timeout: 10,
		// 	})

		// 	if err != nil {
		// 		logger.Error("Error fetching product.")
		// 		w.Write([]byte("Error fetching product."))
		// 		return
		// 	}
		// 	logger.Info("Received product", "id", id, "product", apiResponse.Data.Data)
		// 	products = append(products, apiResponse.Data.Data)
		// }

		// h.ResponseProducts(w, products, start)
		logger.Info("Received product", "product", apiResponse)
		fmt.Println(fmt.Sprintf("%.2f ms", float64(time.Now().UnixMilli()-start)/1000))
		h.ResponseJson(w, apiResponse, http.StatusOK)
	})

	StartHttp(r, logger)
}

func (p *ProductHandler) ResponseProducts(w http.ResponseWriter, products []ProductResponse, start int64) {
	response := map[string]any{
		"durations": fmt.Sprintf("%.2f ms", float64(time.Now().UnixMilli()-start)/1000),
		"products":  products,
		"status":    "success",
		"total":     len(products),
	}

	SaveExcelFile(products)
	p.ResponseJson(w, response, http.StatusOK)
}

func StartHttp(r *http.ServeMux, logger *slog.Logger) {
	var wait time.Duration
	srv := &http.Server{
		Addr:         ":8080",
		Handler:      mlog.MLog(r, logger),
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 60 * time.Second,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil {
			log.Fatalf("error starting server, %s", err)
		}
	}()
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), wait)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("server forced to shutdown: ", err)
	}
	logger.Info("server exiting")
}

func SaveExcelFile(products []ProductResponse) {
	options := xlsx.XlsxOptions{
		FileName: "Book1.xlsx",
		Headers:  []string{"ID", "Name", "Description", "Price", "Image", "Stock"},
	}

	if len(products) > 0 {
		f := xlsx.NewXlsx(products, options)
		if err := f.SaveExcelFile(); err != nil {
			fmt.Println("Error saving Excel file:", err)
		}
	}
}

func AsyncHTTP[T any](users []string) ([]T, error) {
	// TProductResponse
	var wg sync.WaitGroup
	results := make([]T, len(users))
	errors := make(chan error, len(users))
	resultChan := make(chan T, len(users))
	// Worker Pool Size
	const MaxWorkers = 100

	// Create worker pool
	workerSem := make(chan struct{}, MaxWorkers)

	for i, id := range users {
		wg.Add(1)
		workerSem <- struct{}{} // Block if too many goroutines

		go func(i int, id string) {
			defer wg.Done()
			fetchProduct(id, resultChan, errors)
			<-workerSem // Release the worker slot
		}(i, id)
	}

	// Wait for all requests to complete
	go func() {
		wg.Wait()
		close(resultChan)
		close(errors)
	}()

	// Collect results
	for result := range resultChan {
		results = append(results, result)
	}

	// Handle errors if any
	if len(errors) > 0 {
		return nil, <-errors
	}
	return results, nil
}

func fetchProduct[T any](id string, results chan<- T, errors chan<- error) {
	apiResponse, err := httpService.HttpGetClient[T](&httpService.Options{
		URL:     fmt.Sprintf("http://localhost:8000/api/product/%s", id),
		Timeout: 10,
	})

	if err != nil {
		errors <- err
		return
	}

	results <- *apiResponse.Data
}
