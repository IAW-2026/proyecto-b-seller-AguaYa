# 1.3 — Inter-Service API Design

> **Type B — Delivery Platform**

Document each endpoint that an app exposes to be consumed by another app in the system. This contract must be agreed upon by all team members before starting Stage 2.

---

## 1. Seller App — Endpoints exposed

> **Owner:** Orders and vendor data

---

### Get Orders Ready for Delivery

| Field | Detail |
| :---- | :---- |
| **Use Case** | Get orders with status "ready" to be picked up by delivery |
| **Endpoint** | `GET /api/orders/status/ready` |
| **Request** | — |
| **Response** | `200 OK` — Array of orders with status `ready` |
| **Communication** | Sync (REST) — consumed by **Delivery App** |

---

### Browse Catalogs / Search Product

| Field | Detail |
| :---- | :---- |
| **Use Case** | List all available catalogs or search for a specific product |
| **Endpoint** | `GET /api/catalogs` |
| **Request** | Query params: `search` *(optional)* |
| **Response** | `200 OK` — Array of catalogs / products |
| **Communication** | Sync (REST) — consumed by **Buyer App** |

---

### Browse Vendors

| Field | Detail |
| :---- | :---- |
| **Use Case** | List all available vendors |
| **Endpoint** | `GET /api/vendors` |
| **Request** | — |
| **Response** | `200 OK` — Array of vendors |
| **Communication** | Sync (REST) — consumed by **Buyer App** |

---

### Get Order Status

| Field | Detail |
| :---- | :---- |
| **Use Case** | Check the current status of a specific order |
| **Endpoint** | `GET /api/orders/:orderId/status` |
| **Request** | Path param: `orderId` |
| **Response** | `200 OK` — `{ orderId, status }` |
| **Communication** | Sync (REST) — consumed by **Buyer App** |

---

### Get Order

| Field | Detail |
| :---- | :---- |
| **Use Case** | Retrieve full details of a specific order, including associated invoice data |
| **Endpoint** | `GET /api/orders/:orderId` |
| **Request** | Path param: `orderId` |
| **Response** | `200 OK` — Order object with full details, including `invoice` field |
| **Communication** | Sync (REST) — consumed by **Buyer App**, **Delivery App** |

---

### Get Favorite Vendors

| Field | Detail |
| :---- | :---- |
| **Use Case** | Retrieve a list of vendors by IDs (used for favorites) |
| **Endpoint** | `GET /api/vendors?ids=1,2,3` |
| **Request** | Query param: `ids` — comma-separated vendor IDs |
| **Response** | `200 OK` — Array of matching vendors |
| **Communication** | Sync (REST) — consumed by **Buyer App** |

---

### Get Seller Data for Review

| Field | Detail |
| :---- | :---- |
| **Use Case** | Retrieve seller information needed to display a review |
| **Endpoint** | `GET /api/sellers/:sellerId` |
| **Request** | Path param: `sellerId` |
| **Response** | `200 OK` — Seller profile object |
| **Communication** | Sync (REST) — consumed by **Feedback App** |

---

### Start Delivery Route

| Field | Detail |
| :---- | :---- |
| **Use Case** | Notify that a delivery driver has started the route for an order |
| **Endpoint** | `POST /api/orders/:orderId/start-delivery` |
| **Request** | Path param: `orderId` |
| **Response** | `200 OK` — Updated order object |
| **Communication** | Sync (REST) — consumed by **Delivery App** |

---

### Notify Payment Confirmed (to Seller)

| Field | Detail |
| :---- | :---- |
| **Use Case** | Notify the seller that a payment has been confirmed for an order |
| **Endpoint** | `POST /api/orders/:orderId/payment-confirmed` |
| **Request** | Path param: `orderId` — Body: `{ paymentId, status }` |
| **Response** | `200 OK` — Acknowledgement |
| **Communication** | Sync (REST) — consumed by **Payments App** |

---

### Update Order Status

| Field | Detail |
| :---- | :---- |
| **Use Case** | Update the status of an existing order (used by Delivery App for both route start and status changes) |
| **Endpoint** | `PUT /api/orders/:orderId/status` |
| **Request** | Path param: `orderId` — Body: `{ status }` |
| **Response** | `200 OK` — Updated order object |
| **Communication** | Sync (REST) — consumed by **Delivery App** |

---

## 2. Buyer App — Endpoints exposed

> **Owner:** Customer data and claims

---

### Get Claims

