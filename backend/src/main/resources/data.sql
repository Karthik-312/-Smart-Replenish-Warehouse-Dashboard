MERGE INTO inventory_items (id, name, sku, category, current_stock, min_threshold, status, price) KEY(sku) VALUES
(1, 'Wireless Mouse', 'WM-001', 'Electronics', 45, 10, 'HEALTHY', 599.00),
(2, 'USB-C Cable', 'UC-002', 'Electronics', 8, 15, 'LOW', 249.00),
(3, 'Office Chair', 'OC-003', 'Furniture', 12, 5, 'HEALTHY', 8499.00),
(4, 'A4 Paper Ream', 'PR-004', 'Office Supplies', 0, 20, 'OUT_OF_STOCK', 350.00),
(5, 'Desk Lamp', 'DL-005', 'Furniture', 6, 8, 'LOW', 1299.00),
(6, 'Mechanical Keyboard', 'MK-006', 'Electronics', 22, 10, 'HEALTHY', 2999.00),
(7, 'Sticky Notes Pack', 'SN-007', 'Office Supplies', 3, 10, 'LOW', 120.00),
(8, 'Monitor Stand', 'MS-008', 'Electronics', 18, 5, 'HEALTHY', 1899.00);

MERGE INTO user_roles (email, role) KEY(email) VALUES
('daggupatikarthikeya@gmail.com', 'ADMIN'),
('karthikeyadaggupati11@gmail.com', 'ADMIN');

MERGE INTO suppliers (id, name, contact_email, phone, address, notes) KEY(id) VALUES
(1, 'TechWorld Distributors', 'sales@techworld.com', '+1-555-0101', '123 Tech Blvd, San Jose, CA', 'Primary electronics supplier'),
(2, 'Office Essentials Co.', 'orders@officeessentials.com', '+1-555-0202', '456 Paper St, Portland, OR', 'Office supplies and paper goods'),
(3, 'FurniPro Wholesale', 'contact@furnipro.com', '+1-555-0303', '789 Oak Ave, Chicago, IL', 'Furniture and ergonomic equipment');

MERGE INTO warehouses (id, name, location, is_default) KEY(id) VALUES
(1, 'Main Warehouse', 'San Jose, CA', true),
(2, 'East Coast Hub', 'New York, NY', false),
(3, 'Midwest Depot', 'Chicago, IL', false);

MERGE INTO warehouse_stock (id, warehouse_id, item_id, quantity) KEY(id) VALUES
(1, 1, 1, 25), (2, 1, 2, 5), (3, 1, 3, 8), (4, 1, 4, 0), (5, 1, 5, 3), (6, 1, 6, 12), (7, 1, 7, 2), (8, 1, 8, 10),
(9, 2, 1, 10), (10, 2, 2, 2), (11, 2, 3, 2), (12, 2, 6, 5), (13, 2, 8, 4),
(14, 3, 1, 10), (15, 3, 2, 1), (16, 3, 3, 2), (17, 3, 5, 3), (18, 3, 6, 5), (19, 3, 7, 1), (20, 3, 8, 4);

MERGE INTO purchase_orders (id, item_id, item_name, sku, supplier_id, quantity, status, created_at, updated_at) KEY(id) VALUES
(1, 4, 'A4 Paper Ream', 'PR-004', 2, 40, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 2, 'USB-C Cable', 'UC-002', 1, 22, 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
