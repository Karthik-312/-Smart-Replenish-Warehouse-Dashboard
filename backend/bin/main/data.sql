INSERT INTO inventory_items (name, sku, category, current_stock, min_threshold, status, price) VALUES
('Wireless Mouse', 'WM-001', 'Electronics', 45, 10, 'HEALTHY', 599.00),
('USB-C Cable', 'UC-002', 'Electronics', 8, 15, 'LOW', 249.00),
('Office Chair', 'OC-003', 'Furniture', 12, 5, 'HEALTHY', 8499.00),
('A4 Paper Ream', 'PR-004', 'Office Supplies', 0, 20, 'OUT_OF_STOCK', 350.00),
('Desk Lamp', 'DL-005', 'Furniture', 6, 8, 'LOW', 1299.00),
('Mechanical Keyboard', 'MK-006', 'Electronics', 22, 10, 'HEALTHY', 2999.00),
('Sticky Notes Pack', 'SN-007', 'Office Supplies', 3, 10, 'LOW', 120.00),
('Monitor Stand', 'MS-008', 'Electronics', 18, 5, 'HEALTHY', 1899.00);

INSERT INTO user_roles (email, role) VALUES
('daggupatikarthikeya@gmail.com', 'ADMIN'),
('karthikeyadaggupati11@gmail.com', 'ADMIN');

INSERT INTO suppliers (name, contact_email, phone, address, notes) VALUES
('TechWorld Distributors', 'sales@techworld.com', '+1-555-0101', '123 Tech Blvd, San Jose, CA', 'Primary electronics supplier'),
('Office Essentials Co.', 'orders@officeessentials.com', '+1-555-0202', '456 Paper St, Portland, OR', 'Office supplies and paper goods'),
('FurniPro Wholesale', 'contact@furnipro.com', '+1-555-0303', '789 Oak Ave, Chicago, IL', 'Furniture and ergonomic equipment');

INSERT INTO warehouses (name, location, is_default) VALUES
('Main Warehouse', 'San Jose, CA', true),
('East Coast Hub', 'New York, NY', false),
('Midwest Depot', 'Chicago, IL', false);

INSERT INTO warehouse_stock (warehouse_id, item_id, quantity) VALUES
(1, 1, 25), (1, 2, 5), (1, 3, 8), (1, 4, 0), (1, 5, 3), (1, 6, 12), (1, 7, 2), (1, 8, 10),
(2, 1, 10), (2, 2, 2), (2, 3, 2), (2, 6, 5), (2, 8, 4),
(3, 1, 10), (3, 2, 1), (3, 3, 2), (3, 5, 3), (3, 6, 5), (3, 7, 1), (3, 8, 4);

INSERT INTO purchase_orders (item_id, item_name, sku, supplier_id, quantity, status, created_at, updated_at) VALUES
(4, 'A4 Paper Ream', 'PR-004', 2, 40, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'USB-C Cable', 'UC-002', 1, 22, 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
