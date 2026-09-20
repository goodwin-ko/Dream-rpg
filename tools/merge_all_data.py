import openpyxl
import json
import os
import re

BASE_DIR = 'd:/code/Dream'
DREAM_EXCEL = os.path.join(BASE_DIR, 'dream01.xlsx')
INFO_EXCEL = os.path.join(BASE_DIR, '정보Table.xlsx')

ALIAS_MAP = {
    "천공의 성스로운 갑옷": "천공의 성스러운 갑옷",
    "여혼 정화의 성목": "영혼 정화의 성목",
    "빛의 그레 일린": "빛의 그레일린",
    "빛의 그러일런": "빛의 그레일린",
    "얼음 그림자 아퀄리스": "얼음 그림자 아퀼리스",
    "속세의 및-우키요에 두루마리": "속세의 빛·우키요에 두루마리",
    "속세의및-우키요에 두루마리": "속세의 빛·우키요에 두루마리",
    "속세의 및·우키요에 두루마리": "속세의 빛·우키요에 두루마리",
    "속세의및·우키요에 두루마리": "속세의 빛·우키요에 두루마리",
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
    "지옥볼의 핵": "지옥불의 핵",
    "파천의뇌석": "파천의 뇌석",
    "빅옹의 결정": "빙옥의 결정",
    "끝없는 어룸의 로브": "끝없는 어둠의 로브",
    "프로토스 왕관": "프로스트 왕관",
    "지옥투구": "지옥 투구",
    "혼동의 혈정": "혼돈의 혈정",
    "영혼 녹이는 화염 결정": "혼을 녹이는 화염 결정",
    "성스러운 및의 수호석": "성스러운 빛의 수호석",
    "영혼 구술의 족쇄": "영혼 구슬의 족쇄",
    "용의 격노-용혼갑옷": "용의 격노·용혼 갑옷",
    "용의 격노-용혼 갑옷": "용의 격노·용혼 갑옷",
    "용의 격노·용혼갑옷": "용의 격노·용혼 갑옷",
    "잊힌 고대의 마나석": "잊힌 고대 마나석",
    "검은 쌍둥이 반지-성광 파편": "검은 쌍둥이 반지·섬광 파편",
    "검은 쌍둥이 반지·성광 파편": "검은 쌍둥이 반지·섬광 파편",
    "검은 쌍둥이 반지-섬광 파편": "검은 쌍둥이 반지·섬광 파편",
    "붉은 화염 전투 세트": "붉은 화염 전투 셋트",
    "격노한 화염의 전쟁신 도끼": "격노한 화염의 전생신 도끼",
    "청공의 분노 뇌전홀": "천공의 분노 뇌전홀",
    "TitanX-4060": "TitonX-4060",
    "성역의 대주교": "성역의 대사제"
}

def clean_str(s):
    if s is None:
        return ""
    val = str(s).strip()
    return ALIAS_MAP.get(val, val)

def normalize_name(s):
    if s is None:
        return ""
    val = str(s).strip()
    if val in ALIAS_MAP:
        val = ALIAS_MAP[val]
    if re.match(r'^tit[ao]nx-4060$', val, re.IGNORECASE):
        return "TitonX-4060"
    val = re.sub(r'\s*[\-\–—•ㆍ・]\s*', '·', val)
    val = re.sub(r'\s*·\s*', '·', val)
    if val in ALIAS_MAP:
        val = ALIAS_MAP[val]
    return val

def clean_lvl(s):
    if not s:
        return ""
    val = str(s).strip()
    m = re.search(r'\d+', val)
    return m.group(0) if m else val

def map_category(raw_cat):
    if not raw_cat:
        return "기타", ""
    c = str(raw_cat).strip()
    if c in ["갑옷", "경갑", "중갑", "천 갑옷", "천", "세트"]:
        sub = "중갑" if "중갑" in c else ("경갑" if "경갑" in c else ("천" if "천" in c else "갑옷"))
        return "갑옷", sub
    elif c in ["근접 무기", "근접무기"]:
        return "무기", "근접무기"
    elif c in ["원거리 무기", "원거리무기"]:
        return "무기", "원거리무기"
    elif c in ["마법 무기", "마법무기", "지팡이"]:
        return "무기", "지팡이"
    elif c in ["무기"]:
        return "무기", "무기"
    elif c in ["투구", "머리장식"]:
        sub = "머리장식" if "머리장식" in c else "투구"
        return "투구", sub
    elif c in ["장신구"]:
        return "장신구", "장신구"
    elif c in ["보조 장비", "보조장비", "배지"]:
        sub = "배지" if "배지" in c else "보조장비"
        return "보조장비", sub
    elif c in ["마나석"]:
        return "마나석", "마나석"
    return c, c

