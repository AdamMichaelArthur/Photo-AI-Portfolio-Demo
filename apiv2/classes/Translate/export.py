import os
import sys
from pymongo import MongoClient
from bson import ObjectId
import re
from dateutil import parser

# Function to check if a string is a URL
def is_url(string):
    regex = re.compile(
        r'^(?:http|ftp)s?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+'  # domain...
        r'(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain name
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|'  # ...or ipv4
        r'\[?[A-F0-9]*:[A-F0-9:]+\]?)'  # ...or ipv6
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)  # rest of url
    return re.match(regex, string) is not None

# Function to check if a string is a date
def is_date(string):
    try:
        parser.parse(string)
        return True
    except ValueError:
        return False

# Function to recursively extract all values from a document, excluding certain types
def extract_values(doc):
    if isinstance(doc, dict):
        for value in doc.values():
            if isinstance(value, dict):
                yield from extract_values(value)
            elif isinstance(value, list):
                for item in value:
                    if not (isinstance(item, (ObjectId, bool)) or isinstance(item, (int, float)) or is_url(str(item)) or is_date(str(item))):
                        yield item
            elif not (isinstance(value, (ObjectId, bool)) or isinstance(value, (int, float)) or is_url(str(value)) or is_date(str(value))):
                yield value
    elif isinstance(doc, list):
        for item in doc:
            if isinstance(item, (dict, list)):
                yield from extract_values(item)
            elif not (isinstance(item, (ObjectId, bool)) or isinstance(item, (int, float)) or is_url(str(item)) or is_date(str(item))):
                yield item

# MongoDB connection environment variables
DB_USERNAME = os.getenv('DB_USERNAME', 'adam')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'dino')
DB_PORT = os.getenv('DB_PORT', '27017')
DB_DOMAIN = os.getenv('DB_DOMAIN', '159.223.2.58')
DB_NAME = os.getenv('DB_NAME', 'food-delivery-app')
DB_AUTHDB = os.getenv('DB_AUTHDB', 'admin')
DB_REPLICASET = os.getenv('DB_REPLICASET', 'rs0')
directConnection = os.getenv('directConnection', 'true')

# MongoDB connection string
connection_string = f"mongodb://{DB_USERNAME}:{DB_PASSWORD}@{DB_DOMAIN}:{DB_PORT}/?authSource={DB_AUTHDB}&replicaSet={DB_REPLICASET}&directConnection={directConnection}"

# Connect to the MongoDB client
client = MongoClient(connection_string)

# Select the database and collection
db = client[DB_NAME]
collection = db['items']

# Extract and store unique values from each document
unique_values = set()
for document in collection.find({}):
    unique_values.update(extract_values(document))

# Check for output file argument
if len(sys.argv) > 1:
    output_file = sys.argv[1]
    with open(output_file, 'w') as file:
        for value in unique_values:
            file.write(str(value) + '\n')
else:
    print("No output file provided. Printing to console:")
    for value in unique_values:
        print(value)

