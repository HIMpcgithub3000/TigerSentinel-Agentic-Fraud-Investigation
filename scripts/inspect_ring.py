import pandas as pd

ident = pd.read_csv("data/raw/identity.csv")
ident["TransactionID"] = ident["TransactionID"].astype(str)
target_row = ident[ident["TransactionID"] == "3478561"].iloc[0]
dev_info = str(target_row["DeviceInfo"])
os_info = str(target_row["id_30"])
browser_info = str(target_row["id_31"])
res_info = str(target_row["id_33"])

print("Target device parts:", dev_info, os_info, browser_info, res_info)

matches = ident[(ident["DeviceInfo"] == dev_info) & (ident["id_30"] == os_info) & (ident["id_31"] == browser_info) & (ident["id_33"] == res_info)]
print(f"Matching txns in identity.csv: {len(matches)}")
match_tids = set(matches["TransactionID"])

shared_cards = set()
shared_custs = set()
cols = ["TransactionID", "customer_id", "card1", "ts", "TransactionAmt"]
for chunk in pd.read_csv("data/raw/transactions.csv", chunksize=100000, usecols=cols):  # type: ignore
    chunk["TransactionID"] = chunk["TransactionID"].astype(str)
    hit = chunk[chunk["TransactionID"].isin(match_tids)]
    for _, row in hit.iterrows():
        c_id = str(row["customer_id"]) + "-K" + str(row["card1"])
        shared_cards.add(c_id)
        shared_custs.add(str(row["customer_id"]))
        print(f"Txn {row['TransactionID']}: {c_id}, cust {row['customer_id']}, ts {row['ts']}, amt ${row['TransactionAmt']}")

print(f"Total shared cards: {len(shared_cards)}")
print(f"Total shared customers: {len(shared_custs)}")
