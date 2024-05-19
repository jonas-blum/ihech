import time
import traceback
import pandas as pd
from heatmap import create_heatmap
from heatmap_types import HeatmapSettings
from flask import Flask, request, jsonify
from flask_cors import CORS
from io import StringIO
import logging


app = Flask(__name__)
CORS(app)

logger = logging.getLogger("IHECH Logger")
logger.setLevel(logging.DEBUG)


file_handler = logging.FileHandler("ihech.log")
file_handler.setLevel(logging.DEBUG)
file_formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
)
file_handler.setFormatter(file_formatter)
logger.addHandler(file_handler)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
console_handler.setFormatter(file_formatter)
logger.addHandler(console_handler)


@app.route("/")
def index():
    return {"message": "Hello World!"}


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "up"}), 200


isComputing = False


@app.route("/api/heatmap", methods=["POST"])
def get_heatmap():
    global isComputing
    # if isComputing:
    #     return "Server is busy. Please try again later.", 503
    try:
        isComputing = True
        logger.info("Starting to build heatmap...")
        start = time.perf_counter()

        heatmap_settings = HeatmapSettings(request.json["settings"])
        csv_file = StringIO(heatmap_settings.csvFile)
        original_df = pd.read_csv(csv_file)

        if heatmap_settings.itemNamesColumnName in heatmap_settings.selectedAttributes:
            new_item_names_column_name = heatmap_settings.itemNamesColumnName + "_copy1"
            original_df[new_item_names_column_name] = original_df[
                heatmap_settings.itemNamesColumnName
            ]
            heatmap_settings.itemNamesColumnName = new_item_names_column_name

        elif (
            heatmap_settings.itemNamesColumnName
            in heatmap_settings.collectionColumnNames
        ):
            new_item_names_column_name = heatmap_settings.itemNamesColumnName + "_copy2"
            original_df[new_item_names_column_name] = original_df[
                heatmap_settings.itemNamesColumnName
            ]
            heatmap_settings.itemNamesColumnName = new_item_names_column_name

        logger.info(
            f"Finished reading csv file: {round(time.perf_counter() - start, 3)}"
        )
        logger.info("Starting Filtering...")

        return_string = create_heatmap(original_df, heatmap_settings)
        logger.info(
            f"Time to generate entire heatmap: {round(time.perf_counter() - start,3 )}\n"
        )
        return return_string
    except Exception as e:

        logger.error(f"Error: {traceback.format_exc()}")

        return str(e), 400
    finally:
        isComputing = False
