package crm

type Customer struct {
	ID            string
	Name          string
	Email         string
	Company       string
	CreatedAtUnix int64
	DealCount     int
}

type Deal struct {
	ID            string
	Title         string
	ValueCents    int64
	Status        string
	CustomerID    string
	CustomerName  string
	CreatedAtUnix int64
}

type Activity struct {
	Label         string
	Description   string
	CreatedAtUnix int64
}

type DashboardStats struct {
	CustomerCount int
	DealCount     int
	PipelineCents int64
	WonCents      int64
}

type DashboardData struct {
	Stats            DashboardStats
	RecentCustomers  []Customer
	RecentDeals      []Deal
	RecentActivities []Activity
}
