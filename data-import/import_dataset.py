import pandas as pd
from pymongo import MongoClient

# Read CSV
df = pd.read_csv("IPL.csv", encoding="latin1")

# Connect to MongoDB Atlas
client = MongoClient("mongodb+srv://aayushbharda999:CrSdcVu15SswGWtH@clusterone.yl5hmvq.mongodb.net/cricket-intelligence")

# Select DB (same as your Compass)
db = client["cricket-intelligence"]

# Collection
collection = db["deliveries"]

# Convert to JSON
data = df.to_dict("records")

# Insert in batches (VERY IMPORTANT for large data)
batch_size = 5000

for i in range(0, len(data), batch_size):
    collection.insert_many(data[i:i+batch_size])
    print(f"Inserted {i} to {i+batch_size}")

print("All data inserted 🚀")