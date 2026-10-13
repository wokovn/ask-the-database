export class SchemaService {
  public getSchemaDescription(): string {
    return `-- Online shop PostgreSQL schema.
-- Business rules:
-- 1. Revenue and customer spending count ONLY orders with status = 'paid'.
-- 2. All money is in VND.
-- 3. Items pricing at order time is stored in order_items.unit_price_vnd.

TABLE customers (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    city        TEXT NOT NULL,            -- e.g. 'Ha Noi', 'TP.HCM', 'Da Nang', 'Can Tho'
    created_at  DATE NOT NULL
);

TABLE products (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,            -- e.g. 'drink', 'snack', 'household', 'personal care'
    price_vnd   INTEGER NOT NULL          -- current list price
);

TABLE orders (
    id           INTEGER PRIMARY KEY,
    customer_id  INTEGER NOT NULL REFERENCES customers(id),
    order_date   DATE NOT NULL,
    status       TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'cancelled'))
);

TABLE order_items (
    id              INTEGER PRIMARY KEY,
    order_id        INTEGER NOT NULL REFERENCES orders(id),
    product_id      INTEGER NOT NULL REFERENCES products(id),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_vnd  INTEGER NOT NULL      -- price at time of order (quantity * unit_price_vnd = total line cost)
);`;
  }
}
