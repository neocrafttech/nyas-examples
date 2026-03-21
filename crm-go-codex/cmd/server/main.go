package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"

	"github.com/manish/nyas-examples/crm-go-codex/internal/crm"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer db.Close()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("ping database: %v", err)
	}

	store := crm.NewStore(db)
	if err := store.EnsureSchema(ctx); err != nil {
		log.Fatalf("ensure schema: %v", err)
	}

	if err := store.SeedDemoData(ctx); err != nil {
		log.Fatalf("seed demo data: %v", err)
	}

	app, err := crm.NewApp(store)
	if err != nil {
		log.Fatalf("build app: %v", err)
	}

	server := &http.Server{
		Addr:              ":3000",
		Handler:           app.Routes(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("CRM app listening on http://localhost%s", server.Addr)
	if err := server.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("serve http: %v", err)
	}
}
