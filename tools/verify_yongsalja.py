import json
import sys

def verify():
    with open('d:/code/Dream/data/game_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    errors = []
    gmap = data.get("global_recipe_map", {})

    # 1. Plain '용살자' should NOT be in global_recipe_map
    if "용살자" in gmap:
        errors.append("Plain '용살자' still exists in global_recipe_map!")

    # 2. '용살자 (근접)' existence and 7 materials
    if "용살자 (근접)" not in gmap:
        errors.append("'용살자 (근접)' not found in global_recipe_map!")
    else:
        m_rc = gmap["용살자 (근접)"]
        if m_rc.get("sub_cat") != "근접무기":
            errors.append(f"'용살자 (근접)' sub_cat is '{m_rc.get('sub_cat')}', expected '근접무기'")
        if m_rc.get("level") != 360:
            errors.append(f"'용살자 (근접)' level is {m_rc.get('level')}, expected 360")
        mats = [m["name"] for m in m_rc.get("materials", [])]
        expected_mats = ["홍마룡의 칼날", "혼돈의 혈정", "타락한 마나핵", "멸세의 화염깃", "은하의 모래", "망자의 육신", "마충의 유해"]
        for em in expected_mats:
            if em not in mats:
                errors.append(f"'용살자 (근접)' missing material: {em} (found: {mats})")

    # 3. '용살자 (원거리)' existence and 5 materials
    if "용살자 (원거리)" not in gmap:
        errors.append("'용살자 (원거리)' not found in global_recipe_map!")
    else:
        r_rc = gmap["용살자 (원거리)"]
        if r_rc.get("sub_cat") != "원거리무기":
            errors.append(f"'용살자 (원거리)' sub_cat is '{r_rc.get('sub_cat')}', expected '원거리무기'")
        if r_rc.get("level") != 320:
            errors.append(f"'용살자 (원거리)' level is {r_rc.get('level')}, expected 320")
        r_mats = [m["name"] for m in r_rc.get("materials", [])]
        expected_r_mats = ["빙하 죽음 총", "진 · 블래스터", "폭염 결정의 정수", "빙옥의 결정", "아다만타이트"]
        for em in expected_r_mats:
            if em not in r_mats and em.replace(" · ", "-") not in r_mats and em.replace(" · ", "·") not in r_mats:
                errors.append(f"'용살자 (원거리)' missing material: {em} (found: {r_mats})")

    # 4. 황룡언월도 materials contains 용살자 (근접)
    if "황룡언월도" not in gmap:
        errors.append("'황룡언월도' not found in global_recipe_map!")
    else:
        hw_mats = [m["name"] for m in gmap["황룡언월도"].get("materials", [])]
        if "용살자 (근접)" not in hw_mats:
            errors.append(f"'황룡언월도' materials does not contain '용살자 (근접)': {hw_mats}")
        if "용살자" in hw_mats or "용살자 (원거리)" in hw_mats:
            errors.append(f"'황룡언월도' contains ambiguous or wrong 용살자: {hw_mats}")

    # 5. 파괴자 materials contains 용살자 (원거리)
    if "파괴자" in gmap:
        des_mats = [m["name"] for m in gmap["파괴자"].get("materials", [])]
        if "용살자 (원거리)" not in des_mats:
            errors.append(f"'파괴자' materials does not contain '용살자 (원거리)': {des_mats}")
        if "용살자" in des_mats or "용살자 (근접)" in des_mats:
            errors.append(f"'파괴자' contains ambiguous or wrong 용살자: {des_mats}")

    # 6. category_gear top_gear contains both
    weapons_top = data.get("category_gear", {}).get("무기", {}).get("top_gear", [])
    if "용살자 (근접)" not in weapons_top:
        errors.append("'용살자 (근접)' not in category_gear['무기']['top_gear']")
    if "용살자 (원거리)" not in weapons_top:
        errors.append("'용살자 (원거리)' not in category_gear['무기']['top_gear']")
    if "용살자" in weapons_top:
        errors.append("Plain '용살자' still in category_gear['무기']['top_gear']")

    # 7. Check 광전사 job active recipes
    gwang = data.get("jobs", {}).get("광전사", {})
    if gwang:
        gwang_recipe_names = [r["name"] for r in gwang.get("recipes", [])]
        if "용살자 (근접)" not in gwang_recipe_names:
            errors.append("'용살자 (근접)' not in jobs['광전사']['recipes']")
        if "용살자 (원거리)" in gwang_recipe_names:
            errors.append("'용살자 (원거리)' incorrectly in jobs['광전사']['recipes']")
        if "용살자" in gwang_recipe_names:
            errors.append("Plain '용살자' in jobs['광전사']['recipes']")

    if errors:
        print("VERIFICATION FAILED:")
        for e in errors:
            print(f"  - {e}")
        return False
    else:
        print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
        return True

if __name__ == "__main__":
    success = verify()
    sys.exit(0 if success else 1)
