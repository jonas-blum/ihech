import json
import time
import traceback
import pandas as pd
from helpers import compress_json
from heatmap import create_heatmap
from heatmap_types import HeatmapSettings, custom_encoder
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from io import StringIO
import logging
from flask_compress import Compress


app = Flask(__name__)
CORS(app)
Compress(app)

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
        start_heatmap = time.perf_counter()

        heatmap_settings = HeatmapSettings(request.json["settings"])
        csv_file = StringIO(heatmap_settings.csvFile)
        original_df = pd.read_csv(csv_file)

        logger.info(
            f"Finished reading csv file: {round(time.perf_counter() - start_heatmap, 2)}"
        )

        heatmap_json = create_heatmap(original_df, heatmap_settings, start_heatmap)

        logger.info("Starting to generate json...")
        start_json = time.perf_counter()

        def generate():
            for chunk in json.JSONEncoder(default=custom_encoder).iterencode(
                heatmap_json
            ):
                yield chunk
            logger.info(
                f"Generating JSON Done: {round(time.perf_counter() - start_json, 2)} seconds"
            )
            logger.info(
                f"Time to generate entire heatmap: {round(time.perf_counter() - start_heatmap, 2)} seconds"
            )

        response = Response(
            stream_with_context(generate()), mimetype="application/json"
        )

        return response
    except Exception as e:

        logger.error(f"Error: {traceback.format_exc()}")

        return str(e), 400
    finally:
        isComputing = False
