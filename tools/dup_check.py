import openpyxl

wb_info = openpyxl.load_workbook('d:/code/Dream/정보Table.xlsx', data_only=True)
s_gear = wb_info['장비아이템']

gears = {}
for r in list(s_gear.iter_rows(values_only=True))[1:]:
    if not any(r): continue
    name = str(r[0]).strip() if r[0] else ""
    cat = str(r[1]).strip() if r[1] else ""
    grade = str(r[2]).strip() if r[2] else ""
    lvl = r[3]
    if not name: continue
    if name not in gears:
        gears[name] = []
    gears[name].append((cat, grade, lvl))

duplicates = {k: v for k, v in gears.items() if len(v) > 1}

out = [f"Total duplicate item names in 장비아이템: {len(duplicates)}"]
for k, v in duplicates.items():
    out.append(f"  {k}: {v}")

with open('d:/code/Dream/tools/dup_check.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(out))

print("DONE")
