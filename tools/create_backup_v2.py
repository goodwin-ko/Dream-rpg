import shutil
import os

src_dir = 'd:/code/Dream'
backup_dir = 'd:/code/Dream/_backup_v2'

os.makedirs(backup_dir, exist_ok=True)

files_to_backup = [
    'index.html',
    'css/style.css',
    'js/app.js',
    'data/game_data.json',
    'data/game_data.js',
    'tools/parse_excel.py',
    'README.md'
]

backed_up = []
for rel_path in files_to_backup:
    src_file = os.path.join(src_dir, rel_path)
    if os.path.exists(src_file):
        dest_file = os.path.join(backup_dir, os.path.basename(rel_path))
        shutil.copy2(src_file, dest_file)
        backed_up.append(os.path.basename(rel_path))

print(f"Successfully created _backup_v2 with {len(backed_up)} files: {backed_up}")
