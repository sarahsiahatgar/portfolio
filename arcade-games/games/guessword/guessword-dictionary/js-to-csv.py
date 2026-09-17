import csv

words = [
 "ABART", "ABBAU", "ABEND", "ABGAS", "ABORT", "ABRUF", "ABTEI", "ABWEG", "ABZUG", 
  "ÄTHYL", "ÄTSCH", "ÄTZTE", "ÄUGST", "ÄUGTE", "ÄXTEN", "SCHÖN"
]

# Using 'utf-8-sig' adds a BOM so Excel reads special characters automatically
with open("dict-words.csv", mode="w", newline="", encoding="utf-8-sig") as file:
    writer = csv.writer(file)
    
    for word in words:
        writer.writerow([word])

print("CSV file created successfully as 'dict-words.csv'!")