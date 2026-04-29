import os
from dotenv import load_dotenv
load_dotenv()
print(f"CWD: {os.getcwd()}")
print(f"DATABASE_URL from env: {os.getenv('DATABASE_URL')}")
