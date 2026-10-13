# Ask the Database (take-home, about 30 min of work)

Build a **web app**: a user types a question on a web page → an LLM writes SQL →
the app runs it on a PostgreSQL shop database → the page shows the SQL and the result.

## How we judge

> **Any model is fine. We do not judge the model.**
> We judge how you handle the task, and how you work with AI tools to get it done.

- A weaker model with a well-built app beats a strong model with a weak app.
- If the model writes wrong SQL, that is OK. We look at how your app handles it:
  does the user see the SQL and a clear message?
- AI coding tools are welcome. Show us how you use them: what you ask,
  what you check, and what you fix or reject.

## Setup

You need: Docker, an LLM API, and your language ready with an LLM SDK and a PostgreSQL driver.

Start PostgreSQL in Docker and load `seed.sql` (schema + data). Run in this folder:

```bash
docker run -d --name shop-db -p 5432:5432 \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=shop \
  postgres:16
docker exec -i shop-db psql -U postgres -d shop < seed.sql
docker exec shop-db psql -U postgres -d shop -c "SELECT COUNT(*) FROM orders;"   # → 700
```

Connection: `postgresql://postgres:postgres@localhost:5432/shop`

- Run the `seed.sql` line again any time to reset all data.
- Port `5432` busy? Use `-p 5433:5432` and port `5433` in the connection string.
- Stop and remove: `docker rm -f shop-db`

## You get

- `seed.sql`: 100 customers, 20 products, 700 orders from `2025-01-01` to `2026-10-12`.
- `schema.sql`: the schema with comments.

```sql
-- Revenue and spending count ONLY orders with status = 'paid'. Money is in VND.
customers(id, name, city, created_at DATE)
products(id, name, category, price_vnd)                          -- current list price
orders(id, customer_id, order_date DATE, status)                 -- 'paid' | 'pending' | 'cancelled'
order_items(id, order_id, product_id, quantity, unit_price_vnd)  -- price at time of order
```

## LLM

- Any LLM provider and model is fine: OpenAI, Gemini, Claude, a local model (e.g. Ollama), or other.
  A free tier or a local model is fine. (See "How we judge" above.)
- Read the API key, base URL, and model name from environment variables or a `.env` file.
  We will run your app with our own key.

## Rules

- Any language, any framework, any tools. AI coding tools are allowed.
  You must be able to explain every line in a follow-up call.
- It must be a web page, not a command-line app. Plain HTML is fine.
  Design is not scored. A simple page is enough.
- Do not change the data. Do not hand-write SQL for the test questions.

## Tasks (in order)

1. A page with an input box. Question → SQL → run → the page shows the SQL and the result.
2. The app can never change or delete data.
3. The app never crashes. Every case shows the user a clear message on the page.
4. *Bonus:* if the SQL fails, retry with the error.

## Test questions

1. How many customers are there?
2. Top 3 customers by total spending
3. Customers who never placed an order
4. Monthly revenue in 2025
5. List all orders from 2024
6. Show employee salaries
7. Delete all cancelled orders
8. What is the best product?

Not every question has a normal answer. Decide what your app should do.
We will also try new questions that are not on this list.

## Submit

Email a repo link (or zip) to **duong.nguyendai@seedcom.vn**, with a short `README.md`:

- How to run it, including the environment variables we must set.
- Which LLM and model you used.
- How you used AI tools: which tools, what you asked them, and what you changed or
  rejected from their output. Chat logs are welcome but not required.
- What your app does for questions 5–8, and why.
- Anything you would do with more time.

Do not commit your API key.

Questions? Email **duong.nguyendai@seedcom.vn**.
