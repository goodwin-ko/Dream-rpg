import openpyxl

wb = openpyxl.load_workbook('d:/code/Dream/dream01.xlsx', data_only=True)
ws = wb['무기']
for r_idx in range(100, 115):
    row = [c for c in ws[r_idx] if c.value is not None]
    row_vals = [c.value for c in row]
    print(f"Row {r_idx}: {row_vals}")
