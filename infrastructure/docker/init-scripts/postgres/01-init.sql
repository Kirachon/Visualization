-- PostgreSQL Initialization Script for BI Platform Multi-Database Connectivity Testing
-- Note: The main bi_platform database is already created by the container

\c bi_platform;

-- Create test schema for connector testing
CREATE SCHEMA IF NOT EXISTS test_schema;

-- Create sample tables in test_schema
CREATE TABLE IF NOT EXISTS test_schema.customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_email ON test_schema.customers(email);
CREATE INDEX idx_customers_created_at ON test_schema.customers(created_at);

CREATE TABLE IF NOT EXISTS test_schema.orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES test_schema.customers(id) ON DELETE CASCADE,
    order_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_customer_id ON test_schema.orders(customer_id);
CREATE INDEX idx_orders_order_date ON test_schema.orders(order_date);
CREATE INDEX idx_orders_status ON test_schema.orders(status);

CREATE TABLE IF NOT EXISTS test_schema.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON test_schema.products(category);
CREATE INDEX idx_products_is_active ON test_schema.products(is_active);

CREATE TABLE IF NOT EXISTS test_schema.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES test_schema.orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES test_schema.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_order_items_order_id ON test_schema.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON test_schema.order_items(product_id);

-- Insert sample data
INSERT INTO test_schema.customers (name, email) VALUES
    ('John Doe', 'john.doe@example.com'),
    ('Jane Smith', 'jane.smith@example.com'),
    ('Bob Johnson', 'bob.johnson@example.com'),
    ('Alice Williams', 'alice.williams@example.com'),
    ('Charlie Brown', 'charlie.brown@example.com');

INSERT INTO test_schema.products (name, description, price, stock_quantity, category) VALUES
    ('Laptop', 'High-performance laptop', 1299.99, 50, 'Electronics'),
    ('Mouse', 'Wireless mouse', 29.99, 200, 'Electronics'),
    ('Keyboard', 'Mechanical keyboard', 89.99, 150, 'Electronics'),
    ('Monitor', '27-inch 4K monitor', 399.99, 75, 'Electronics'),
    ('Desk Chair', 'Ergonomic office chair', 249.99, 30, 'Furniture');

INSERT INTO test_schema.orders (customer_id, order_date, total_amount, status) VALUES
    (1, '2024-01-15', 1329.98, 'completed'),
    (2, '2024-01-16', 89.99, 'completed'),
    (3, '2024-01-17', 1699.97, 'processing'),
    (1, '2024-01-18', 29.99, 'completed'),
    (4, '2024-01-19', 649.98, 'pending');

INSERT INTO test_schema.order_items (order_id, product_id, quantity, unit_price) VALUES
    (1, 1, 1, 1299.99),
    (1, 2, 1, 29.99),
    (2, 3, 1, 89.99),
    (3, 1, 1, 1299.99),
    (3, 4, 1, 399.99),
    (4, 2, 1, 29.99),
    (5, 4, 1, 399.99),
    (5, 5, 1, 249.99);

-- Create a view for testing
CREATE OR REPLACE VIEW test_schema.order_summary AS
SELECT 
    o.id AS order_id,
    c.name AS customer_name,
    c.email AS customer_email,
    o.order_date,
    o.total_amount,
    o.status,
    COUNT(oi.id) AS item_count
FROM test_schema.orders o
JOIN test_schema.customers c ON o.customer_id = c.id
LEFT JOIN test_schema.order_items oi ON o.id = oi.order_id
GROUP BY o.id, c.name, c.email, o.order_date, o.total_amount, o.status;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION test_schema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for customers table
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON test_schema.customers
    FOR EACH ROW EXECUTE FUNCTION test_schema.update_updated_at_column();

