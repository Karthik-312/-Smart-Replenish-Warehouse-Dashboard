INSERT INTO inventory_items (name, sku, category, current_stock, min_threshold, status) VALUES
('Wireless Mouse', 'WM-001', 'Electronics', 45, 10, 'HEALTHY'),
('USB-C Cable', 'UC-002', 'Electronics', 8, 15, 'LOW'),
('Office Chair', 'OC-003', 'Furniture', 12, 5, 'HEALTHY'),
('A4 Paper Ream', 'PR-004', 'Office Supplies', 0, 20, 'OUT_OF_STOCK'),
('Desk Lamp', 'DL-005', 'Furniture', 6, 8, 'LOW'),
('Mechanical Keyboard', 'MK-006', 'Electronics', 22, 10, 'HEALTHY'),
('Sticky Notes Pack', 'SN-007', 'Office Supplies', 3, 10, 'LOW'),
('Monitor Stand', 'MS-008', 'Electronics', 18, 5, 'HEALTHY');

INSERT INTO user_roles (email, role) VALUES
('daggupatikarthikeya@gmail.com', 'ADMIN'),
('karthikeyadaggupati11@gmail.com', 'ADMIN');

INSERT INTO suppliers (name, contact_email, phone, address, notes) VALUES
('TechWorld Distributors', 'sales@techworld.com', '+1-555-0101', '123 Tech Blvd, San Jose, CA', 'Primary electronics supplier'),
('Office Essentials Co.', 'orders@officeessentials.com', '+1-555-0202', '456 Paper St, Portland, OR', 'Office supplies and paper goods'),
('FurniPro Wholesale', 'contact@furnipro.com', '+1-555-0303', '789 Oak Ave, Chicago, IL', 'Furniture and ergonomic equipment');
