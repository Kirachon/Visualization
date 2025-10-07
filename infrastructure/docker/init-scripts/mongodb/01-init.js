// MongoDB Initialization Script for BI Platform Multi-Database Connectivity Testing

// Switch to test_db database
db = db.getSiblingDB('test_db');

// Create collections with validation schemas
db.createCollection('customers', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Customer name - required'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Customer email - required and must be valid'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        }
      }
    }
  }
});

db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'price'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'Product name - required'
        },
        description: {
          bsonType: 'string',
          description: 'Product description'
        },
        price: {
          bsonType: 'number',
          minimum: 0,
          description: 'Product price - required and must be >= 0'
        },
        stockQuantity: {
          bsonType: 'int',
          minimum: 0,
          description: 'Stock quantity'
        },
        category: {
          bsonType: 'string',
          description: 'Product category'
        },
        isActive: {
          bsonType: 'bool',
          description: 'Whether product is active'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp'
        }
      }
    }
  }
});

db.createCollection('orders', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['customerId', 'orderDate', 'totalAmount', 'status'],
      properties: {
        customerId: {
          bsonType: 'objectId',
          description: 'Customer ID reference - required'
        },
        orderDate: {
          bsonType: 'date',
          description: 'Order date - required'
        },
        totalAmount: {
          bsonType: 'number',
          minimum: 0,
          description: 'Total order amount - required'
        },
        status: {
          enum: ['pending', 'processing', 'completed', 'cancelled'],
          description: 'Order status - required'
        },
        items: {
          bsonType: 'array',
          description: 'Order items',
          items: {
            bsonType: 'object',
            required: ['productId', 'quantity', 'unitPrice'],
            properties: {
              productId: {
                bsonType: 'objectId',
                description: 'Product ID reference'
              },
              quantity: {
                bsonType: 'int',
                minimum: 1,
                description: 'Item quantity'
              },
              unitPrice: {
                bsonType: 'number',
                minimum: 0,
                description: 'Unit price'
              }
            }
          }
        },
        createdAt: {
          bsonType: 'date',
          description: 'Creation timestamp'
        }
      }
    }
  }
});

// Insert sample customers
const customers = db.customers.insertMany([
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Alice Williams',
    email: 'alice.williams@example.com',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Get customer IDs for reference
const customerIds = Object.values(customers.insertedIds);

// Insert sample products
const products = db.products.insertMany([
  {
    name: 'Laptop',
    description: 'High-performance laptop',
    price: 1299.99,
    stockQuantity: 50,
    category: 'Electronics',
    isActive: true,
    createdAt: new Date()
  },
  {
    name: 'Mouse',
    description: 'Wireless mouse',
    price: 29.99,
    stockQuantity: 200,
    category: 'Electronics',
    isActive: true,
    createdAt: new Date()
  },
  {
    name: 'Keyboard',
    description: 'Mechanical keyboard',
    price: 89.99,
    stockQuantity: 150,
    category: 'Electronics',
    isActive: true,
    createdAt: new Date()
  },
  {
    name: 'Monitor',
    description: '27-inch 4K monitor',
    price: 399.99,
    stockQuantity: 75,
    category: 'Electronics',
    isActive: true,
    createdAt: new Date()
  },
  {
    name: 'Desk Chair',
    description: 'Ergonomic office chair',
    price: 249.99,
    stockQuantity: 30,
    category: 'Furniture',
    isActive: true,
    createdAt: new Date()
  }
]);

// Get product IDs for reference
const productIds = Object.values(products.insertedIds);

// Insert sample orders
db.orders.insertMany([
  {
    customerId: customerIds[0],
    orderDate: new Date('2024-01-15'),
    totalAmount: 1329.98,
    status: 'completed',
    items: [
      { productId: productIds[0], quantity: 1, unitPrice: 1299.99 },
      { productId: productIds[1], quantity: 1, unitPrice: 29.99 }
    ],
    createdAt: new Date()
  },
  {
    customerId: customerIds[1],
    orderDate: new Date('2024-01-16'),
    totalAmount: 89.99,
    status: 'completed',
    items: [
      { productId: productIds[2], quantity: 1, unitPrice: 89.99 }
    ],
    createdAt: new Date()
  },
  {
    customerId: customerIds[2],
    orderDate: new Date('2024-01-17'),
    totalAmount: 1699.97,
    status: 'processing',
    items: [
      { productId: productIds[0], quantity: 1, unitPrice: 1299.99 },
      { productId: productIds[3], quantity: 1, unitPrice: 399.99 }
    ],
    createdAt: new Date()
  },
  {
    customerId: customerIds[0],
    orderDate: new Date('2024-01-18'),
    totalAmount: 29.99,
    status: 'completed',
    items: [
      { productId: productIds[1], quantity: 1, unitPrice: 29.99 }
    ],
    createdAt: new Date()
  },
  {
    customerId: customerIds[3],
    orderDate: new Date('2024-01-19'),
    totalAmount: 649.98,
    status: 'pending',
    items: [
      { productId: productIds[3], quantity: 1, unitPrice: 399.99 },
      { productId: productIds[4], quantity: 1, unitPrice: 249.99 }
    ],
    createdAt: new Date()
  }
]);

// Create indexes for better query performance
db.customers.createIndex({ email: 1 }, { unique: true });
db.customers.createIndex({ createdAt: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ isActive: 1 });
db.orders.createIndex({ customerId: 1 });
db.orders.createIndex({ orderDate: 1 });
db.orders.createIndex({ status: 1 });

print('MongoDB test_db initialized successfully with sample data');

