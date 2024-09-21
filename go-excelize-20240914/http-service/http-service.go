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

func HttpGetClient[TResponse any](opt *Options) (*TResponse, error) {
	u, err := url.Parse(opt.URL)
	if err != nil {
		log.Printf("Error parsing URL %s: %v\n", opt.URL, err)
		return nil, err
	}

	if opt.Param != nil {
		q := u.Query()

		for k, v := range opt.Param {
			q.Set(k, strings.Join(v, ","))
		}
		u.RawQuery = q.Encode()
	}

	req, err := http.NewRequest(http.MethodGet, u.String(), nil)
	if err != nil {
		log.Printf("Error creating request for URL %s: %v\n", opt.URL, err)
		return nil, err
	}

	if opt.headers != nil {
		for key, value := range opt.headers {
			req.Header.Set(key, value)
		}
	} else {
		req.Header.Set(keyContentType, contentTypeJSON)
	}

	if opt.Timeout == 0 {
		opt.Timeout = 30
	}

	client := &http.Client{
		Timeout: opt.Timeout * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error fetching URL %s: %v\n", opt.URL, err)
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response from URL %s: %v\n", opt.URL, err)
		return nil, err
	}

	var result TResponse
	if err := json.Unmarshal(body, &result); err != nil {
		log.Printf("Error unmarshaling response: %v\n", err)
		return nil, err
	}

	log.Println("Response: ", result)

	return &result, nil
}

func HttpPostClient[TResponse any, TBody map[string]any](url string, payload TBody, opt Options) (*TResponse, error) {
	jsonBody, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, url, strings.NewReader(string(jsonBody)))
	if err != nil {
		return nil, err
	}

	if opt.Timeout == 0 {
		opt.Timeout = 30
	}

	req.Header.Set(keyContentType, contentTypeJSON)
	client := &http.Client{
		Timeout: opt.Timeout * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result TResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}
	return &result, nil
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

func HttpPostForm[TResponse any](opt OptionPostForm) (result *TResponse, err error) {
	payload, writer, err := createMultipartPayload(opt)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, opt.URL, payload)
	if err != nil {
		log.Println("Error creating request.", err)
		return nil, err
	}
	for key, value := range opt.Headers {
		fmt.Println("Key: ", key, "Value: ", value)
		req.Header.Set(key, value)
	}
	req.Header.Set(keyContentType, writer.FormDataContentType())
	if opt.Timeout == 0 {
		opt.Timeout = 60
	}
	client := &http.Client{Timeout: opt.Timeout * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Error sending request.", err)
		return nil, err
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("Error reading response.", err)
		return nil, err
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		log.Println("Error unmarshaling response.", err)
		return nil, err
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

func MakeHTTPRequest[T any](fullUrl string, httpMethod string, headers map[string]string, queryParameters url.Values, body io.Reader) (*T, error) {
	client := http.Client{}
	u, err := url.Parse(fullUrl)
	if err != nil {
		return nil, err
	}

	// if it's a GET, we need to append the query parameters.
	if httpMethod == "GET" {
		q := u.Query()

		for k, v := range queryParameters {
			// this depends on the type of api, you may need to do it for each of v
			q.Set(k, strings.Join(v, ","))
		}
		// set the query to the encoded parameters
		u.RawQuery = q.Encode()
	}

	// regardless of GET or POST, we can safely add the body
	req, err := http.NewRequest(httpMethod, u.String(), body)
	if err != nil {
		return nil, err
	}

	// for each header passed, add the header value to the request
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	// optional: log the request for easier stack tracing
	log.Printf("%s %s\n", httpMethod, req.URL.String())

	// finally, do the request
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	if res == nil {
		return nil, fmt.Errorf("error: calling %s returned empty response", u.String())
	}

	responseData, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error calling %s:\nstatus: %s\nresponseData: %s", u.String(), res.Status, responseData)
	}

	var responseObject T
	err = json.Unmarshal(responseData, &responseObject)

	if err != nil {
		log.Printf("error unmarshaling response: %+v", err)
		return nil, err
	}

	return &responseObject, nil
}
