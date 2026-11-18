# depø. Inventory and Warehouse Management

Zero blind spots in your supply chain. MERN stack, JWT with bcrypt, ImageKit uploads, Tailwind CSS v4.

## Setup

Requirements: Node 18.12 or newer, a MongoDB Atlas cluster (or local MongoDB), an ImageKit account.

```bash
# 1. API
cd server
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET and the three ImageKit values
npm install
npm run seed              # sample users, warehouses, products, stock, one order, one supply request
npm run dev               # http://localhost:5000

# 2. Web app (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173 (Vite proxies /api to the API)
```

Deployment: set `CLIENT_URL` on the API host to the deployed web URL, and `VITE_API_URL` on the web host to `https://<api-host>/api`.

## Test accounts (created by the seed)

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | admin@depo.com | Admin@123 | Full access |
| Warehouse Manager | manager@depo.com | Manager@123 | Karachi Central only |
| Warehouse Manager | manager2@depo.com | Manager@123 | Lahore Hub only |
| Supplier | supplier@depo.com | Supplier@123 | Owns all seeded products |
| Sales Representative | sales@depo.com | Sales@123 | Has one Pending order |

## Roles

- **Admin**: users, roles, warehouse assignment, products, warehouses, all transactions, all orders, low stock, supply request review.
- **Warehouse Manager**: stock in and stock out in assigned warehouses only, inventory, history, low stock, create and edit products, process orders, review supply requests for their warehouses.
- **Supplier**: own profile and logo, own products, submit supply requests, track Pending, Approved, Rejected.
- **Sales Representative**: search products with live stock, build multi product orders, view own orders, cancel while Pending.

Public registration offers Manager, Supplier and Sales Representative. The API rejects `role: admin` on register.

## Business rules and where they live

| Rule | Implementation |
|---|---|
| Stock never negative | `deductStock` in `server/utils/stock.js` uses `findOneAndUpdate` with a `quantity >= requested` filter, so the check and the decrement are one atomic operation |
| One Stock record per product and warehouse | Compound unique index on Stock, stock in uses upsert with `$inc` |
| Deduct once per order | `processOrder` in `orderController.js` claims the order with filter `status: "Pending"`. A repeated request matches nothing and returns 409. If any line lacks stock, deducted lines are restored and the order returns to Pending |
| Every movement logged | `addStock`, `removeStock`, order processing and supply approval all create StockTransactions |
| Prices | Order totals are calculated on the server from product prices, never from the client |
| Manager scope | Stock, transactions, orders, warehouses and supply requests are filtered by `assignedWarehouses`, and writes return 403 outside them |
| Order and supply request ownership | Sales reps see and cancel only their own orders, suppliers see only their own requests and products |
| Images | React gets a signature from `GET /api/upload/auth`, uploads to ImageKit, then sends URL and fileId. The API verifies with `getFileDetails` that the file exists in your account, is JPG, PNG or WebP, and is 2 MB or less. Invalid files are deleted. Replacing or deleting a record deletes the old file by fileId |

Order status flow: Pending to Processing to Completed. Pending can be Cancelled by the sales rep, an admin or the warehouse manager. Stock is deducted on the move to Processing.

Supply requests: approving adds the quantity to the target warehouse and records a stock in transaction, as requested in the brief.

## API

Auth `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
Users `GET POST /api/users`, `PUT DELETE /api/users/:id`, `GET /api/users/suppliers`
Products `GET POST /api/products`, `GET PUT DELETE /api/products/:id`
Warehouses `GET POST /api/warehouses`, `PUT DELETE /api/warehouses/:id`
Stock `POST /api/stock/in`, `POST /api/stock/out`, `GET /api/stock`, `GET /api/stock/low`
Transactions `GET /api/transactions`
Orders `POST GET /api/orders`, `GET /api/orders/:id`, `PUT /api/orders/:id/status`, `PUT /api/orders/:id/cancel`
Supply `POST GET /api/supply-requests`, `PUT /api/supply-requests/:id/status`
Upload `GET /api/upload/auth`
Stats `GET /api/stats`

## Instructor scenario

1. Sign in as Admin, create users and a warehouse, assign the manager.
2. Add a Laptop with an image, Rs. 80,000, low stock limit 5.
3. As the manager, stock in 20 Laptops, stock out 3. Stock is 17 and two transactions exist.
4. As the sales rep, order 2 Laptops (Rs. 160,000). As manager or admin, process it. Stock is 15.
5. Try ordering more than available. The API rejects it.
6. As manager2, open another warehouse, as a different rep open someone else's order, as Supplier call `GET /api/users`. Each returns 403.

Never commit `.env` files, database credentials, the JWT secret or the ImageKit private key.