print("Importing parse_excel from tools...")
import sys
sys.path.insert(0, os.path.join(BASE_DIR, 'tools'))
from parse_excel import parse_excel

print("1. Parsing dream01.xlsx base...")
data = parse_excel(DREAM_EXCEL)
boss_map = {b["name"]: b for b in data["bosses"]}
global_recipe_map = data["global_recipe_map"]
category_gear = data["category_gear"]

# Load 정보Table.xlsx
print("2. Loading 정보Table.xlsx...")
wb_info = openpyxl.load_workbook(INFO_EXCEL, data_only=True)

# 2-1. Process 장비아이템 (Gear Specs)
print("3. Processing 장비아이템...")
s_gear = wb_info["장비아이템"]
gear_specs = {}

for r in list(s_gear.iter_rows(values_only=True))[1:]:
    if not any(r): continue
    iname = normalize_name(r[0])
    raw_cat = clean_str(r[1])
    grade = clean_str(r[2])
    lvl = r[3] if r[3] is not None else 0
    opt = str(r[4]).strip() if r[4] else ""
    act_pass = str(r[5]).strip() if r[5] else ""
    
    cat, sub_type = map_category(raw_cat)
    lvl_num = int(lvl) if str(lvl).isdigit() else 0
    
    gear_specs[iname] = {
        "name": iname,
        "category": cat,
        "sub_type": sub_type,
        "grade": grade,
        "level": lvl_num,
        "level_str": f"Lv.{lvl_num}" if lvl_num else "",
        "options": opt,
        "active_passive": act_pass
    }

print(f"Loaded {len(gear_specs)} gear specs from 장비아이템")

# 2-2. Process 조합법
print("4. Processing 조합법...")
s_rec = wb_info["조합법"]
rec_groups = {}
for r in list(s_rec.iter_rows(values_only=True))[1:]:
    if not any(r): continue
    iname = normalize_name(r[0])
    raw_cat = clean_str(r[1])
    grade = clean_str(r[2])
    mat_name = normalize_name(r[3])
    mat_qty = r[4] if r[4] is not None else 1
    
    if not iname: continue
    cat, sub_type = map_category(raw_cat)
    if iname not in rec_groups:
        rec_groups[iname] = {
            "name": iname,
            "category": cat,
            "sub_type": sub_type,
            "grade": grade,
            "materials": []
        }
    if mat_name:
        try:
            qty_num = int(mat_qty)
        except:
            qty_num = 1
        rec_groups[iname]["materials"].append({
            "name": mat_name,
            "qty": qty_num
        })

print(f"Loaded {len(rec_groups)} recipes from 조합법")

# Merge 조합법 into global_recipe_map and category_gear
for iname, rinfo in rec_groups.items():
    gspec = gear_specs.get(iname, {})
    cat = gspec.get("category") or rinfo["category"]
    sub_type = gspec.get("sub_type") or rinfo["sub_type"]
    grade = gspec.get("grade") or rinfo["grade"]
    lvl = gspec.get("level") or 0
    lvl_str = gspec.get("level_str") or (f"Lv.{lvl}" if lvl else "")
    opt = gspec.get("options") or ""
    act_pass = gspec.get("active_passive") or ""

    if iname in global_recipe_map:
        rc = global_recipe_map[iname]
        rc["grade"] = grade
        if opt: rc["options"] = opt
        if act_pass: rc["active_passive"] = act_pass
        if lvl and not rc.get("level"):
            rc["level"] = lvl
            rc["level_str"] = lvl_str
        if sub_type and not rc.get("sub_cat"):
            rc["sub_cat"] = sub_type
        # If existing materials was empty, use new materials
        if not rc.get("materials") and rinfo["materials"]:
            rc["materials"] = rinfo["materials"]
    else:
        # New recipe!
        global_recipe_map[iname] = {
            "name": iname,
            "category": cat,
            "sub_cat": sub_type,
            "grade": grade,
            "level": lvl,
            "level_str": lvl_str,
            "synergy": "",
            "synergy_jobs": [],
            "special_effect": "",
            "options": opt,
            "active_passive": act_pass,
            "materials": rinfo["materials"],
            "is_drop": False,
            "drop_boss": "",
            "drop_level": 0,
            "drop_location": "",
            "drop_type": "아이템"
        }
        if cat in category_gear:
            if iname not in category_gear[cat]["top_gear"]:
                category_gear[cat]["top_gear"].append(iname)
            category_gear[cat]["recipes"].append(global_recipe_map[iname])

