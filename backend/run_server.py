import uvicorn
import sys
import traceback
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("run_server")

if __name__ == '__main__':
    logger.info("Starting uvicorn server wrapper...")
    try:
        uvicorn.run("api.main:app", host="127.0.0.1", port=8000, reload=False, log_level="info")
    except BaseException as e:
        logger.error("Uvicorn exited with exception: %s", e)
        traceback.print_exc()
        sys.exit(1)
