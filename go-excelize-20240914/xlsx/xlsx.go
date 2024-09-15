package xlsx

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/xuri/excelize/v2"
)

type XlsxOptions struct {
	FileName string
	Headers  []string
	Sheet    string
}

type Xlsx struct {
	file      *excelize.File
	data      []map[string]any
	headers   []string
	sheetName string
	fileName  string
}

func NewXlsx[T any](tData []T, opt XlsxOptions) *Xlsx {
	f := excelize.NewFile()

	headers := opt.Headers

	sheetName := opt.Sheet
	if sheetName == "" {
		sheetName = "Sheet1"
	}

	data, err := convertToMapSlice(tData)
	if err != nil {
		fmt.Println("Error converting to map slice:", err)
	}

	if len(headers) == 0 {
		for k := range data[0] {
			headers = append(headers, k)
		}
	}

	return &Xlsx{
		f,
		data,
		headers,
		sheetName,
		opt.FileName,
	}
}

func (f *Xlsx) RemoveExistingFile() error {
	if _, err := os.Stat(f.fileName); err == nil {
		if err := os.Remove(f.fileName); err != nil {
			return fmt.Errorf("failed to remove existing file: %v", err)
		}
	}
	return nil
}

func (f *Xlsx) SaveExcelFile() error {
	defer f.file.Close()

	for i, header := range f.headers {
		cell := fmt.Sprintf("%s1", string(rune('A'+i)))
		f.file.SetCellValue(f.sheetName, cell, header)
	}

	// Populate the sheet with data
	f.writeData(f.data, f.headers)

	// Save the new Excel file
	return f.file.SaveAs(f.fileName)
}

// writeData writes the data to the Excel sheet starting from row 2
func (f *Xlsx) writeData(data []map[string]interface{}, headers []string) {
	for i, row := range data {
		for j, header := range headers {
			cell := fmt.Sprintf("%s%d", string(rune('A'+j)), i+2)
			f.file.SetCellValue("Sheet1", cell, row[header])
		}
	}
}

func convertToMapSlice[T any](tData []T) ([]map[string]interface{}, error) {
	data := make([]map[string]interface{}, 0, len(tData))

	for _, v := range tData {
		// Marshal the item into JSON
		b, err := json.Marshal(v)
		if err != nil {
			return nil, fmt.Errorf("error marshaling item: %v", err)
		}

		// Unmarshal the JSON back into a map
		var m map[string]interface{}
		if err := json.Unmarshal(b, &m); err != nil {
			return nil, fmt.Errorf("error unmarshaling item: %v", err)
		}

		data = append(data, m)
	}

	return data, nil
}
