#!/usr/bin/env python3
"""
Gerador de dados sintéticos para o projeto MIND (substitui coleta local).

Cria um CSV no mesmo formato do script de captura original (script_escrita_mind.py)
e um arquivo de alertas (alerts.json) quando valores estiverem fora das métricas.

Uso:
  python fake_generator.py            # gera 10 amostras em csvDados_simulated.csv
  python fake_generator.py --count 50 # gera 50 amostras
  python fake_generator.py --upload   # tenta enviar ao bucket se variáveis AWS estiverem no .env

O script não depende de psutil nem de acesso ao hardware — apenas python 3.8+ e python-dotenv.
"""
import os
import csv
import json
import time
import random
import math
import numpy as np
import argparse
from datetime import datetime, timedelta
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
if os.path.isfile(ENV_PATH):
    load_dotenv(ENV_PATH)

# Valores vindos do .env quando disponíveis (usados para compatibilidade com o formato)
ID_CLP = os.getenv("ID_CLP") or os.getenv("IDCLP") or ""
ID_EMPRESA = os.getenv("ID_EMPRESA") or "1"
MODELO_CLP = os.getenv("MODELO_CLP_MONITORADO") or "1"
NOME_MODELO_CPL = os.getenv("NOME_MODELO_CLP", "modelo-sintetico")
ID_FORNECEDOR = os.getenv("ID_FORNECEDOR", "fornecedor-sintetico")
LOCALIZACAO = os.getenv("LOCALIZACAO_CLP", "simulado")

# CSV de saída (não sobrescreve o csvDados.csv original)
CSV_PATH = os.path.join(BASE_DIR, "csvDados_simulated.csv")
ALERTS_PATH = os.path.join(BASE_DIR, "alerts_simulated.json")

# Thresholds para gerar alertas (personalize conforme necessário)
THRESHOLDS = {
    "porcentagem_uso_cpu": 90,     # alerta se CPU > 90%
    "porcentagem_uso_ram": 90,     # alerta se RAM > 90%
    "latencia_ms": 200,            # alerta se latência > 200 ms
    "perda_pacotes": 10,           # alerta se perda de pacotes > 10
    "scan_time_ms": 100,           # alerta se scan time > 100 ms
}

PROCESS_NAMES = [
    "python", "node", "chrome", "system", "nginx", "mysqld", "postgres",
    "java", "dotnet", "svchost", "redis-server"
]

def header_row():
    return [
        'nome_modelo_cpl',
        'id_fornecedor',
        'modelo_clp',
        'id_clp',
        'id_empresa',
        'timestamp',
        'porcentagem_uso_cpu',
        'ram_total_gb',
        'ram_disponivel_gb',
        'ram_usada_gb',
        'porcentagem_uso_ram',
        'porcentagem_uso_swap',
        'uptime_segundos',
        'scan_time_ms',
        'latencia_ms',
        'perda_pacotes',
        'vel_upload',
        'vel_download',
        'top1_processo', 'top1_cpu', 'top1_ram',
        'top2_processo', 'top2_cpu', 'top2_ram',
        'top3_processo', 'top3_cpu', 'top3_ram',
    ]

def random_top_proc():
    name = random.choice(PROCESS_NAMES)
    cpu = round(random.uniform(0.0, 40.0), 2)
    ram_pct = round(random.uniform(0.0, 30.0), 2)
    return [name, cpu, ram_pct]

def _compute_r2(y_true, y_pred):
    # r2 = 1 - SS_res / SS_tot
    ss_res = float(np.sum((y_true - y_pred) ** 2))
    ss_tot = float(np.sum((y_true - np.mean(y_true)) ** 2))
    if ss_tot == 0:
        return 0.0
    return 1.0 - (ss_res / ss_tot)


