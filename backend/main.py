import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from src.routers.handlers.http_error import http_error_handler

from src.database import Base, engine

from src.routers.api import router as router_api


###
# Main application file
###

@asynccontextmanager
async def lifespan(application: FastAPI):
    ''' Starts the background schedulers alongside the app and cancels them on shutdown. '''
    tasks = [
        # asyncio.create_task(run_<name>_scheduler()),
    ]
    yield
    for task in tasks:
        task.cancel()


def get_application() -> FastAPI:
    ''' Configure, start and return the application '''

    ## Start FastApi App
    application = FastAPI(lifespan=lifespan)

    ## Generate database tables
    Base.metadata.create_all(bind=engine)

    ## Mapping api routes
    application.include_router(router_api)

    ## Add exception handlers
    application.add_exception_handler(HTTPException, http_error_handler)

    ## Allow cors
    application.add_middleware(
        CORSMiddleware,
        allow_origins=['*'],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*']
    )

    return application


app = get_application()
