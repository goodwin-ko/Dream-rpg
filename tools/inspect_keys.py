import json

with open('d:/code/Dream/data/game_data.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

gmap = d.get('global_recipe_map', {})
matches = {k: v for k, v in gmap.items() if '악몽' in k or '용살자' in k or '황룡' in k}
print(f"Total matches in global_recipe_map: {len(matches)}")
for k, v in matches.items():
    print(f"Key: '{k}' -> name: '{v.get('name')}', cat: '{v.get('category')}', sub_cat: '{v.get('sub_cat')}', lvl: '{v.get('level')}', grade: '{v.get('grade')}', mats: {[m.get('name') for m in v.get('materials', [])]}")
