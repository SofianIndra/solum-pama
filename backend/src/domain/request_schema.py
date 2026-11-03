from pydantic import BaseModel


# Base for every POST/PUT/PATCH request body. Leading/trailing whitespace is stripped from every
# string as the body is parsed -- including strings inside nested models (items), lists and dict
# keys/values -- so nothing is stored with a stray space from a copy-paste. Exact-match lookups
# on codes and numbers depend on this.
class TrimmedRequest(BaseModel):
    class Config:
        anystr_strip_whitespace = True
