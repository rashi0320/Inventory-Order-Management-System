from pydantic import BaseModel, EmailStr, Field, condecimal, conint
from typing import List, Optional
from decimal import Decimal
import datetime

# --- PRODUCT SCHEMAS ---
class ProductBase(BaseModel):
    sku: str = Field(..., max_length=50, description="Unique SKU code")
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0, decimal_places=2)
    stock: int = Field(..., ge=0)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    stock: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- CUSTOMER SCHEMAS ---
class CustomerBase(BaseModel):
    name: str = Field(..., max_length=100)
    email: EmailStr = Field(..., description="Unique customer email")
    phone: Optional[str] = Field(None, max_length=20)

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- ORDER ITEM SCHEMAS ---
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="Quantity must be greater than 0")

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True

# --- ORDER SCHEMAS ---
class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., min_items=1, description="Order must contain at least 1 item")

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(PENDING|COMPLETED|CANCELLED)$")

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    status: str
    total_price: Decimal
    created_at: datetime.datetime
    customer: CustomerResponse
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

# --- DASHBOARD SUMMARY SCHEMAS ---
class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: Decimal
    low_stock_count: int
    recent_orders: List[OrderResponse]
