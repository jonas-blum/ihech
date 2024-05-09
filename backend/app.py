import time
import pandas as pd
from heatmap import createHeatmap
from heatmap_types import HeatmapSettings
from flask import Flask, request, jsonify
from flask_cors import CORS
from io import StringIO

app = Flask(__name__)
CORS(app)


@app.route("/")
def index():
    return {"message": "Hello World!"}


@app.route("/api/heatmap", methods=["POST"])
def get_heatmap():

    start = time.perf_counter()

    heatmap_settings = HeatmapSettings(request.json["settings"])
    csv_file = StringIO(heatmap_settings.csvFile)
    original_df = pd.read_csv(csv_file)

    original_df = original_df.set_index(heatmap_settings.idsColumnName)

    if heatmap_settings.rowNamesColumnName == heatmap_settings.idsColumnName:
        heatmap_settings.rowNamesColumnName += "_added_string"
        original_df[heatmap_settings.rowNamesColumnName] = original_df.index

    original_df = original_df.loc[heatmap_settings.selectedRowIds]

    original_df = original_df.loc[:, (original_df != 0).any(axis=0)]

    return_JSON = createHeatmap(original_df, heatmap_settings)
    print(f"Time to generate entire heatmap: {time.perf_counter() - start}\n")
    return return_JSON
