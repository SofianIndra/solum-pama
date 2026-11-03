import os

from dotenv import load_dotenv
from src.domain.api_version.schemas import ApiVersion

# Load environment variables from env
load_dotenv()
API_VERSION = os.getenv('API_VERSION')


# Get API Version Data
def get_api_version():
    response_data = ApiVersion(
        version=API_VERSION
    )

    return response_data
