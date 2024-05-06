import time

import pandas as pd
from backend.heatmap import createHeatmap
from backend.types import HeatmapSettings
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/")
def index():
    return {"message": "Hello World!"}


@app.route("/api/heatmap", methods=["POST"])
def get_heatmap():
    start = time.perf_counter()
    heatmap_settings = HeatmapSettings(request.json["settings"])
    original_df = pd.read_csv(heatmap_settings.csv_file)
    return_JSON = createHeatmap(original_df, heatmap_settings)
    print(f"Time to generate entire heatmap: {time.perf_counter() - start}\n")
    return return_JSON
