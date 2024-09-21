package main

import (
	"encoding/json"
	"net/http"
	"os"
	"runtime"

	"github.com/joho/godotenv"
	httpService "github.com/sing3demons/20240914/excelize/http-service"
	"github.com/sing3demons/20240914/excelize/logger"
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

	http.HandleFunc("POST /upload", func(w http.ResponseWriter, r *http.Request) {
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

	http.ListenAndServe(":8080", nil)

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
