package crm

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"strings"
	"time"
)

var dealStatuses = []string{"Lead", "Contacted", "Proposal", "Won", "Lost"}

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

// We keep the schema bootstrap in the app so a fresh Nyas database can start
// serving useful pages immediately without a separate migration tool.
func (s *Store) EnsureSchema(ctx context.Context) error {
	schema := `
CREATE TABLE IF NOT EXISTS customers (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	company TEXT NOT NULL DEFAULT '',
	created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS deals (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	value_cents BIGINT NOT NULL CHECK (value_cents >= 0),
	status TEXT NOT NULL CHECK (status IN ('Lead', 'Contacted', 'Proposal', 'Won', 'Lost')),
	customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
	created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
`

	if _, err := s.db.ExecContext(ctx, schema); err != nil {
		return fmt.Errorf("while attempting to ensure schema: %w", err)
	}

	return nil
}

// The seed data gives a new workspace enough shape to demonstrate the CRM
// without forcing the operator to create every record by hand.
func (s *Store) SeedDemoData(ctx context.Context) error {
	var count int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM customers`).Scan(&count); err != nil {
		return fmt.Errorf("while attempting to count customers: %w", err)
	}

	if count > 0 {
		return nil
	}

	now := time.Now().Unix()

	customers := []Customer{
		{ID: newID("cus"), Name: "Maya Chen", Email: "maya@northstarlabs.com", Company: "Northstar Labs", CreatedAtUnix: now - 86400*6},
		{ID: newID("cus"), Name: "Jordan Ellis", Email: "jordan@pineandpeak.io", Company: "Pine & Peak", CreatedAtUnix: now - 86400*4},
		{ID: newID("cus"), Name: "Ava Patel", Email: "ava@sprucehealth.co", Company: "Spruce Health", CreatedAtUnix: now - 86400*2},
	}

	for _, customer := range customers {
		if _, err := s.db.ExecContext(
			ctx,
			`INSERT INTO customers (id, name, email, company, created_at) VALUES ($1, $2, $3, $4, $5)`,
			customer.ID,
			customer.Name,
			customer.Email,
			customer.Company,
			customer.CreatedAtUnix,
		); err != nil {
			return fmt.Errorf("while attempting to seed customers: %w", err)
		}
	}

	deals := []Deal{
		{ID: newID("deal"), Title: "Growth Retainer", ValueCents: 4200000, Status: "Proposal", CustomerID: customers[0].ID, CreatedAtUnix: now - 86400*5},
		{ID: newID("deal"), Title: "Expansion Rollout", ValueCents: 9800000, Status: "Lead", CustomerID: customers[1].ID, CreatedAtUnix: now - 86400*3},
		{ID: newID("deal"), Title: "Annual Renewal", ValueCents: 2100000, Status: "Won", CustomerID: customers[2].ID, CreatedAtUnix: now - 86400},
	}

	for _, deal := range deals {
		if _, err := s.db.ExecContext(
			ctx,
			`INSERT INTO deals (id, title, value_cents, status, customer_id, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
			deal.ID,
			deal.Title,
			deal.ValueCents,
			deal.Status,
			deal.CustomerID,
			deal.CreatedAtUnix,
		); err != nil {
			return fmt.Errorf("while attempting to seed deals: %w", err)
		}
	}

	return nil
}

func (s *Store) Dashboard(ctx context.Context) (DashboardData, error) {
	stats, err := s.dashboardStats(ctx)
	if err != nil {
		return DashboardData{}, err
	}

	recentCustomers, err := s.Customers(ctx)
	if err != nil {
		return DashboardData{}, err
	}

	recentDeals, err := s.Deals(ctx)
	if err != nil {
		return DashboardData{}, err
	}

	activities, err := s.RecentActivity(ctx)
	if err != nil {
		return DashboardData{}, err
	}

	return DashboardData{
		Stats:            stats,
		RecentCustomers:  limitCustomers(recentCustomers, 5),
		RecentDeals:      limitDeals(recentDeals, 5),
		RecentActivities: activities,
	}, nil
}

