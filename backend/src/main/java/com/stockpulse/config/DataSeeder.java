package com.stockpulse.config;

import com.stockpulse.model.*;
import com.stockpulse.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final InventoryItemRepository itemRepo;
    private final UserRoleRepository roleRepo;
    private final SupplierRepository supplierRepo;
    private final WarehouseRepository warehouseRepo;
    private final WarehouseStockRepository warehouseStockRepo;
    private final PurchaseOrderRepository purchaseOrderRepo;

    public DataSeeder(InventoryItemRepository itemRepo, UserRoleRepository roleRepo,
                      SupplierRepository supplierRepo, WarehouseRepository warehouseRepo,
                      WarehouseStockRepository warehouseStockRepo, PurchaseOrderRepository purchaseOrderRepo) {
        this.itemRepo = itemRepo;
        this.roleRepo = roleRepo;
        this.supplierRepo = supplierRepo;
        this.warehouseRepo = warehouseRepo;
        this.warehouseStockRepo = warehouseStockRepo;
        this.purchaseOrderRepo = purchaseOrderRepo;
    }

    @Override
    public void run(String... args) {
        if (itemRepo.count() > 0) {
            return;
        }

        seedItems();
        seedRoles();
        seedSuppliers();
        seedWarehouses();
        seedWarehouseStock();
        seedPurchaseOrders();
    }

    private void seedItems() {
        createItem("Wireless Mouse", "WM-001", "Electronics", 45, 10, StockStatus.HEALTHY, 599.00);
        createItem("USB-C Cable", "UC-002", "Electronics", 8, 15, StockStatus.LOW, 249.00);
        createItem("Office Chair", "OC-003", "Furniture", 12, 5, StockStatus.HEALTHY, 8499.00);
        createItem("A4 Paper Ream", "PR-004", "Office Supplies", 0, 20, StockStatus.OUT_OF_STOCK, 350.00);
        createItem("Desk Lamp", "DL-005", "Furniture", 6, 8, StockStatus.LOW, 1299.00);
        createItem("Mechanical Keyboard", "MK-006", "Electronics", 22, 10, StockStatus.HEALTHY, 2999.00);
        createItem("Sticky Notes Pack", "SN-007", "Office Supplies", 3, 10, StockStatus.LOW, 120.00);
        createItem("Monitor Stand", "MS-008", "Electronics", 18, 5, StockStatus.HEALTHY, 1899.00);
    }

    private void createItem(String name, String sku, String category, int stock, int threshold, StockStatus status, double price) {
        InventoryItem item = new InventoryItem(name, sku, category, stock, threshold);
        item.setStatus(status);
        item.setPrice(price);
        itemRepo.save(item);
    }

    private void seedRoles() {
        if (roleRepo.count() > 0) return;
        UserRole admin1 = new UserRole();
        admin1.setEmail("daggupatikarthikeya@gmail.com");
        admin1.setRole(Role.ADMIN);
        roleRepo.save(admin1);

        UserRole admin2 = new UserRole();
        admin2.setEmail("karthikeyadaggupati11@gmail.com");
        admin2.setRole(Role.ADMIN);
        roleRepo.save(admin2);
    }

    private void seedSuppliers() {
        if (supplierRepo.count() > 0) return;
        supplierRepo.save(createSupplier("TechWorld Distributors", "sales@techworld.com", "+1-555-0101", "123 Tech Blvd, San Jose, CA", "Primary electronics supplier"));
        supplierRepo.save(createSupplier("Office Essentials Co.", "orders@officeessentials.com", "+1-555-0202", "456 Paper St, Portland, OR", "Office supplies and paper goods"));
        supplierRepo.save(createSupplier("FurniPro Wholesale", "contact@furnipro.com", "+1-555-0303", "789 Oak Ave, Chicago, IL", "Furniture and ergonomic equipment"));
    }

    private Supplier createSupplier(String name, String email, String phone, String address, String notes) {
        Supplier s = new Supplier();
        s.setName(name);
        s.setContactEmail(email);
        s.setPhone(phone);
        s.setAddress(address);
        s.setNotes(notes);
        return s;
    }

    private void seedWarehouses() {
        if (warehouseRepo.count() > 0) return;
        warehouseRepo.save(createWarehouse("Main Warehouse", "San Jose, CA", true));
        warehouseRepo.save(createWarehouse("East Coast Hub", "New York, NY", false));
        warehouseRepo.save(createWarehouse("Midwest Depot", "Chicago, IL", false));
    }

    private Warehouse createWarehouse(String name, String location, boolean isDefault) {
        Warehouse w = new Warehouse();
        w.setName(name);
        w.setLocation(location);
        w.setDefault(isDefault);
        return w;
    }

    private void seedWarehouseStock() {
        if (warehouseStockRepo.count() > 0) return;
        long[][] data = {
            {1,1,25}, {1,2,5}, {1,3,8}, {1,4,0}, {1,5,3}, {1,6,12}, {1,7,2}, {1,8,10},
            {2,1,10}, {2,2,2}, {2,3,2}, {2,6,5}, {2,8,4},
            {3,1,10}, {3,2,1}, {3,3,2}, {3,5,3}, {3,6,5}, {3,7,1}, {3,8,4}
        };
        for (long[] row : data) {
            WarehouseStock ws = new WarehouseStock();
            ws.setWarehouseId(row[0]);
            ws.setItemId(row[1]);
            ws.setQuantity((int) row[2]);
            warehouseStockRepo.save(ws);
        }
    }

    private void seedPurchaseOrders() {
        if (purchaseOrderRepo.count() > 0) return;
        PurchaseOrder po1 = new PurchaseOrder();
        po1.setItemId(4L);
        po1.setItemName("A4 Paper Ream");
        po1.setSku("PR-004");
        po1.setSupplierId(2L);
        po1.setQuantity(40);
        po1.setStatus(PurchaseOrderStatus.PENDING);
        purchaseOrderRepo.save(po1);

        PurchaseOrder po2 = new PurchaseOrder();
        po2.setItemId(2L);
        po2.setItemName("USB-C Cable");
        po2.setSku("UC-002");
        po2.setSupplierId(1L);
        po2.setQuantity(22);
        po2.setStatus(PurchaseOrderStatus.APPROVED);
        purchaseOrderRepo.save(po2);
    }
}
