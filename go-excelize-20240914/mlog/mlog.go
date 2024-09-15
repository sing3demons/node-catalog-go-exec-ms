package mlog

import (
	"context"
	"log/slog"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type contextKey string

const (
	sessionKey contextKey = "x-transaction-id"
	loggerKey  contextKey = "logger"
)

func L(ctx context.Context) *slog.Logger {
	logger := ctx.Value(loggerKey)
	switch logger := logger.(type) {
	case *slog.Logger:
		return logger
	default:
		return slog.Default()
	}
}

func logMiddleware(ctx context.Context, logger *slog.Logger) *slog.Logger {
	session, exits := ctx.Value(loggerKey).(string)
	if !exits {
		session = uuid.New().String()
	}
	logger = logger.With("session", session)
	return logger
}

func Middleware(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		session := c.GetHeader("x-request-id")
		if session == "" {
			xSession := c.GetHeader(string(sessionKey))
			if xSession != "" {
				session = xSession
			} else {
				session = uuid.New().String()
			}
		}

		ctx := context.WithValue(c.Request.Context(), sessionKey, session)
		l := logMiddleware(ctx, logger)
		ctx = context.WithValue(ctx, loggerKey, l)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}
