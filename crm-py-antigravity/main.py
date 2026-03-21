from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional

from database import init_db, get_session
from models import Customer, Deal

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request, session: Session = Depends(get_session)):
    customers = session.exec(select(Customer)).all()
    customers_count = len(customers)
    deals = session.exec(select(Deal)).all()
    deals_count = len(deals)
    total_value = sum(d.value for d in deals)
    
    return templates.TemplateResponse("dashboard.html", {
        "request": request, 
        "customers_count": customers_count,
        "deals_count": deals_count,
        "total_value": total_value,
        "active_tab": "dashboard"
    })

@app.get("/customers", response_class=HTMLResponse)
async def view_customers(request: Request, session: Session = Depends(get_session)):
    customers = session.exec(select(Customer)).all()
    return templates.TemplateResponse("customers.html", {
        "request": request, 
        "customers": customers,
        "active_tab": "customers"
    })

@app.post("/customers")
async def create_customer(
    name: str = Form(...),
    email: str = Form(...),
    company: Optional[str] = Form(None),
    session: Session = Depends(get_session)
):
    customer = Customer(name=name, email=email, company=company)
    session.add(customer)
    session.commit()
    return RedirectResponse(url="/customers", status_code=303)

@app.get("/deals", response_class=HTMLResponse)
async def view_deals(request: Request, session: Session = Depends(get_session)):
    deals = session.exec(select(Deal)).all()
    customers = session.exec(select(Customer)).all()
    # Group deals by status
    board = {"Lead": [], "Proposal": [], "Negotiation": [], "Won": [], "Lost": []}
    for deal in deals:
        if deal.status in board:
            board[deal.status].append(deal)
        else:
            board["Lead"].append(deal)
            
    return templates.TemplateResponse("deals.html", {
        "request": request, 
        "board": board,
        "customers": customers,
        "active_tab": "deals"
    })

@app.post("/deals")
async def create_deal(
    title: str = Form(...),
    value: float = Form(...),
    customer_id: int = Form(...),
    session: Session = Depends(get_session)
):
    deal = Deal(title=title, value=value, customer_id=customer_id, status="Lead")
    session.add(deal)
    session.commit()
    return RedirectResponse(url="/deals", status_code=303)

class DealStatusUpdate(BaseModel):
    status: str

@app.put("/api/deals/{deal_id}/status")
async def update_deal_status(
    deal_id: int, 
    update: DealStatusUpdate,
    session: Session = Depends(get_session)
):
    deal = session.get(Deal, deal_id)
    if not deal:
        return {"error": "Deal not found"}
    deal.status = update.status
    session.add(deal)
    session.commit()
    return {"status": "success"}
