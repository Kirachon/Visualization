-- SQL Server Initialization Script for BI Platform Multi-Database Connectivity Testing
-- Note: This script will be executed after SQL Server starts

-- Wait for SQL Server to be ready
WAITFOR DELAY '00:00:10';
GO

-- Create test database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'test_db')
BEGIN
    CREATE DATABASE test_db;
END
GO

USE test_db;
GO

-- Create sample tables
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[customers]') AND type in (N'U'))
BEGIN
    CREATE TABLE customers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    CREATE INDEX idx_customers_email ON customers(email);
    CREATE INDEX idx_customers_created_at ON customers(created_at);
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[products]') AND type in (N'U'))
BEGIN
    CREATE TABLE products (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        price DECIMAL(10, 2) NOT NULL,
        stock_quantity INT DEFAULT 0,
        category NVARCHAR(100),
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE()
    );
    CREATE INDEX idx_products_category ON products(category);
    CREATE INDEX idx_products_is_active ON products(is_active);
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[orders]') AND type in (N'U'))
BEGIN
    CREATE TABLE orders (
        id INT IDENTITY(1,1) PRIMARY KEY,
        customer_id INT NOT NULL,
        order_date DATE NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status NVARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_orders_customer_id ON orders(customer_id);
    CREATE INDEX idx_orders_order_date ON orders(order_date);
    CREATE INDEX idx_orders_status ON orders(status);
END
GO

-- Insert sample data
IF NOT EXISTS (SELECT * FROM customers)
BEGIN
    INSERT INTO customers (name, email) VALUES
        ('John Doe', 'john.doe@example.com'),
        ('Jane Smith', 'jane.smith@example.com'),
        ('Bob Johnson', 'bob.johnson@example.com'),
        ('Alice Williams', 'alice.williams@example.com'),
        ('Charlie Brown', 'charlie.brown@example.com');
END
GO

IF NOT EXISTS (SELECT * FROM products)
BEGIN
    INSERT INTO products (name, description, price, stock_quantity, category) VALUES
        ('Laptop', 'High-performance laptop', 1299.99, 50, 'Electronics'),
        ('Mouse', 'Wireless mouse', 29.99, 200, 'Electronics'),
        ('Keyboard', 'Mechanical keyboard', 89.99, 150, 'Electronics'),
        ('Monitor', '27-inch 4K monitor', 399.99, 75, 'Electronics'),
        ('Desk Chair', 'Ergonomic office chair', 249.99, 30, 'Furniture');
END
GO

IF NOT EXISTS (SELECT * FROM orders)
BEGIN
    INSERT INTO orders (customer_id, order_date, total_amount, status) VALUES
        (1, '2024-01-15', 1329.98, 'completed'),
        (2, '2024-01-16', 89.99, 'completed'),
        (3, '2024-01-17', 1699.97, 'processing'),
        (1, '2024-01-18', 29.99, 'completed'),
        (4, '2024-01-19', 649.98, 'pending');
END
GO

