from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class Customer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    email: str = Field(unique=True, index=True)
    company: Optional[str] = None
    
    deals: List["Deal"] = Relationship(back_populates="customer")

class Deal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    value: float
    status: str = Field(default="Lead") # Statuses: Lead, Proposal, Negotiation, Won, Lost
    customer_id: Optional[int] = Field(default=None, foreign_key="customer.id")
    
    customer: Optional[Customer] = Relationship(back_populates="deals")