# Enrich any other recipes with gear_specs
for iname, gspec in gear_specs.items():
    if iname in global_recipe_map:
        rc = global_recipe_map[iname]
        if gspec.get("grade") and not rc.get("grade"):
            rc["grade"] = gspec["grade"]
        if gspec.get("options") and not rc.get("options"):
            rc["options"] = gspec["options"]
        if gspec.get("active_passive") and not rc.get("active_passive"):
            rc["active_passive"] = gspec["active_passive"]
        if gspec.get("level") and not rc.get("level"):
            rc["level"] = gspec["level"]
            rc["level_str"] = gspec["level_str"]
        if gspec.get("sub_type") and not rc.get("sub_cat"):
            rc["sub_cat"] = gspec["sub_type"]
    else:
        # Item has gear specs but not craftable (e.g. drop item or uncrafted top gear)
        cat = gspec["category"]
        if cat in category_gear:
            global_recipe_map[iname] = {
                "name": iname,
                "category": cat,
                "sub_cat": gspec["sub_type"],
                "grade": gspec["grade"],
                "level": gspec["level"],
                "level_str": gspec["level_str"],
                "synergy": "",
                "synergy_jobs": [],
                "special_effect": "",
                "options": gspec["options"],
                "active_passive": gspec["active_passive"],
                "materials": [],
                "is_drop": True,
                "drop_boss": "",
                "drop_level": gspec["level"],
                "drop_location": "",
                "drop_type": "아이템"
            }
            if iname not in category_gear[cat]["top_gear"]:
                category_gear[cat]["top_gear"].append(iname)
            category_gear[cat]["recipes"].append(global_recipe_map[iname])

# 2-3. Process 보스드랍
print("5. Processing 보스드랍...")
s_boss = wb_info["보스드랍"]
for r in list(s_boss.iter_rows(values_only=True))[1:]:
    if not any(r): continue
    bname = clean_str(r[0])
    iname = normalize_name(r[1])
    itype = clean_str(r[2])
    igrade = clean_str(r[3])
    
    if not bname or not iname: continue
    
    # If boss not in boss_map, add
    if bname not in boss_map:
        boss_map[bname] = {
            "name": bname,
            "level": 0,
            "level_str": "",
            "location": "",
            "drops": []
        }
    
    # Check if iname is already dropped by bname
    existing_drops = boss_map[bname]["drops"]
    drop_entry = next((d for d in existing_drops if d["name"] == iname), None)
    if drop_entry:
        if itype and not drop_entry.get("type"):
            drop_entry["type"] = itype
        if igrade and not drop_entry.get("grade"):
            drop_entry["grade"] = igrade
    else:
        # Add new drop
        new_drop = {
            "name": iname,
            "type": itype or "아이템",
            "grade": igrade or (gear_specs.get(iname, {}).get("grade", "")),
            "level": boss_map[bname]["level"],
            "level_str": boss_map[bname]["level_str"]
        }
        boss_map[bname]["drops"].append(new_drop)
        
    # Update recipe drop info if item in global_recipe_map
    if iname in global_recipe_map:
        rc = global_recipe_map[iname]
        if not rc.get("drop_boss"):
            rc["drop_boss"] = bname
            rc["drop_location"] = boss_map[bname].get("location", "")
        if igrade and not rc.get("grade"):
            rc["grade"] = igrade

# Re-sort bosses by level, name
sorted_bosses = sorted(list(boss_map.values()), key=lambda x: (x["level"], x["name"]))
data["bosses"] = sorted_bosses

# Save merged output to data/game_data.json and data/game_data.js
output_json = os.path.join(BASE_DIR, 'data', 'game_data.json')
output_js = os.path.join(BASE_DIR, 'data', 'game_data.js')

with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

with open(output_js, 'w', encoding='utf-8') as f:
    f.write("window.PRELOADED_GAME_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n")

print(f"SUCCESS! Merged game data written to:")
print(f"  {output_json}")
print(f"  {output_js}")
print(f"Total bosses: {len(data['bosses'])}")
print(f"Total global recipes: {len(data['global_recipe_map'])}")
for cat in ["무기", "갑옷", "투구", "장신구", "보조장비", "마나석"]:
    print(f"  [{cat}]: {len(data['category_gear'][cat]['top_gear'])} top gear, {len(data['category_gear'][cat]['recipes'])} total recipes")
