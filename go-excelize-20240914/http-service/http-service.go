package http_service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type httpServiceConfig struct {
	retries int
	delay   time.Duration
}

type Result[T any] struct {
	URL      string
	Response T
	Error    error
}

func NewHttpService(retries, delay int) httpServiceConfig {
	if retries < 0 {
		retries = 3
	}

	if delay < 0 {
		delay = 2
	}

	return httpServiceConfig{
		retries: retries,
		delay:   time.Duration(delay) * time.Second,
	}
}

func (h httpServiceConfig) FetchData(url string) Result[string] {
	var response Result[string]
	response.URL = url
	for i := 0; i <= h.retries; i++ {
		httpClient := &http.Client{
			Timeout: 10 * time.Second,
		}
		req, err := http.NewRequest(http.MethodGet, url, nil)
		if err != nil {
			log.Printf("Error fetching URL %s: %v (Attempt %d/%d)\n", url, err, i+1, h.retries+1)
			time.Sleep(h.delay)
			continue
		}

		req.Header.Set("Content-Type", "application/json")

		resp, err := httpClient.Do(req)
		if err != nil {
			log.Printf("Error fetching URL %s: %v (Attempt %d/%d)\n", url, err, i+1, h.retries+1)
			time.Sleep(h.delay)
			continue
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			log.Printf("Error reading response from URL %s: %v (Attempt %d/%d)\n", url, err, i+1, h.retries+1)
			time.Sleep(h.delay)
			continue
		}

		response.Response = string(body)

		return response
	}

	response.Error = fmt.Errorf("failed to fetch URL %s after %d attempts", url, h.retries+1)

	return response
}

const (
	keyContentType  = "Content-Type"
	contentTypeJSON = "application/json"
)

type Options struct {
	URL     string
	Timeout time.Duration
	Param   url.Values
	headers map[string]string
}

type FormFile struct {
	Name       string
	File       multipart.File
	FileHeader *multipart.FileHeader
}

type FormFields map[string]string

type OptionPostForm struct {
	URL       string
	Timeout   time.Duration
	FormFiles []FormFile
	Fields    FormFields
	Headers   map[string]string
}

type HttpResponse[T any] struct {
	StatusCode  int    `json:"statusCode"`
	Message     string `json:"message"`
	Description string `json:"description"`
	Data        T      `json:"data"`
}

func HttpGetClient[TResponse any](opt *Options) (result HttpResponse[*TResponse], err error) {
	result.StatusCode = http.StatusInternalServerError

	u, err := url.Parse(opt.URL)
	if err != nil {
		return handleError(result, fmt.Sprintf("Error parsing URL %s: %v\n", opt.URL, err), err)
	}

	addQueryParams(u, opt.Param)

	req, err := http.NewRequest(http.MethodGet, u.String(), nil)
	if err != nil {
		return handleError(result, fmt.Sprintf("Error creating request for URL %s: %v\n", opt.URL, err), err)
	}

	setHeaders(req, opt.headers)

	if opt.Timeout == 0 {
		opt.Timeout = 30
	}

	// Create a reusable HTTP client with connection pooling
	client := &http.Client{
		Timeout: opt.Timeout * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 100,
			IdleConnTimeout:     90 * time.Second,
		},
	}

	resp, err := client.Do(req)
	if err != nil {
		return handleError(result, fmt.Sprintf("Error fetching URL %s: %v\n", opt.URL, err), err)
	}
	defer resp.Body.Close()

	return handleResponse(resp, result, opt.URL)
}

func handleError[TResponse any](result HttpResponse[*TResponse], message string, err error) (HttpResponse[*TResponse], error) {
	log.Println(message, err)
	result.Message = err.Error()
	return result, err
}

func addQueryParams(u *url.URL, params url.Values) {
	if params != nil {
		q := u.Query()
		for k, v := range params {
			q.Set(k, strings.Join(v, ","))
		}
		u.RawQuery = q.Encode()
	}
}

func setHeaders(req *http.Request, headers map[string]string, defaultContentType ...string) {
	if len(defaultContentType) > 0 {
		req.Header.Set(keyContentType, defaultContentType[0])

	} else {
		req.Header.Set(keyContentType, contentTypeJSON)
	}

	for key, value := range headers {
		req.Header.Set(key, value)
	}

}

