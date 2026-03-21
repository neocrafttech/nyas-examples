from database import engine, init_db
from models import Customer, Deal
from sqlmodel import Session
import random

def seed_data():
    init_db()
    with Session(engine) as session:
        # Check if empty
        if session.query(Customer).first() is not None:
            print("Database already seeded.")
            return

        customers_data = [
            ("Alice Johnson", "alice@example.com", "TechCorp Inc."),
            ("Bob Smith", "bob@example.com", "Global Solutions"),
            ("Charlie Davis", "charlie@startup.io", "Innovate AI"),
            ("Dana White", "dana@enterprise.com", None),
        ]
        
        db_customers = []
        for c in customers_data:
            customer = Customer(name=c[0], email=c[1], company=c[2])
            session.add(customer)
            db_customers.append(customer)
            
        session.commit()
        
        deals_data = [
            ("Enterprise Software License", 12000.0, ["Lead", "Proposal", "Negotiation"]),
            ("Consulting Services Q3", 5500.0, ["Lead", "Proposal", "Won"]),
            ("Cloud Migration", 24000.0, ["Negotiation", "Won", "Lost"]),
            ("Yearly Maintenance", 3000.0, ["Won", "Won"]),
            ("Security Audit", 8000.0, ["Lead", "Proposal"]),
            ("Team Training", 2500.0, ["Lost", "Lost"]),
            ("Custom Feature Development", 15000.0, ["Negotiation"]),
        ]
        
        for d in deals_data:
            for customer in db_customers:
                # randomly assign deals to customers
                if random.random() > 0.5:
                    status = random.choice(d[2])
                    deal = Deal(
                        title=f"{d[0]} - {customer.company or customer.name}",
                        value=d[1] * (0.8 + 0.4 * random.random()), # slightly randomize value
                        status=status,
                        customer_id=customer.id
                    )
                    session.add(deal)
                    
        session.commit()
        print("Database seeded successfully with dummy data!")

if __name__ == "__main__":
    seed_data()
