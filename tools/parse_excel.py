import openpyxl
import json
import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXCEL_PATH = os.path.join(BASE_DIR, 'dream01.xlsx')
OUTPUT_JSON = os.path.join(BASE_DIR, 'data', 'game_data.json')
OUTPUT_JS = os.path.join(BASE_DIR, 'data', 'game_data.js')

# Normalization dictionary for typos / variations across all sheets
ALIAS_MAP = {
    "천공의 성스로운 갑옷": "천공의 성스러운 갑옷",
    "여혼 정화의 성목": "영혼 정화의 성목",
    "빛의 그레 일린": "빛의 그레일린",
    "빛의 그러일런": "빛의 그레일린",
    "얼음 그림자 아퀄리스": "얼음 그림자 아퀼리스",
    "속세의 및-우키요에 두루마리": "속세의 빛-우키요에 두루마리",
    "속세의및-우키요에 두루마리": "속세의 빛-우키요에 두루마리",
    "피의문양": "피의 문양",
    "영혼정화의 성목": "영혼 정화의 성목",
    "암흑의 회환": "암흑의 회한",
    "별의정령 알갈론": "별의정령 알갈론",
    "별의 정령 알갈론": "별의정령 알갈론",
    "빛의 정령 알갈론": "별의정령 알갈론",
    "별의 정령 알칼론": "별의정령 알갈론",
    "전생의 천사 임페리우스": "전쟁의 천사 임페리우스",
    "전쟁의 전사 임페리우스": "전쟁의 천사 임페리우스",
    "셩역의 대사제": "성역의 대사제",
    "여왕 아즈사라": "아즈샤라 여왕",
    "여왕 아즈샤라": "아즈샤라 여왕",
    "작열하는 용 이그닐": "작열하는 용 이그니르",
    "빙하의 죽음벌래 형제": "빙하의 죽음 벌레",
    "빙하의 죽음벌레 형제": "빙하의 죽음 벌레",
    "빙하의 죽음벌레": "빙하의 죽음 벌레",
    "마리안느": "저주받은 인형 마리안느",
    "실프": "광풍의 실프",
    "화염의 만샤": "광염의 만샤",
    "망령 메르겔": "망령 메르켈",
    "혈마의 시체": "피의 시체",
    "용망의 눈": "욕망의 눈",
    "명하의 수정 가지": "명해의 수정 가지",
    "점염마의 피": "적염마의 피",
    "열세의 화염깃": "멸세의 화염깃",
    "얼음 환상 바닞": "얼음 환상 반지",
    "결울 빙모": "겨울 빙모",
    "만샤의 영혼 햇불": "만샤의 영혼 횃불",
    "혼돈의 결정": "혼돈의 혈정",
    "성령의 조각": "성령석 조각",
    "지옥석": "지옥석 조각",
    "지옥볼의 핵": "지옥불의 핵",
    "파천의뇌석": "파천의 뇌석",
}

def clean_str(s):
    if s is None:
        return ""
    val = str(s).strip()
    return ALIAS_MAP.get(val, val)

def clean_lvl(s):
    if not s:
        return ""
    val = str(s).strip()
    m = re.search(r'\d+', val)
    return m.group(0) if m else val

def detect_columns(header_row):
    col_map = {}
    for idx, col in enumerate(header_row):
        c = str(col).strip() if col is not None else ""
        if c in ["종류", "분류", "부위"]:
            col_map["category"] = idx
        elif c in ["아이템 이름", "아이템", "최종템", "아이템이름", "장비"]:
            col_map["item"] = idx
        elif c in ["재료", "필요재료", "재료이름"]:
            col_map["material"] = idx
        elif c in ["개수", "수량"]:
            col_map["qty"] = idx
        elif c in ["보스", "드랍보스", "획득처", "보스이름"]:
            col_map["boss"] = idx
        elif c in ["레벨", "Lv", "렙"]:
            col_map["level"] = idx
    return col_map

