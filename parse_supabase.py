import json

with open('supabase_all_data.json', 'r', encoding='utf-8') as f:
    tables = json.load(f)
with open('supabase_views_data.json', 'r', encoding='utf-8') as f:
    views = json.load(f)

all_data = {**tables, **views}

def get_columns(data):
    if isinstance(data, list) and len(data) > 0:
        return list(data[0].keys())
    return []

print("RESUMO DO PROJETO Supabase: epwmoicgvuprzkcpxjoy")
print("=" * 60)
for name, data in all_data.items():
    count = len(data) if isinstance(data, list) else 0
    cols = get_columns(data)
    print(f"\nTABELA: {name}")
    print(f"  Linhas: {count}")
    if cols:
        print(f"  Colunas: {', '.join(cols)}")
    else:
        print("  (vazia ou sem acesso)")

print("\n\n" + "=" * 60)
print("AMOSTRAS DE DADOS (primeiros 3 registros de cada tabela)")
print("=" * 60)
for name, data in all_data.items():
    if isinstance(data, list) and len(data) > 0:
        print(f"\n--- {name.upper()} ({len(data)} registros) ---")
        for row in data[:3]:
            print(json.dumps(row, ensure_ascii=False, default=str))
