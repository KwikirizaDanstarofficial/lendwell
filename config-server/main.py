from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

SUPABASE_URL             = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY        = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE    = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

CLIENT_CONFIG = {
    "supabaseUrl":           SUPABASE_URL,
    "supabaseAnonKey":       SUPABASE_ANON_KEY,
    "powersyncUrl":          os.getenv("POWERSYNC_URL"),
    "egoSmsApiKey":          os.getenv("EGOSMS_API_KEY"),
    "egoSmsUsername":        os.getenv("EGOSMS_USERNAME"),
    "flutterwavePublicKey":  os.getenv("FLUTTERWAVE_PUBLIC_KEY"),
    "flutterwaveSecretKey":  os.getenv("FLUTTERWAVE_SECRET_KEY"),
}


class LoginRequest(BaseModel):
    email: str
    password: str


@app.post("/login")
async def login(body: LoginRequest):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Content-Type": "application/json",
            },
            json={"email": body.email, "password": body.password},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    session = response.json()

    return {
        "accessToken":  session["access_token"],
        "refreshToken": session["refresh_token"],
        "config":       CLIENT_CONFIG,
    }


@app.get("/health")
def health():
    return {"status": "ok"}