def parse_excel(file_path):
    wb = openpyxl.load_workbook(file_path, data_only=True)
    game_data = {
        "jobs": {},
        "bosses": [],
        "job_list": []
    }

    known_jobs = [
        "프리스트", "가디언", "드루이드", "블레이드 스피릿", "버서커", "팔라딘", "워리어", "크루세이더",
        "소드마스터", "다크나이트", "블레이더", "랜서", "어쌔신",
        "스나이퍼", "보우마스터", "헌터", "트릭스터", "메이지",
        "아크메이지", "워록", "네크로맨서", "소서러", "엘리멘탈리스트",
        "샤먼", "수도승", "몽크", "퇴마사",
        "음유시인", "기공사", "격투가", "소울브링어", "블랙스미스", "연금술사"
    ]
    game_data["all_job_list"] = known_jobs

    # 1. Parse Boss sheet first if exists
    boss_level_lookup = {}
    item_to_boss = {}
    if "보스" in wb.sheetnames:
        ws_boss = wb["보스"]
        rows = [r for r in ws_boss.iter_rows(values_only=True) if any(cell is not None for cell in r)]
        if rows:
            boss_map = {}
            col_map = detect_columns(rows[0])
            c_boss = col_map.get("boss", 0)
            c_lvl = col_map.get("level", 1)
            c_item = col_map.get("item", 2)
            c_cat = col_map.get("category", 3)

            for row in rows[1:]:
                if not any(row):
                    continue
                b_name = clean_str(row[c_boss]) if len(row) > c_boss else ""
                lvl = clean_lvl(row[c_lvl]) if len(row) > c_lvl else ""
                item_name = clean_str(row[c_item]) if len(row) > c_item else ""
                category = clean_str(row[c_cat]) if len(row) > c_cat else "아이템"
                
                if not b_name:
                    continue

                if b_name not in boss_map:
                    boss_map[b_name] = {
                        "name": b_name,
                        "level": int(lvl) if lvl.isdigit() else 0,
                        "level_str": f"Lv.{lvl}" if lvl else "",
                        "drops": []
                    }
                if item_name:
                    boss_map[b_name]["drops"].append({
                        "name": item_name,
                        "type": category
                    })
                    item_to_boss[item_name] = {"boss": b_name, "level": int(lvl) if lvl.isdigit() else 0}
                    item_to_boss[clean_str(item_name)] = {"boss": b_name, "level": int(lvl) if lvl.isdigit() else 0}

            game_data["bosses"] = sorted(list(boss_map.values()), key=lambda x: (x["level"], x["name"]))
            boss_level_lookup = {b["name"]: b["level"] for b in game_data["bosses"]}

    # 2. Parse Job sheets
    for sheetname in wb.sheetnames:
        name_clean = sheetname.strip()
        if name_clean == "보스" or name_clean.startswith("Sheet"):
            continue

        sheet = wb[sheetname]
        rows = [r for r in sheet.iter_rows(values_only=True) if any(cell is not None for cell in r)]
        if len(rows) < 2:
            continue

        job_name = name_clean
        if job_name not in game_data["job_list"]:
            game_data["job_list"].append(job_name)

        # Detect header row index
        h_idx = 0
        for idx, r in enumerate(rows):
            cm = detect_columns(r)
            if "item" in cm or "material" in cm:
                h_idx = idx
                break

        col_map = detect_columns(rows[h_idx])
        c_cat = col_map.get("category", 0)
        c_item = col_map.get("item", 1)
        c_mat = col_map.get("material", 2)
        c_qty = col_map.get("qty", 3)
        c_boss = col_map.get("boss", 4)
        c_lvl = col_map.get("level", 5)

        # Pre-scan recipe names to distinguish combo sub-recipes from raw boss drops
        all_job_recipes = set()
        for row in rows[h_idx + 1:]:
            it = clean_str(row[c_item]) if len(row) > c_item else ""
            if it:
                all_job_recipes.add(it)

        recipes = []
        current_cat = ""
        current_item = ""
        current_recipe = None

        for row in rows[h_idx + 1:]:
            cat = clean_str(row[c_cat]) if len(row) > c_cat else ""
            item = clean_str(row[c_item]) if len(row) > c_item else ""
            mat = clean_str(row[c_mat]) if len(row) > c_mat else ""
            qty = clean_str(row[c_qty]) if len(row) > c_qty else "1"
            boss = clean_str(row[c_boss]) if len(row) > c_boss else ""
            lvl = clean_lvl(row[c_lvl]) if len(row) > c_lvl else ""

            if cat:
                current_cat = cat

            if item and item != current_item:
                current_item = item
                current_recipe = {
                    "category": current_cat,
                    "name": current_item,
                    "materials": []
                }
                recipes.append(current_recipe)

            if mat and current_recipe:
                q_val = 1
                if qty and qty.isdigit():
                    q_val = int(qty)
                elif "*" in mat:
                    parts = mat.split("*")
                    mat_name = parts[0].strip()
                    if len(parts) > 1 and parts[1].strip().isdigit():
                        q_val = int(parts[1].strip())
                        mat = mat_name

                # Auto-resolve missing boss and level from boss drops
                if not boss:
                    if mat in all_job_recipes:
                        boss = "조합템"
                    elif mat in item_to_boss:
                        boss = item_to_boss[mat]["boss"]
                        if not lvl:
                            lvl = str(item_to_boss[mat]["level"])
                    elif clean_str(mat) in item_to_boss:
                        boss = item_to_boss[clean_str(mat)]["boss"]
                        if not lvl:
                            lvl = str(item_to_boss[clean_str(mat)]["level"])
                    else:
                        boss = "조합템"

                # Auto-fill level from boss if missing
                if not lvl and boss:
                    b_lvl = boss_level_lookup.get(boss, 0)
                    if b_lvl > 0:
                        lvl = str(b_lvl)

                current_recipe["materials"].append({
                    "name": mat,
                    "qty": q_val,
                    "boss": boss if boss else "조합템",
                    "level": int(lvl) if lvl.isdigit() else 0,
                    "level_str": f"Lv.{lvl}" if lvl else ""
                })

        recipe_map = {r["name"]: r for r in recipes}

        used_as_mat = set()
        for r in recipes:
            for m in r["materials"]:
                if m["boss"] == "조합템" or m["name"] in recipe_map:
                    used_as_mat.add(m["name"])

        categories_order = ["무기", "갑옷", "투구", "장신구", "보조장비", "마나석"]
        gear_slots = {}
        for cat in categories_order:
            gear_slots[cat] = []

        for r in recipes:
            if r["name"] not in used_as_mat:
                c = r["category"]
                if c not in gear_slots:
                    gear_slots[c] = []
                gear_slots[c].append(r["name"])

        game_data["jobs"][job_name] = {
            "name": job_name,
            "recipes": recipes,
            "recipe_map": recipe_map,
            "gear_slots": gear_slots
        }

    return game_data

if __name__ == "__main__":
    os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)
    data = parse_excel(EXCEL_PATH)
    
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    with open(OUTPUT_JS, 'w', encoding='utf-8') as f:
        f.write("window.PRELOADED_GAME_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n")

    print(f"Successfully generated {OUTPUT_JSON} and {OUTPUT_JS}")
    print(f"Loaded jobs: {list(data['jobs'].keys())}")
    for jn, jd in data['jobs'].items():
        print(f"Job: {jn}")
        for slot, items in jd['gear_slots'].items():
            print(f"  [{slot}]: {items}")
    print(f"Total bosses: {len(data['bosses'])}")
