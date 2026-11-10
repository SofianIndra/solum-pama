###
# Centralize response messages
###

# Errors does not exist
MS_STOCK_DOES_NOT_EXIST_ERROR = "ms stock does not exist"


# Errors already exist
MS_STOCK_ALREADY_EXIST_ERROR = "ms stock item code already exist"


# Validation Errors
MS_STOCK_NEGATIVE_VALUE_ERROR = "stock values cannot be negative"
MS_STOCK_MIN_OVER_MAX_ERROR = "min stock cannot be greater than max stock"
MS_STOCK_ITEM_NAME_REQUIRED_ERROR = "item name is required"
MS_STOCK_ITEM_CODE_REQUIRED_ERROR = "item code is required"
MS_STOCK_ARTICLE_ID_REQUIRED_ERROR = "article id is required"
MS_STOCK_INVALID_ACTIVE_ERROR = "active must be ACTIVE or INACTIVE"
SOLUM_COMPANY_REQUIRED_ERROR = "solum company is required (request or SOLUM_COMPANY in .env)"
SOLUM_STORE_REQUIRED_ERROR = "solum store is required (request or SOLUM_STORE in .env)"
SOLUM_INVALID_LED_DURATION_ERROR = "SOLUM_LED_DURATION in .env is not a duration supported by solum"
MS_CONFIG_INVALID_SERVER_TYPE_ERROR = "server type must be ON_PREMISE or SAAS"
MS_CONFIG_ON_PREMISE_IP_REQUIRED_ERROR = "on premise ip is required"
MS_CONFIG_INVALID_ON_PREMISE_IP_ERROR = "on premise ip is not a valid ip address or host name"
MS_CONFIG_ON_PREMISE_PORT_REQUIRED_ERROR = "on premise port is required"
MS_CONFIG_INVALID_ON_PREMISE_PORT_ERROR = "on premise port must be between 1 and 65535"
MS_CONFIG_SAAS_API_URL_REQUIRED_ERROR = "saas api url is required"
MS_CONFIG_INVALID_SAAS_API_URL_ERROR = "saas api url must start with http:// or https://"


# SOLUM Results
SOLUM_ARTICLE_PUSH_SUCCESS = "article data sent to solum"
SOLUM_ARTICLE_NO_CHANGE = "no solum field changed, article data not sent"
SOLUM_LED_SUCCESS = "led blink sent to solum"
SOLUM_PAGE_FLIP_RESTARTED = "page flip restarted from page 1"
SOLUM_PAGE_FLIP_OFF = "page flip scheduler is off (SOLUM_PAGE_FLIP_SECONDS is empty or 0)"
SOLUM_ARTICLE_NOT_LINKED = "item has no article id, solum label not updated"


# Post Data Success
MS_STOCK_POST_SUCCESS = "create ms stock success"


# Update Data Success
MS_STOCK_UPDATE_SUCCESS = "ms stock update success"
MS_CONFIG_UPDATE_SUCCESS = "ms config update success"


# Delete Data Success
MS_STOCK_DELETE_SUCCESS = "ms stock delete success"
