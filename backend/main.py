import logging
from contextlib import asynccontextmanager
from decimal import Decimal
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import engine, Base, get_db
from models import Product, Customer, Order, OrderItem
import schemas

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifespan event for database initialization
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title="Inventory & Order Management System API",
    description="Backend API for managing products, customers, orders, and inventory tracking.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, configure this specifically
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Inventory & Order Management API",
        "docs_url": "/docs",
        "status": "healthy"
    }

# Seed endpoint for demo convenience
@app.post("/seed")
def seed_db():
    from seed import seed_database
    try:
        seed_database()
        return {"message": "Database seeded successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Seeding failed: {str(e)}"
        )

# --- DASHBOARD ENDPOINT ---
@app.get("/dashboard", response_model=schemas.DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    try:
        total_products = db.query(Product).count()
        total_customers = db.query(Customer).count()
        total_orders = db.query(Order).count()
        
        # Calculate total revenue from non-cancelled orders
        revenue_query = db.query(func.sum(Order.total_price)).filter(Order.status != "CANCELLED").scalar()
        total_revenue = Decimal(str(revenue_query)) if revenue_query else Decimal("0.00")
        
        # Count products with low stock (e.g., <= 5)
        low_stock_count = db.query(Product).filter(Product.stock <= 5).count()
        
        # Get 5 most recent orders
        recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(5).all()
        
        return {
            "total_products": total_products,
            "total_customers": total_customers,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "low_stock_count": low_stock_count,
            "recent_orders": recent_orders
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dashboard summary"
        )

# --- PRODUCT ENDPOINTS ---
@app.get("/products", response_model=list[schemas.ProductResponse])
def list_products(search: str = None, db: Session = Depends(get_db)):
    query = db.query(Product)
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) | 
            (Product.sku.ilike(f"%{search}%"))
        )
    return query.order_by(Product.name).all()

@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: schemas.ProductCreate, db: Session = Depends(get_db)):
    # SKU uniqueness check
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product_in.sku}' already exists"
        )
    
    db_product = Product(
        sku=product_in.sku,
        name=product_in.name,
        description=product_in.description,
        price=product_in.price,
        stock=product_in.stock
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.get("/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    return product

@app.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product_in: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    # Check SKU uniqueness if changing SKU
    if product_in.sku and product_in.sku != product.sku:
        existing = db.query(Product).filter(Product.sku == product_in.sku).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{product_in.sku}' already exists"
            )
            
    # Update fields
    for field, value in product_in.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
        
    db.commit()
    db.refresh(product)
    return product

@app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    # Check if product is in any orders
    in_orders = db.query(OrderItem).filter(OrderItem.product_id == product_id).first()
    if in_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product because it is associated with existing orders. Consider reducing its stock to 0 instead."
        )
        
    db.delete(product)
    db.commit()
    return None


# --- CUSTOMER ENDPOINTS ---
@app.get("/customers", response_model=list[schemas.CustomerResponse])
def list_customers(search: str = None, db: Session = Depends(get_db)):
    query = db.query(Customer)
    if search:
        query = query.filter(
            (Customer.name.ilike(f"%{search}%")) | 
            (Customer.email.ilike(f"%{search}%"))
        )
    return query.order_by(Customer.name).all()

@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer_in: schemas.CustomerCreate, db: Session = Depends(get_db)):
    # Email uniqueness check
    existing = db.query(Customer).filter(Customer.email == customer_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer_in.email}' already exists"
        )
        
    db_customer = Customer(
        name=customer_in.name,
        email=customer_in.email,
        phone=customer_in.phone
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.get("/customers/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found"
        )
    return customer

@app.put("/customers/{customer_id}", response_model=schemas.CustomerResponse)
def update_customer(customer_id: int, customer_in: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found"
        )
        
    # Check email uniqueness if changing email
    if customer_in.email and customer_in.email != customer.email:
        existing = db.query(Customer).filter(Customer.email == customer_in.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Customer with email '{customer_in.email}' already exists"
            )
            
    # Update fields
    for field, value in customer_in.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
        
    db.commit()
    db.refresh(customer)
    return customer

@app.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found"
        )
        
    # Check if customer has any orders
    has_orders = db.query(Order).filter(Order.customer_id == customer_id).first()
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete customer because they have order history."
        )
        
    db.delete(customer)
    db.commit()
    return None


# --- ORDER ENDPOINTS ---
@app.get("/orders", response_model=list[schemas.OrderResponse])
def list_orders(db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.created_at.desc()).all()

@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: schemas.OrderCreate, db: Session = Depends(get_db)):
    # Check if customer exists
    customer = db.query(Customer).filter(Customer.id == order_in.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_in.customer_id} not found"
        )
    
    # We will run the order creation in a single transaction with FOR UPDATE row locks to prevent race conditions
    try:
        # 1. Create order header first (status pending, total price 0)
        db_order = Order(
            customer_id=order_in.customer_id,
            status="COMPLETED",  # Mark COMPLETED directly upon successful stock verification
            total_price=Decimal("0.00")
        )
        db.add(db_order)
        db.flush()  # Flushes to db to generate db_order.id
        
        total_price = Decimal("0.00")
        
        # 2. Process each item
        for item_in in order_in.items:
            # Query the product and lock the row
            product = db.query(Product).filter(Product.id == item_in.product_id).with_for_update().first()
            
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item_in.product_id} not found"
                )
            
            # Inventory validation
            if product.stock < item_in.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). Available: {product.stock}, Requested: {item_in.quantity}"
                )
                
            # Deduct inventory stock
            product.stock -= item_in.quantity
            
            # Calculate item price
            item_total = Decimal(str(product.price)) * item_in.quantity
            total_price += item_total
            
            # Create OrderItem
            db_item = OrderItem(
                order_id=db_order.id,
                product_id=product.id,
                quantity=item_in.quantity,
                unit_price=product.price
            )
            db.add(db_item)
            
        # 3. Update total price and commit
        db_order.total_price = total_price
        db.commit()
        db.refresh(db_order)
        return db_order
        
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        logger.error(f"Transaction failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order creation failed: {str(e)}"
        )

@app.get("/orders/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    return order

@app.delete("/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
        
    try:
        # Business logic: if status is not CANCELLED, restore stock before deleting/cancelling
        if order.status != "CANCELLED":
            for item in order.items:
                product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
                if product:
                    product.stock += item.quantity
                    logger.info(f"Restored stock for SKU {product.sku}: +{item.quantity} (Order #{order.id} cancelled/deleted)")
                    
        db.delete(order)
        db.commit()
        return None
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed deleting order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel/delete order due to a database error"
        )