func (s *Store) Customers(ctx context.Context) ([]Customer, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT c.id, c.name, c.email, c.company, c.created_at, COUNT(d.id) AS deal_count
FROM customers c
LEFT JOIN deals d ON d.customer_id = c.id
GROUP BY c.id
ORDER BY c.created_at DESC, c.name ASC
`)
	if err != nil {
		return nil, fmt.Errorf("while attempting to query customers: %w", err)
	}
	defer rows.Close()

	var customers []Customer
	for rows.Next() {
		var customer Customer
		if err := rows.Scan(
			&customer.ID,
			&customer.Name,
			&customer.Email,
			&customer.Company,
			&customer.CreatedAtUnix,
			&customer.DealCount,
		); err != nil {
			return nil, fmt.Errorf("while attempting to scan customers: %w", err)
		}
		customers = append(customers, customer)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("while attempting to iterate customers: %w", err)
	}

	return customers, nil
}

func (s *Store) CreateCustomer(ctx context.Context, name, email, company string) error {
	if _, err := s.db.ExecContext(
		ctx,
		`INSERT INTO customers (id, name, email, company, created_at) VALUES ($1, $2, $3, $4, $5)`,
		newID("cus"),
		strings.TrimSpace(name),
		strings.TrimSpace(email),
		strings.TrimSpace(company),
		time.Now().Unix(),
	); err != nil {
		return fmt.Errorf("while attempting to create customer: %w", err)
	}

	return nil
}

func (s *Store) DeleteCustomer(ctx context.Context, customerID string) error {
	if _, err := s.db.ExecContext(ctx, `DELETE FROM customers WHERE id = $1`, customerID); err != nil {
		return fmt.Errorf("while attempting to delete customer: %w", err)
	}

	return nil
}

func (s *Store) Deals(ctx context.Context) ([]Deal, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT d.id, d.title, d.value_cents, d.status, d.customer_id, c.name, d.created_at
FROM deals d
INNER JOIN customers c ON c.id = d.customer_id
ORDER BY d.created_at DESC, d.title ASC
`)
	if err != nil {
		return nil, fmt.Errorf("while attempting to query deals: %w", err)
	}
	defer rows.Close()

	var deals []Deal
	for rows.Next() {
		var deal Deal
		if err := rows.Scan(
			&deal.ID,
			&deal.Title,
			&deal.ValueCents,
			&deal.Status,
			&deal.CustomerID,
			&deal.CustomerName,
			&deal.CreatedAtUnix,
		); err != nil {
			return nil, fmt.Errorf("while attempting to scan deals: %w", err)
		}
		deals = append(deals, deal)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("while attempting to iterate deals: %w", err)
	}

	return deals, nil
}

func (s *Store) CreateDeal(ctx context.Context, title string, valueCents int64, status, customerID string) error {
	if _, err := s.db.ExecContext(
		ctx,
		`INSERT INTO deals (id, title, value_cents, status, customer_id, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
		newID("deal"),
		strings.TrimSpace(title),
		valueCents,
		status,
		customerID,
		time.Now().Unix(),
	); err != nil {
		return fmt.Errorf("while attempting to create deal: %w", err)
	}

	return nil
}

func (s *Store) UpdateDealStatus(ctx context.Context, dealID, status string) error {
	if _, err := s.db.ExecContext(ctx, `UPDATE deals SET status = $2 WHERE id = $1`, dealID, status); err != nil {
		return fmt.Errorf("while attempting to update deal status: %w", err)
	}

	return nil
}

func (s *Store) DeleteDeal(ctx context.Context, dealID string) error {
	if _, err := s.db.ExecContext(ctx, `DELETE FROM deals WHERE id = $1`, dealID); err != nil {
		return fmt.Errorf("while attempting to delete deal: %w", err)
	}

	return nil
}

func (s *Store) RecentActivity(ctx context.Context) ([]Activity, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT label, description, created_at
FROM (
	SELECT 'New customer' AS label, name || ' joined from ' || COALESCE(NULLIF(company, ''), 'an independent account') AS description, created_at
	FROM customers
	UNION ALL
	SELECT 'New deal' AS label, title || ' entered ' || status || ' for ' || c.name AS description, d.created_at
	FROM deals d
	INNER JOIN customers c ON c.id = d.customer_id
) activity
ORDER BY created_at DESC
LIMIT 6
`)
	if err != nil {
		return nil, fmt.Errorf("while attempting to query recent activity: %w", err)
	}
	defer rows.Close()

	var activities []Activity
	for rows.Next() {
		var activity Activity
		if err := rows.Scan(&activity.Label, &activity.Description, &activity.CreatedAtUnix); err != nil {
			return nil, fmt.Errorf("while attempting to scan recent activity: %w", err)
		}
		activities = append(activities, activity)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("while attempting to iterate recent activity: %w", err)
	}

	return activities, nil
}

func (s *Store) dashboardStats(ctx context.Context) (DashboardStats, error) {
	var stats DashboardStats
	if err := s.db.QueryRowContext(ctx, `
SELECT
	(SELECT COUNT(*) FROM customers) AS customer_count,
	(SELECT COUNT(*) FROM deals) AS deal_count,
	COALESCE((SELECT SUM(value_cents) FROM deals), 0) AS pipeline_cents,
	COALESCE((SELECT SUM(value_cents) FROM deals WHERE status = 'Won'), 0) AS won_cents
`).Scan(&stats.CustomerCount, &stats.DealCount, &stats.PipelineCents, &stats.WonCents); err != nil {
		return DashboardStats{}, fmt.Errorf("while attempting to query dashboard stats: %w", err)
	}

	return stats, nil
}

func newID(prefix string) string {
	buf := make([]byte, 8)
	if _, err := rand.Read(buf); err != nil {
		panic("random ID generation should not fail")
	}

	return prefix + "_" + hex.EncodeToString(buf)
}

func limitCustomers(customers []Customer, max int) []Customer {
	if len(customers) <= max {
		return customers
	}

	return customers[:max]
}

func limitDeals(deals []Deal, max int) []Deal {
	if len(deals) <= max {
		return deals
	}

	return deals[:max]
}
