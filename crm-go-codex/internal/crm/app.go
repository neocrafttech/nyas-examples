package crm

import (
	"context"
	"embed"
	"fmt"
	"html/template"
	"io/fs"
	"log"
	"net/http"
	"net/mail"
	"net/url"
	"path"
	"strconv"
	"strings"
	"time"
)

//go:embed templates/*.html static/*
var assets embed.FS

type App struct {
	store     *Store
	templates *template.Template
}

type PageData struct {
	Title       string
	ActivePath  string
	Flash       string
	NowUnix     int64
	Dashboard   DashboardData
	Customers   []Customer
	Deals       []Deal
	DealsByStep map[string][]Deal
	Statuses    []string
}

func NewApp(store *Store) (*App, error) {
	funcs := template.FuncMap{
		"currency": formatCents,
		"initials": initials,
	}

	tmpl, err := template.New("pages").Funcs(funcs).ParseFS(assets, "templates/*.html")
	if err != nil {
		return nil, fmt.Errorf("parse templates: %w", err)
	}

	return &App{store: store, templates: tmpl}, nil
}

func (a *App) Routes() http.Handler {
	mux := http.NewServeMux()
	staticFS, err := fs.Sub(assets, "static")
	if err != nil {
		panic("embedded static assets should exist")
	}

	mux.Handle("GET /static/", http.StripPrefix("/static/", http.FileServer(http.FS(staticFS))))
	mux.HandleFunc("GET /", a.dashboardHandler)
	mux.HandleFunc("GET /customers", a.customersHandler)
	mux.HandleFunc("POST /customers", a.createCustomerHandler)
	mux.HandleFunc("POST /customers/", a.customerActionHandler)
	mux.HandleFunc("GET /deals", a.dealsHandler)
	mux.HandleFunc("POST /deals", a.createDealHandler)
	mux.HandleFunc("POST /deals/", a.dealActionHandler)

	return withLogging(mux)
}

func (a *App) dashboardHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	data, err := a.store.Dashboard(ctx)
	if err != nil {
		a.serverError(w, r, err)
		return
	}

	page := PageData{
		Title:      "Dashboard",
		ActivePath: r.URL.Path,
		Flash:      r.URL.Query().Get("flash"),
		NowUnix:    time.Now().Unix(),
		Dashboard:  data,
	}
	a.render(w, "dashboard.html", page)
}

func (a *App) customersHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	customers, err := a.store.Customers(ctx)
	if err != nil {
		a.serverError(w, r, err)
		return
	}

	page := PageData{
		Title:      "Customers",
		ActivePath: r.URL.Path,
		Flash:      r.URL.Query().Get("flash"),
		NowUnix:    time.Now().Unix(),
		Customers:  customers,
	}
	a.render(w, "customers.html", page)
}

func (a *App) createCustomerHandler(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		a.badRequest(w, "Could not read the customer form.")
		return
	}

	name := strings.TrimSpace(r.FormValue("name"))
	email := strings.TrimSpace(r.FormValue("email"))
	company := strings.TrimSpace(r.FormValue("company"))

	if name == "" || email == "" {
		a.redirectWithFlash(w, r, "/customers", "Name and email are required.")
		return
	}

	if _, err := mail.ParseAddress(email); err != nil {
		a.redirectWithFlash(w, r, "/customers", "Enter a valid email address.")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := a.store.CreateCustomer(ctx, name, email, company); err != nil {
		a.redirectWithFlash(w, r, "/customers", humanizeStoreError(err, "Customer could not be saved."))
		return
	}

	a.redirectWithFlash(w, r, "/customers", "Customer added.")
}

func (a *App) customerActionHandler(w http.ResponseWriter, r *http.Request) {
	customerID, action := parseResourceAction(r.URL.Path, "/customers/")
	if customerID == "" || action == "" {
		http.NotFound(w, r)
		return
	}

	if action != "delete" {
		http.NotFound(w, r)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := a.store.DeleteCustomer(ctx, customerID); err != nil {
		a.redirectWithFlash(w, r, "/customers", "Customer could not be deleted.")
		return
	}

	a.redirectWithFlash(w, r, "/customers", "Customer deleted.")
}

func (a *App) dealsHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	customers, err := a.store.Customers(ctx)
	if err != nil {
		a.serverError(w, r, err)
		return
	}

	deals, err := a.store.Deals(ctx)
	if err != nil {
		a.serverError(w, r, err)
		return
	}

	byStep := make(map[string][]Deal, len(dealStatuses))
	for _, status := range dealStatuses {
		byStep[status] = []Deal{}
	}

	for _, deal := range deals {
		byStep[deal.Status] = append(byStep[deal.Status], deal)
	}

	page := PageData{
		Title:       "Deals",
		ActivePath:  r.URL.Path,
		Flash:       r.URL.Query().Get("flash"),
		NowUnix:     time.Now().Unix(),
		Customers:   customers,
		Deals:       deals,
		DealsByStep: byStep,
		Statuses:    dealStatuses,
	}
	a.render(w, "deals.html", page)
}

