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

type ApiResponse struct {
	Success    bool              `json:"success"`
	Message    string            `json:"message"`
	StatusCode int               `json:"statusCode"`
	Data       []ProductResponse `json:"data"`
	Total      int               `json:"total"`
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
	apiResponseProduct, _ := httpService.HttpGetClient[ApiResponse](&httpService.Options{
		URL:     "http://localhost:8000/api/product",
		Timeout: 10,
		Param: url.Values{
			"limit":  []string{"100"},
			"offset": []string{"0"},
		},
	})

	idList := []string{}
	for _, v := range apiResponseProduct.Data.Data {
		idList = append(idList, v.ID)
	}
	return idList
}

func UploadFile(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(128 * 1024)
	logger := mlog.L(r.Context())
	file, fileHeader, err := r.FormFile("file")
	if err != nil {
		logger.Error("Error parsing the file.")
		w.Write([]byte("Error parsing the file."))
		return
	}
	defer file.Close()

	apiResponse, err := httpService.HttpPostForm[any](
		httpService.OptionPostForm{
			URL: "http://localhost:8000/api/upload",
			FormFiles: []httpService.FormFile{
				{
					File:       file,
					FileHeader: fileHeader,
				},
			},
			Fields: map[string]string{
				"replaceFileName": r.FormValue("name"),
			},
		},
	)

	if err != nil {
		logger.Error("Error uploading the file.")
		w.Write([]byte("Error uploading the file."))
		return
	}

	// set json content type
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(apiResponse)
}

func main() {
	logger := logger.New()
	logger.Info("Starting the application...")

	idList := loadProducts()

	r := http.NewServeMux()

	r.HandleFunc("POST /upload", UploadFile)

	r.HandleFunc("GET /product", func(w http.ResponseWriter, r *http.Request) {
		l := mlog.L(r.Context())
		start := time.Now()
		var wg sync.WaitGroup
		responseCh := make(chan ProductResponse, len(idList))
		poolSize := 20
		semaphore := make(chan struct{}, poolSize)
		var products []ProductResponse
		for _, id := range idList {
			wg.Add(1)
			go func(id string) {
				defer wg.Done()
				semaphore <- struct{}{}
				defer func() { <-semaphore }()
				product, err := httpService.HttpGetClient[TProductResponse](&httpService.Options{
					URL:     fmt.Sprintf("http://localhost:8000/api/product/%s", id),
					Timeout: 60,
				})
				if err != nil {
					log.Println("Error on getting product", err)
					return
				}

				l.Info("Response", "product", product)

				responseCh <- product.Data.Data

			}(id)
		}

		go func() {
			wg.Wait()
			close(responseCh)
		}()
		for data := range responseCh {
			products = append(products, data)
		}
		response := map[string]any{
			"durations": fmt.Sprintf("%.2f ms", float64(time.Since(start).Milliseconds())/1000.0),
			"products":  products,
			"status":    "success",
			"total":     len(products),
		}
		SaveExcelFile(products)
		json.NewEncoder(w).Encode(response)
	})

	r.HandleFunc("GET /products", func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		var products []ProductResponse

		for _, id := range idList {
			apiResponse, err := httpService.HttpGetClient[TProductResponse](&httpService.Options{
				URL:     fmt.Sprintf("http://localhost:8000/api/product/%s", id),
				Timeout: 10,
			})

			if err != nil {
				logger.Error("Error fetching product.")
				w.Write([]byte("Error fetching product."))
				return
			}
			products = append(products, apiResponse.Data.Data)
		}

		response := map[string]any{
			"durations": fmt.Sprintf("%.2f ms", float64(time.Since(start).Milliseconds())/1000.0),
			"products":  products,
			"status":    "success",
			"total":     len(products),
		}

		SaveExcelFile(products)
		// set json content type
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
	})

	StartHttp(r, logger)
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

func AsyncHTTP(users []string) ([]string, error) {
	var wg sync.WaitGroup
	var mu sync.Mutex
	var result []string
	var err error
	for _, user := range users {
		wg.Add(1)
		go func(user string) {
			defer wg.Done()
			resp, err := http.Get("https://api.github.com/users/" + user)
			if err != nil {
				mu.Lock()
				err = fmt.Errorf("error fetching user %s: %v", user, err)
				mu.Unlock()
				return
			}
			defer resp.Body.Close()
			var data map[string]interface{}
			if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
				mu.Lock()
				err = fmt.Errorf("error decoding user %s: %v", user, err)
				mu.Unlock()
				return
			}
			mu.Lock()
			result = append(result, data["login"].(string))
			mu.Unlock()
		}(user)
	}
	wg.Wait()
	return result, err
}
