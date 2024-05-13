import time
import pandas as pd
from heatmap import create_heatmap
from heatmap_types import HeatmapSettings
from flask import Flask, request
from flask_cors import CORS
from io import StringIO

app = Flask(__name__)
CORS(app)


@app.route("/")
def index():
    return {"message": "Hello World!"}


@app.route("/api/heatmap", methods=["POST"])
def get_heatmap():


    heatmap_settings = HeatmapSettings(request.json["settings"])
    csv_file = StringIO(heatmap_settings.csvFile)
    original_df = pd.read_csv(csv_file)

    original_df = original_df.set_index(heatmap_settings.idsColumnName)

    if heatmap_settings.itemNamesColumnName == heatmap_settings.idsColumnName:
        heatmap_settings.itemNamesColumnName += "_added_string"
        original_df[heatmap_settings.itemNamesColumnName] = original_df.index

    start = time.perf_counter()
    return_string = create_heatmap(original_df, heatmap_settings)
    print(f"Time to generate entire heatmap: {time.perf_counter() - start}\n")
    
    return return_string
