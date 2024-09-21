package main

import (
	"encoding/json"
	"net/http"
	"os"
	"runtime"

	"github.com/joho/godotenv"
	http_service "github.com/sing3demons/20240914/excelize/http-service"
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
		logger.Info("Upload file endpoint hit.")
		r.ParseMultipartForm(128 * 1024)
		file, fileHeader, err := r.FormFile("file")
		if err != nil {
			logger.Error("Error parsing the file.")
			w.Write([]byte("Error parsing the file."))
			return
		}
		defer file.Close()

		opt := http_service.OptionPostForm{
			FormFiles: []http_service.FormFile{
				{
					File:       file,
					FileHeader: fileHeader,
				},
			},
			Fields: map[string]string{
				"replaceFileName": r.FormValue("name"),
			},
		}
		apiResponse, err := http_service.HttpPostForm[any](
			"http://localhost:8000/api/upload",
			opt,
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

		// payload := new(bytes.Buffer)
		// writer := multipart.NewWriter(payload)

		// part, err := writer.CreateFormFile("file", fileHeader.Filename)
		// if err != nil {
		// 	w.WriteHeader(http.StatusInternalServerError)
		// 	w.Write([]byte("Error creating form file"))
		// 	return
		// }

		// // Copy the file to the multipart form writer
		// _, err = io.Copy(part, file)
		// if err != nil {
		// 	w.WriteHeader(http.StatusInternalServerError)
		// 	w.Write([]byte("Error copying file"))
		// 	return
		// }

		// // replaceFileName
		// replaceFileName := r.FormValue("name")
		// if replaceFileName != "" {

		// 	writer.WriteField("replaceFileName", replaceFileName)
		// }

		// // Close the writer to finalize the multipart form
		// err = writer.Close()
		// if err != nil {
		// 	w.WriteHeader(http.StatusInternalServerError)
		// 	w.Write([]byte("Error closing form"))
		// 	return
		// }
		// req, err := http.NewRequest(http.MethodPost, "http://localhost:8000/api/upload", payload)
		// if err != nil {
		// 	logger.Error("Error creating request.")
		// 	w.Write([]byte("Error creating request."))
		// 	return
		// }

		// req.Header.Set("Content-Type", writer.FormDataContentType())

		// client := &http.Client{
		// 	Timeout: 60 * time.Second,
		// }

		// resp, err := client.Do(req)
		// if err != nil {
		// 	logger.Error("Error uploading the file.")
		// 	w.Write([]byte("Error uploading the file."))
		// 	return
		// }

		// defer resp.Body.Close()

		// respBody, err := io.ReadAll(resp.Body)
		// if err != nil {
		// 	logger.Error("Error reading the response body.")
		// 	w.Write([]byte("Error reading the response body."))
		// 	return
		// }

		// set json content type
		// w.Header().Set("Content-Type", "application/json")
		// w.WriteHeader(resp.StatusCode)
		// w.Write(respBody)
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
