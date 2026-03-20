import pandas as pd
from pymongo import MongoClient

# Read CSV
df = pd.read_csv("IPL.csv")

# Connect MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["cricket_db"]

collection = db["test_data"]

# Convert to JSON
data = df.head(100).to_dict("records")  # only 100 rows for test

# Insert into Mongo
collection.insert_many(data)

print("Data inserted successfully!")
