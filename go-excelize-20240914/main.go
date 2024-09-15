package main

import (
	"fmt"
	"log"
	"net/url"
	"os"
	"runtime"

	"github.com/joho/godotenv"
	httpservice "github.com/sing3demons/20240914/excelize/http-service"
	"github.com/sing3demons/20240914/excelize/logger"
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
	ID          string  `json:"id"`
	Href        string  `json:"href"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Image       string  `json:"image"`
	Stock       int     `json:"stock"`
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

	// httpService := httpservice.NewHttpService(3, 2)

	apiResponse, err := httpservice.HttpGetClient[ApiResponse](&httpservice.Options{
		URL:     "http://localhost:8000/api/product",
		Timeout: 10,
		Param: url.Values{
			"limit":  []string{"100"},
			"offset": []string{"0"},
		},
	})

	if err != nil {
		log.Fatalf("Error fetching URL %s: %v", "http://localhost:8000/api/product", err)
	}

	logger.Info("Data fetched successfully.")

	options := xlsx.XlsxOptions{
		FileName: "Book1.xlsx",
		// Headers:  []string{"NO", "Name", "Status", "Message"},
	}

	if len(apiResponse.Data) > 0 {
		f := xlsx.NewXlsx(apiResponse.Data, options)

		if err := f.SaveExcelFile(); err != nil {
			fmt.Println("Error saving Excel file:", err)
		}
	}
	logger.Info("Excel file saved successfully.")
}