// TODO: Add richer validation and field-level errors once the forms move beyond
// this intentionally lightweight starter experience.
func (a *App) createDealHandler(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		a.badRequest(w, "Could not read the deal form.")
		return
	}

	title := strings.TrimSpace(r.FormValue("title"))
	customerID := strings.TrimSpace(r.FormValue("customer_id"))
	status := strings.TrimSpace(r.FormValue("status"))
	valueInput := strings.TrimSpace(r.FormValue("value"))

	if title == "" || customerID == "" || valueInput == "" {
		a.redirectWithFlash(w, r, "/deals", "Title, customer, and value are required.")
		return
	}

	if !isValidStatus(status) {
		a.redirectWithFlash(w, r, "/deals", "Choose a valid deal stage.")
		return
	}

	value, err := strconv.ParseFloat(valueInput, 64)
	if err != nil || value < 0 {
		a.redirectWithFlash(w, r, "/deals", "Enter a valid deal value.")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := a.store.CreateDeal(ctx, title, int64(value*100), status, customerID); err != nil {
		a.redirectWithFlash(w, r, "/deals", humanizeStoreError(err, "Deal could not be saved."))
		return
	}

	a.redirectWithFlash(w, r, "/deals", "Deal added.")
}

func (a *App) dealActionHandler(w http.ResponseWriter, r *http.Request) {
	dealID, action := parseResourceAction(r.URL.Path, "/deals/")
	if dealID == "" || action == "" {
		http.NotFound(w, r)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	switch action {
	case "status":
		if err := r.ParseForm(); err != nil {
			a.badRequest(w, "Could not read the status form.")
			return
		}

		status := strings.TrimSpace(r.FormValue("status"))
		if !isValidStatus(status) {
			a.redirectWithFlash(w, r, "/deals", "Choose a valid deal stage.")
			return
		}

		if err := a.store.UpdateDealStatus(ctx, dealID, status); err != nil {
			a.redirectWithFlash(w, r, "/deals", "Deal stage could not be updated.")
			return
		}

		a.redirectWithFlash(w, r, "/deals", "Deal stage updated.")
	case "delete":
		if err := a.store.DeleteDeal(ctx, dealID); err != nil {
			a.redirectWithFlash(w, r, "/deals", "Deal could not be deleted.")
			return
		}

		a.redirectWithFlash(w, r, "/deals", "Deal deleted.")
	default:
		http.NotFound(w, r)
	}
}

func (a *App) render(w http.ResponseWriter, name string, data PageData) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := a.templates.ExecuteTemplate(w, name, data); err != nil {
		http.Error(w, "template rendering failed", http.StatusInternalServerError)
	}
}

func (a *App) redirectWithFlash(w http.ResponseWriter, r *http.Request, target, message string) {
	http.Redirect(w, r, target+"?flash="+url.QueryEscape(message), http.StatusSeeOther)
}

func (a *App) serverError(w http.ResponseWriter, _ *http.Request, err error) {
	log.Printf("server error: %v", err)
	http.Error(w, "Internal server error", http.StatusInternalServerError)
}

func (a *App) badRequest(w http.ResponseWriter, message string) {
	http.Error(w, message, http.StatusBadRequest)
}

func parseResourceAction(urlPath, prefix string) (string, string) {
	trimmed := strings.TrimPrefix(urlPath, prefix)
	if trimmed == urlPath {
		return "", ""
	}

	id := path.Clean("/" + trimmed)
	id = strings.TrimPrefix(id, "/")
	parts := strings.Split(id, "/")
	if len(parts) != 2 {
		return "", ""
	}

	return parts[0], parts[1]
}

func isValidStatus(status string) bool {
	for _, allowed := range dealStatuses {
		if allowed == status {
			return true
		}
	}

	return false
}

func formatCents(cents int64) string {
	dollars := cents / 100
	centsPart := cents % 100
	base := strconv.FormatInt(dollars, 10)

	var b strings.Builder
	for idx, r := range base {
		if idx > 0 && (len(base)-idx)%3 == 0 {
			b.WriteByte(',')
		}
		b.WriteRune(r)
	}

	return fmt.Sprintf("$%s.%02d", b.String(), centsPart)
}

func initials(name string) string {
	parts := strings.Fields(name)
	if len(parts) == 0 {
		return "?"
	}

	if len(parts) == 1 {
		return strings.ToUpper(parts[0][:1])
	}

	return strings.ToUpper(parts[0][:1] + parts[len(parts)-1][:1])
}

func humanizeStoreError(err error, fallback string) string {
	message := err.Error()
	switch {
	case strings.Contains(message, "duplicate key value"):
		return "That email already exists."
	case strings.Contains(message, "violates foreign key"):
		return "Choose an existing customer for the deal."
	default:
		return fallback
	}
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
	})
}
