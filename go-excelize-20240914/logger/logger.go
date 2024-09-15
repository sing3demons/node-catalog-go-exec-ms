package logger

import (
	"log/slog"
	"os"
)

func New() *slog.Logger {
	logger := slog.New(slog.NewJSONHandler(os.Stdout,
		&slog.HandlerOptions{
			Level: setLogLevel(),
			ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
				if a.Key == "time" {
					return slog.Attr{Key: "@timestamp", Value: a.Value}
				}
				return a
			},
		})).With("serviceName", "auth-service")

	slog.SetDefault(logger)

	return logger
}

func setLogLevel() slog.Leveler {
	logLevel := os.Getenv("LOG_LEVEL")
	switch logLevel {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelDebug
	}
}