def _adjust_noise_for_r2(x_min, base_y, noise_arr, min_r2=0.80, max_r2=0.95, max_iter=30):
    """
    Ajusta escala do ruído para que o R2 (pela mesma lógica usada na ETL) fique entre min_r2 e max_r2.
    Retorna y = base_y + noise_scaled
    """
    n = len(x_min)
    n_test = math.ceil(n * 0.2)
    if n_test < 1 or n < 3:
        return base_y + noise_arr  # sem ajuste possível

    scale = 1.0
    noise_scaled = noise_arr * scale
    y = base_y + noise_scaled

    for _ in range(max_iter):
        x = x_min.astype(float)
        x_train, x_test = x[:-n_test], x[-n_test:]
        y_train, y_test = y[:-n_test], y[-n_test:]
        if len(x_train) < 2:
            break
        a, b = np.polyfit(x_train, y_train, 1)
        y_test_pred = a * x_test + b
        r2 = _compute_r2(y_test, y_test_pred)
        if r2 < min_r2:
            # reduzir ruído para aumentar R2
            scale *= 0.7
        elif r2 > max_r2:
            # aumentar ruído para diminuir R2
            scale *= 1.3
        else:
            break
        noise_scaled = noise_arr * scale
        y = base_y + noise_scaled
    return y


def generate_time_series(count, start_time, step_minutes=1):
    """
    Gera séries temporais com comportamento linear (CPU %, RAM %, scan time ms)
    e ruído ajustado para produzir R2 entre 0.80 e 0.95 na validação.
    Retorna lista de rows (para CSV) e lista de metrics (para alerts).
    """
    # timestamps: por minuto
    timestamps = [start_time + timedelta(minutes=i * step_minutes) for i in range(count)]
    x_min = np.arange(0, count * step_minutes, step_minutes)  # 0, 1, 2, ... em minutos

    # CPU: intercept entre 10-40, slope entre -0.15 e 0.25 %/min
    cpu_intercept = random.uniform(10, 40)
    cpu_slope = random.uniform(-0.15, 0.25)
    base_cpu = cpu_intercept + cpu_slope * x_min
    cpu_noise = np.random.normal(0, 3.5, size=len(x_min))  # sd inicial ~3.5
    cpu_y = _adjust_noise_for_r2(x_min, base_cpu, cpu_noise)
    cpu_y = np.clip(cpu_y, 0.0, 100.0)

    # RAM %: intercept 20-60, small slope
    ram_intercept = random.uniform(20, 60)
    ram_slope = random.uniform(-0.05, 0.12)
    base_ram_pct = ram_intercept + ram_slope * x_min
    ram_noise = np.random.normal(0, 3.0, size=len(x_min))
    ram_pct = _adjust_noise_for_r2(x_min, base_ram_pct, ram_noise)
    ram_pct = np.clip(ram_pct, 0.0, 99.9)

    # Scan time (ms): intercept 5-40 ms, slope small positive/negative
    scan_intercept = random.uniform(5, 40)
    scan_slope = random.uniform(-0.05, 0.8)  # can grow faster if needed
    base_scan = scan_intercept + scan_slope * x_min
    scan_noise = np.random.normal(0, max(1.0, scan_intercept * 0.05), size=len(x_min))
    scan_y = _adjust_noise_for_r2(x_min, base_scan, scan_noise)
    scan_y = np.clip(scan_y, 0.0, None)

    # RAM total fixed per run
    ram_total_gb = round(random.uniform(2.0, 32.0), 3)

    rows = []
    metrics_list = []
    for i, ts in enumerate(timestamps):
        pct_cpu = round(float(cpu_y[i]), 2)
        ramPercent = round(float(ram_pct[i]), 2)
        ram_usada_gb = round(ram_total_gb * (ramPercent / 100.0), 3)
        ram_disponivel_gb = round(max(0.0, ram_total_gb - ram_usada_gb), 3)
        scan_time_ms = round(float(scan_y[i]), 2)

        # outros valores com variabilidade leve
        swapPercent = round(max(0.0, min(100.0, random.gauss(5, 5))), 2)
        uptime_segundos = int(random.uniform(60 * 60, 60 * 60 * 24 * 30))  # 1h .. 30d
        latencia = round(max(1.0, random.gauss(30, 25)), 2)
        if random.random() < 0.05:
            latencia = round(random.uniform(220, 1200), 2)
        perdaPacotes = int(max(0, round(random.gauss(0.2, 1.0))))
        if random.random() < 0.03:
            perdaPacotes = random.randint(11, 50)
        velUpload = round(random.uniform(0.0, 0.5), 6)
        velDownload = round(random.uniform(0.0, 0.8), 6)

        top1 = random_top_proc()
        top2 = random_top_proc()
        top3 = random_top_proc()

        row = [
            NOME_MODELO_CPL,
            ID_FORNECEDOR,
            MODELO_CLP,
            ID_CLP,
            ID_EMPRESA,
            ts.isoformat(sep=' '),
            pct_cpu,
            ram_total_gb,
            ram_disponivel_gb,
            ram_usada_gb,
            ramPercent,
            swapPercent,
            uptime_segundos,
            scan_time_ms,
            latencia,
            perdaPacotes,
            velUpload,
            velDownload,
            top1[0], top1[1], top1[2],
            top2[0], top2[1], top2[2],
            top3[0], top3[1], top3[2],
        ]

        metrics = {
            "porcentagem_uso_cpu": pct_cpu,
            "porcentagem_uso_ram": ramPercent,
            "latencia_ms": latencia,
            "perda_pacotes": perdaPacotes,
            "scan_time_ms": scan_time_ms,
        }

        rows.append((row, metrics))
        metrics_list.append(metrics)

    return rows, metrics_list

