import requests
import json
import pandas as pd

PROXY_URL = "http://localhost:3000/api/proxy"

def run_fix():
    print("Reading workers from Excel...")
    df = pd.read_excel('documentos/control_ingresos.xlsx', sheet_name='01', header=None)
    header_row = 7
    df_data = df.iloc[header_row+1:]
    
    workers = []
    for index, row in df_data.iterrows():
        # VERIFIED INDICES:
        # 13: AGUILA SANCHEZ (Apellido)
        # 14: JUAN LUIS (Nombre)
        # 15: 13739164 (RUT)
        # 16: 3 (DV)
        # 17: CONTROL DE LOGISTICA (Cargo)
        # 18: TRESOL (Empresa)
        
        apellido = str(row[13]).strip() if pd.notna(row[13]) else ""
        nombre = str(row[14]).strip() if pd.notna(row[14]) else ""
        rut = str(row[15]).strip() if pd.notna(row[15]) else ""
        dv = str(row[16]).strip() if pd.notna(row[16]) else ""
        cargo = str(row[17]).strip() if pd.notna(row[17]) else ""
        empresa = str(row[18]).strip() if pd.notna(row[18]) else ""
        
        if not nombre and not apellido and not rut:
            if index > 145: break
            continue
            
        if "EXTERNOS" in str(nombre).upper() or "EXTERNOS" in str(apellido).upper(): break
            
        workers.append({
            "nombre": nombre,
            "apellido": apellido,
            "rut": rut,
            "dv": dv,
            "cargo": cargo,
            "empresa": empresa,
            "tipo": "trabajador"
        })

    print(f"Importing {len(workers)} workers correctly into a CLEAN database...")
    batch_size = 50
    for i in range(0, len(workers), batch_size):
        batch = workers[i:i+batch_size]
        res = requests.post(PROXY_URL, json={"table": "maestro_personas", "method": "insert", "data": batch})
        print(f"Batch {i//batch_size + 1}: {res.status_code}")

    print("Success.")

if __name__ == "__main__":
    run_fix()
