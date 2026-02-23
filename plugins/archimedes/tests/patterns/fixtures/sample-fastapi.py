from fastapi import FastAPI
import requests

app = FastAPI()

# Should match: core-http-route-fastapi (2 routes)
@app.get("/users/{user_id}")
async def get_user(user_id: str):
    return {"user_id": user_id}

@app.post("/orders")
async def create_order():
    response = requests.get("https://api.example.com")  # Should match: core-http-client-py
    return response.json()
