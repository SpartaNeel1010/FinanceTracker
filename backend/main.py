from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes import auth, transactions, budgets, goals, ai, subscriptions, achievements

app = FastAPI(
    title="SpendSense API",
    description="AI-Powered Financial Behavior Analyzer Backend",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(budgets.router)
app.include_router(goals.router)
app.include_router(ai.router)
app.include_router(subscriptions.router)
app.include_router(achievements.router)


@app.on_event("startup")
def startup():
    init_db()
    print(" SpendSense API started")


@app.get("/")
def root():
    return {"message": "SpendSense API", "version": "1.0.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