| Field | Detail |
| :---- | :---- |
| **Use Case** | Retrieve claims associated with a specific order |
| **Endpoint** | `GET /api/claims/:orderId` |
| **Request** | Path param: `orderId` |
| **Response** | `200 OK` — Array of claims for the order |
| **Communication** | Sync (REST) — consumed by **Seller App** |

---

### Notify Payment Confirmed (to Buyer)

| Field | Detail |
| :---- | :---- |
| **Use Case** | Notify the buyer that their payment has been confirmed |
| **Endpoint** | `POST /api/buyers/:buyerId/payment-confirmed` |
| **Request** | Path param: `buyerId` — Body: `{ orderId, paymentId, status }` |
| **Response** | `200 OK` — Acknowledgement |
| **Communication** | Sync (REST) — consumed by **Payments App** |

---

## 3. Payments App — Endpoints exposed

> **Owner:** Transactions and invoices

---

### Validate Payment to Enable Review

| Field | Detail |
| :---- | :---- |
| **Use Case** | Check if a payment exists and is confirmed for a given order, to allow the buyer to post a review |
| **Endpoint** | `GET /api/status/:orderId` |
| **Request** | Path param: `orderId` |
| **Response** | `200 OK` — `{ orderId, paymentStatus }` |
| **Communication** | Sync (REST) — consumed by **Feedback App** |

---

### Confirm Purchase / Checkout

| Field | Detail |
| :---- | :---- |
| **Use Case** | Process a purchase and generate a MercadoPago payment link |
| **Endpoint** | `POST /api/checkout` |
| **Request** | Body: `{ buyerId, orderId, amount, items[] }` |
| **Response** | `201 Created` — `{ checkoutUrl, paymentId }` |
| **Communication** | Sync (REST) — consumed by **Buyer App** |

---

## 4. Delivery App — Endpoints exposed

> **Owner:** Routes and trip assignments

---

### Get Trip Statuses by Driver

| Field | Detail |
| :---- | :---- |
| **Use Case** | Retrieve the current status of all trips assigned to a specific driver |
| **Endpoint** | `GET /api/routes/:driverId` |
| **Request** | Path param: `driverId` |
| **Response** | `200 OK` — Array of trips with statuses |
| **Communication** | Sync (REST) — consumed by **Seller App**, **Buyer App** |

---

### Assign Ready Order to Driver

| Field | Detail |
| :---- | :---- |
| **Use Case** | Assign an order that is ready for pickup to a delivery driver |
| **Endpoint** | `PUT /api/ready_orders/:orderId` |
| **Request** | Path param: `orderId` — Body: `{ driverId }` |
| **Response** | `200 OK` — Updated assignment object |
| **Communication** | Sync (REST) — consumed by **Seller App** |

---

## 5. Feedback App — Endpoints exposed

> **Owner:** Ratings and support system

---

### Get Ratings for Seller

| Field | Detail |
| :---- | :---- |
| **Use Case** | Retrieve aggregated ratings for a specific seller |
| **Endpoint** | `GET /api/feedback/ratings/:sellerId` |
| **Request** | Path param: `sellerId` |
| **Response** | `200 OK` — `{ sellerId, averageRating, totalReviews }` |
| **Communication** | Sync (REST) — consumed by **Seller App**, **Buyer App** |

---

### Get Reviews for Seller

| Field | Detail |
| :---- | :---- |
| **Use Case** | List all visible reviews for a specific seller |
| **Endpoint** | `GET /api/feedback/reviews/:sellerId` |
| **Request** | Path param: `sellerId` |
| **Response** | `200 OK` — Array of review objects |
| **Communication** | Sync (REST) — consumed by **Buyer App** |

---

### Get FAQs

| Field | Detail |
| :---- | :---- |
| **Use Case** | Retrieve the list of frequently asked questions |
| **Endpoint** | `GET /api/feedback/faqs` |
| **Request** | — |
| **Response** | `200 OK` — Array of FAQ entries |
| **Communication** | Sync (REST) — consumed by **Buyer App** |

---

### Post / Soft-Delete Review

| Field | Detail |
| :---- | :---- |
| **Use Case** | Create a new review or soft-delete an existing one (owned by the buyer) |
| **Endpoint** | `POST /api/feedback/reviews` |
| **Request** | Body: `{ buyerId, sellerId, orderId, rating, comment, deleted?: true }` |
| **Response** | `201 Created` — Review object / `200 OK` — Soft-deleted review |
| **Communication** | Sync (REST) — consumed by **Buyer App** |

---

<!-- Add sections for each additional integration identified -->
