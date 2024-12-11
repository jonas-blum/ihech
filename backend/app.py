import json
import os
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
import hashlib
from dotenv import load_dotenv


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

load_dotenv()

try:
    MAX_CACHE_SIZE = os.getenv("MAX_CACHE_SIZE")
    if MAX_CACHE_SIZE is None:
        MAX_CACHE_SIZE = 30
except:
    MAX_CACHE_SIZE = 30
heatmap_cache = {}

logger.info("MAX_CACHE_SIZE: " + str(MAX_CACHE_SIZE))


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

    try:
        isComputing = True
        logger.info("Starting to build heatmap...")
        start_heatmap = time.perf_counter()

        # Parse and represent settings in a unique way for caching
        settings_data = request.json["settings"]
        heatmap_settings = HeatmapSettings(settings_data)

        # Create a unique cache key: hashing the JSON-serialized settings
        settings_str = json.dumps(settings_data, sort_keys=True)
        cache_key = hashlib.sha256(settings_str.encode("utf-8")).hexdigest()

        # Check if we have a cached response for these settings
        if cache_key in heatmap_cache:
            logger.info("Cache hit. Returning cached result.")
            cached_heatmap_json = heatmap_cache[cache_key]

            def cached_generate():
                for chunk in json.JSONEncoder(default=custom_encoder).iterencode(
                    cached_heatmap_json
                ):
                    yield chunk

            return Response(
                stream_with_context(cached_generate()), mimetype="application/json"
            )

        # Not cached, we must compute
        csv_file = StringIO(heatmap_settings.csvFile)
        original_df = pd.read_csv(csv_file)

        logger.info(
            f"Finished reading csv file: {round(time.perf_counter() - start_heatmap, 2)}"
        )

        heatmap_json = create_heatmap(original_df, heatmap_settings, start_heatmap)

        # Before adding to cache, ensure we do not exceed MAX_CACHE_SIZE
        if len(heatmap_cache) >= MAX_CACHE_SIZE:
            # Remove the oldest inserted item
            oldest_key = next(iter(heatmap_cache))
            heatmap_cache.pop(oldest_key)

        # Store result in cache
        heatmap_cache[cache_key] = heatmap_json

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