def check_alerts(metrics, timestamp):
    alerts = []
    for key, value in metrics.items():
        if key in THRESHOLDS and value is not None:
            thr = THRESHOLDS[key]
            if value > thr:
                alerts.append({
                    "timestamp": timestamp.isoformat(sep=' '),
                    "metric": key,
                    "value": value,
                    "threshold": thr,
                    "message": f"{key} acima do limiar ({value} > {thr})"
                })
    return alerts

def try_upload(file_path, bucket, s3_path):
    try:
        import boto3
    except Exception:
        print("boto3 não disponível: pular upload para S3.")
        return False
    try:
        sess = boto3.Session()
        s3 = sess.client('s3')
        s3.upload_file(file_path, bucket, s3_path)
        print(f"Arquivo {file_path} enviado para s3://{bucket}/{s3_path}")
        return True
    except Exception as e:
        print(f"Falha ao enviar para S3: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Gerador sintético de dados MIND")
    parser.add_argument("--count", "-c", type=int, default=10, help="Número de amostras a gerar")
    parser.add_argument("--seed", type=int, help="Seed para RNG (reprodutível)")
    parser.add_argument("--upload", action="store_true", help="Tenta enviar CSV ao bucket AWS se variáveis presentes")
    parser.add_argument("--step-minutes", type=int, default=1, help="Intervalo em minutos entre amostras (padrão 1)")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)
        np.random.seed(args.seed)

    # Cria/abre CSV e escreve header
    with open(CSV_PATH, "w", newline='') as f:
        writer = csv.writer(f, lineterminator="\n")
        writer.writerow(header_row())

    all_alerts = []
    now = datetime.now()
    rows_metrics, metrics_list = generate_time_series(args.count, now, step_minutes=args.step_minutes)
    for (row, metrics), metric in zip(rows_metrics, metrics_list):
        with open(CSV_PATH, "a", newline='') as f:
            writer = csv.writer(f, lineterminator="\n")
            writer.writerow(row)
        ts = datetime.fromisoformat(row[5])
        alerts = check_alerts(metric, ts)
        if alerts:
            all_alerts.extend(alerts)
            for a in alerts:
                print("ALERTA:", a["timestamp"], a["metric"], a["value"], ">", a["threshold"])

    # Salva arquivo de alertas (mesmo que vazio)
    with open(ALERTS_PATH, "w", encoding="utf-8") as fa:
        json.dump(all_alerts, fa, ensure_ascii=False, indent=2, default=str)

    print(f"Gerado CSV sintético: {CSV_PATH} ({args.count} amostras)")
    print(f"Arquivo de alertas salvo em: {ALERTS_PATH} (total {len(all_alerts)} alertas)")

    # Tentativa opcional de upload ao bucket caso usuário peça e variáveis existam
    if args.upload:
        bucket = os.getenv("AWS_BUCKET_NAME")
        if bucket:
            ts = datetime.now()
            s3_path = f"bronze/{ts.year}-{ts.month:02d}-{ts.day:02d}_{ts.hour:02d}-{ts.minute:02d}_{ID_EMPRESA}-{ID_CLP or 'simulado'}.csv"
            try_upload(CSV_PATH, bucket, s3_path)
        else:
            print("AWS_BUCKET_NAME não configurado no .env: pular upload.")

if __name__ == "__main__":
    main()
