package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	httpService "github.com/sing3demons/20240914/excelize/http-service"
	"github.com/sing3demons/20240914/excelize/logger"
	"github.com/sing3demons/20240914/excelize/mlog"
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
}

func main() {
	logger := logger.New()
	logger.Info("Starting the application...")

	r := http.NewServeMux()

	
	r.HandleFunc("POST /upload", func(w http.ResponseWriter, r *http.Request) {
		r.ParseMultipartForm(128 * 1024)
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
	})

	var wait time.Duration
	srv := &http.Server{
		Addr:         ":8080",
		Handler:      mlog.M(r, logger),
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
	log.Println("server exiting")
	// apiResponse, err := http_service.HttpGetClient[ApiResponse](&http_service.Options{
	// 	URL:     "http://localhost:8000/api/product",
	// 	Timeout: 10,
	// 	Param: url.Values{
	// 		"limit":  []string{"100"},
	// 		"offset": []string{"0"},
	// 	},
	// })

	// // apiResponse, err := http_service.HttpPostClient[ApiResponse]("http://localhost:8000/api/upload")

	// if err != nil {
	// 	log.Fatalf("Error fetching URL %s: %v", "http://localhost:8000/api/product", err)
	// }

	// logger.Info("Data fetched successfully.")

	// options := xlsx.XlsxOptions{
	// 	FileName: "Book1.xlsx",
	// 	Headers:  []string{"ID", "Name", "Description", "Price", "Image", "Stock"},
	// }

	// if len(apiResponse.Data) > 0 {
	// 	f := xlsx.NewXlsx(apiResponse.Data, options)

	// 	if err := f.SaveExcelFile(); err != nil {
	// 		fmt.Println("Error saving Excel file:", err)
	// 	}
	// }
	// logger.Info("Excel file saved successfully.")
}