func handleResponse[TResponse any](resp *http.Response, result HttpResponse[*TResponse], url string) (HttpResponse[*TResponse], error) {
	result.StatusCode = resp.StatusCode
	result.Message = resp.Status

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return handleError(result, fmt.Sprintf("Error reading response from URL %s: %v\n", url, err), err)
	}

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		result.Description = "Success"
	} else {
		result.Description = string(respBody)
	}

	if err := json.Unmarshal(respBody, &result.Data); err != nil {
		return handleError(result, fmt.Sprintf("Error unmarshaling response: %v\n", err), err)
	}
	return result, nil
}

func HttpPostClient[TResponse any, TBody any](url string, payload TBody, opt Options) (result HttpResponse[*TResponse]) {
	result.StatusCode = http.StatusInternalServerError
	jsonBody, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling payload: %v\n", err)
		result.Message = err.Error()
		return result
	}

	req, err := http.NewRequest(http.MethodPost, url, strings.NewReader(string(jsonBody)))
	if err != nil {
		log.Printf("Error creating request for URL %s: %v\n", url, err)
		result.Message = err.Error()
		return result
	}

	if opt.Timeout == 0 {
		opt.Timeout = 30
	}

	setHeaders(req, opt.headers)

	client := &http.Client{
		Timeout: opt.Timeout * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending request to URL %s: %v\n", url, err)
		result.Message = err.Error()
		return result
	}
	defer resp.Body.Close()
	result.StatusCode = resp.StatusCode
	result.Message = resp.Status
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response from URL %s: %v\n", url, err)
		result.Message = err.Error()
		return result
	}

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		result.Description = "Success"
	} else {
		result.Description = string(body)
	}

	if err := json.Unmarshal(body, &result.Data); err != nil {
		log.Printf("Error unmarshaling response: %v\n", err)
		result.Message = err.Error()
		result.Data = nil
		return result
	}
	return result
}

func HttpPostForm[TResponse any](opt OptionPostForm) (result HttpResponse[*TResponse], err error) {
	payload, writer, err := createMultipartPayload(opt)
	if err != nil {
		result.StatusCode = http.StatusInternalServerError
		result.Message = err.Error()
		return result, err
	}

	req, err := http.NewRequest(http.MethodPost, opt.URL, payload)
	if err != nil {
		log.Println("Error creating request.", err)
		result.StatusCode = http.StatusInternalServerError
		result.Message = err.Error()
		return result, err
	}

	setHeaders(req, opt.Headers, writer.FormDataContentType())

	if opt.Timeout == 0 {
		opt.Timeout = 60
	}
	client := &http.Client{Timeout: opt.Timeout * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		result.StatusCode = http.StatusInternalServerError
		result.Message = err.Error()
		log.Println("Error sending request.", err)
		return result, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("Error reading response.", err)
		result.StatusCode = http.StatusInternalServerError
		result.Message = err.Error()
		return result, err
	}

	result.StatusCode = resp.StatusCode
	result.Message = resp.Status
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		result.Description = "Success"
	} else {
		result.Description = string(respBody)
	}

	if err := json.Unmarshal(respBody, &result.Data); err != nil {
		log.Println("Error unmarshaling response.", err)
		result.Data = nil
		return result, err
	}
	return result, nil
}

func createMultipartPayload(opt OptionPostForm) (*bytes.Buffer, *multipart.Writer, error) {
	payload := new(bytes.Buffer)
	writer := multipart.NewWriter(payload)
	for _, formFile := range opt.FormFiles {
		if formFile.Name == "" {
			formFile.Name = "file"
		}
		part, err := writer.CreateFormFile(formFile.Name, formFile.FileHeader.Filename)
		if err != nil {
			log.Println("Error creating form file.", err)
			return nil, nil, err
		}
		_, err = io.Copy(part, formFile.File)
		if err != nil {
			log.Println("Error copying file.", err)
			return nil, nil, err
		}
		defer formFile.File.Close()
	}
	for key, value := range opt.Fields {
		if err := writer.WriteField(key, value); err != nil {
			log.Println("Error writing field.", err)
			return nil, nil, err
		}
	}
	if err := writer.Close(); err != nil {
		log.Println("Error closing writer.", err)
		return nil, nil, err
	}
	return payload, writer, nil
}
