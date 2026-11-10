import asyncio
import logging
import os

from dotenv import load_dotenv

from src.services import solum_client
from src.services.solum_client import SolumError

# Load environment variables from .env
load_dotenv()

# uvicorn only prints its own loggers, so the scheduler logs through uvicorn.error like the SOLUM client
logger = logging.getLogger('uvicorn.error')

# Seconds between two page changes; empty or 0 turns the scheduler off
SOLUM_PAGE_FLIP_SECONDS = float(os.getenv('SOLUM_PAGE_FLIP_SECONDS') or '0')

# Pages the labels go through in turn: 1, 2, ..., SOLUM_PAGE_FLIP_PAGE_COUNT, then 1 again (AIMS allows 1-7)
SOLUM_PAGE_FLIP_PAGE_COUNT = int(os.getenv('SOLUM_PAGE_FLIP_PAGE_COUNT') or '2')


# Pages each label's hardware has, by label code. A label's type never changes, so each label is looked
# up once per backend run; None means AIMS did not say and the label is always sent.
label_total_pages = {}


# Get Page Flip Label Codes
# Only labels linked to an article: an unassigned label has nothing to show on another page.
def get_page_flip_label_codes(labels: list):
    return [row['labelCode'] for row in labels if row.get('labelCode') and row.get('articleList')]


# Get Label Total Page (cached in label_total_pages)
async def get_label_total_page(label_code: str):
    if label_code not in label_total_pages:
        label_total_pages[label_code] = await solum_client.get_on_premise_label_total_page(label_code)
    return label_total_pages[label_code]


# Flip Label Pages
# One run: read the labels and move them all to display_page in one call. AIMS rejects the whole call when
# one label has fewer pages than display_page (a 7.5" label has 3), so those labels are left out of this
# run and stay on their last page. Logs and never raises, so a failed run (server down, SaaS chosen on the
# Config tab) only skips this turn.
async def flip_label_pages(display_page: int):
    try:
        if not solum_client.is_on_premise():
            logger.info('[PAGE FLIP] skipped: the SOLUM server on the Config tab is not On Premise')
            return

        label_codes = get_page_flip_label_codes(await solum_client.list_on_premise_labels())
        if not label_codes:
            logger.info('[PAGE FLIP] skipped: no label is linked to an article')
            return

        target_codes = []
        for label_code in label_codes:
            total_page = await get_label_total_page(label_code)
            if total_page is None or display_page <= total_page:
                target_codes.append(label_code)
        if not target_codes:
            logger.info('[PAGE FLIP] skipped: no label has page %s', display_page)
            return

        await solum_client.change_on_premise_label_page(target_codes, display_page)
        logger.info('[PAGE FLIP] %s label(s) moved to page %s, %s label(s) without that page left as is',
                    len(target_codes), display_page, len(label_codes) - len(target_codes))
    except SolumError as error:
        logger.error('[PAGE FLIP] failed: %s', error.message)
    except Exception:
        logger.exception('[PAGE FLIP] failed')


# Set by restart_page_flip_scheduler; the scheduler then goes back to page 1 and times the next runs from there
restart_requested = asyncio.Event()


# Restart Page Flip Scheduler
# Called each time the web is loaded: the labels go back to page 1 right away (after the run in progress, if
# any) and the cycle starts over from there. Returns False when the scheduler is off.
def restart_page_flip_scheduler():
    if SOLUM_PAGE_FLIP_SECONDS <= 0:
        return False
    restart_requested.set()
    return True


# Run Page Flip Scheduler
# The labels go to page 1 as soon as the backend starts (whatever page they were left on), then to the
# next page every SOLUM_PAGE_FLIP_SECONDS: 1, 2, ..., SOLUM_PAGE_FLIP_PAGE_COUNT, 1, ...
# restart_page_flip_scheduler starts the cycle over from page 1. A change in .env applies after a backend restart.
async def run_page_flip_scheduler():
    if SOLUM_PAGE_FLIP_SECONDS <= 0:
        logger.info('[PAGE FLIP] off (SOLUM_PAGE_FLIP_SECONDS is empty or 0)')
        return

    logger.info('[PAGE FLIP] every %gs through pages 1-%s', SOLUM_PAGE_FLIP_SECONDS, SOLUM_PAGE_FLIP_PAGE_COUNT)
    # Runs are timed from the start, so the time the AIMS calls take does not push every next run later
    loop = asyncio.get_running_loop()
    started_at = loop.time()
    run = 0
    while True:
        await flip_label_pages(run % SOLUM_PAGE_FLIP_PAGE_COUNT + 1)
        run += 1
        try:
            await asyncio.wait_for(restart_requested.wait(),
                                   max(0, started_at + run * SOLUM_PAGE_FLIP_SECONDS - loop.time()))
        except asyncio.TimeoutError:
            continue
        restart_requested.clear()
        logger.info('[PAGE FLIP] restarted from page 1 (web loaded)')
        started_at = loop.time()
        run = 0
