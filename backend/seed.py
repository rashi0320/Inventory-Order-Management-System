import os
import sys
from decimal import Decimal

# Add current directory to path so database module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base, SessionLocal
from models import Product, Customer, Order, OrderItem

def seed_database():
    print("Seeding database...")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if products already exist to prevent duplicate seed
        if db.query(Product).count() > 0:
            print("Database already has data. Skipping seed.")
            return

        print("Creating products...")
        products = [
            Product(
                sku="VR-HD-001",
                name="Ethara Premium VR Headset",
                description="Ultra-high-resolution immersive VR headset with custom optical lenses, 120Hz refresh rate, and inside-out spatial tracking.",
                price=Decimal("599.99"),
                stock=25
            ),
            Product(
                sku="AI-CP-002",
                name="Ethara Edge AI Coprocessor",
                description="A high-efficiency hardware accelerator board for running embedded neural network inference models locally.",
                price=Decimal("299.50"),
                stock=15
            ),
            Product(
                sku="ROB-AM-003",
                name="Ethara Autonomous Mobile Robot",
                description="Industrial autonomous mobile robot platform equipped with LiDAR, depth sensors, and full ROS 2 integration.",
                price=Decimal("4999.00"),
                stock=3
            ),
            Product(
                sku="HAP-GL-004",
                name="Ethara Haptic Gloves Pro",
                description="Precision force feedback haptic glove pair for virtual reality training and teleoperation interfaces.",
                price=Decimal("850.00"),
                stock=8
            ),
            Product(
                sku="AR-GL-005",
                name="Ethara Light AR Glasses",
                description="Lightweight smart glasses for augmented reality, featuring waveguide displays and voice control.",
                price=Decimal("450.00"),
                stock=4
            )
        ]
        
        for p in products:
            db.add(p)
            
        print("Creating customers...")
        customers = [
            Customer(
                name="John Doe",
                email="john.doe@example.com",
                phone="+1-555-0199"
            ),
            Customer(
                name="Jane Smith",
                email="jane.smith@example.com",
                phone="+1-555-0188"
            ),
            Customer(
                name="Alice Johnson",
                email="alice.j@company.io",
                phone="+44-20-7946-0958"
            )
        ]
        
        for c in customers:
            db.add(c)
            
        db.commit()
        
        # Reload products and customers to get IDs
        db_products = db.query(Product).all()
        db_customers = db.query(Customer).all()
        
        print("Creating sample orders...")
        # Create an order for John Doe: 1 VR Headset and 2 AI Coprocessors
        john = next(c for c in db_customers if c.email == "john.doe@example.com")
        vr_headset = next(p for p in db_products if p.sku == "VR-HD-001")
        ai_coproc = next(p for p in db_products if p.sku == "AI-CP-002")
        
        order1 = Order(
            customer_id=john.id,
            status="COMPLETED",
            total_price=Decimal("1198.99")
        )
        db.add(order1)
        db.flush() # get ID
        
        item1 = OrderItem(
            order_id=order1.id,
            product_id=vr_headset.id,
            quantity=1,
            unit_price=vr_headset.price
        )
        item2 = OrderItem(
            order_id=order1.id,
            product_id=ai_coproc.id,
            quantity=2,
            unit_price=ai_coproc.price
        )
        db.add(item1)
        db.add(item2)
        
        # Deduct stock for order 1
        vr_headset.stock -= 1
        ai_coproc.stock -= 2
        
        # Create another order for Jane Smith: 1 Haptic Gloves Pro
        jane = next(c for c in db_customers if c.email == "jane.smith@example.com")
        gloves = next(p for p in db_products if p.sku == "HAP-GL-004")
        
        order2 = Order(
            customer_id=jane.id,
            status="COMPLETED",
            total_price=Decimal("850.00")
        )
        db.add(order2)
        db.flush()
        
        item3 = OrderItem(
            order_id=order2.id,
            product_id=gloves.id,
            quantity=1,
            unit_price=gloves.price
        )
        db.add(item3)
        gloves.stock -= 1
        
        db.commit()
        print("Database successfully seeded!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
