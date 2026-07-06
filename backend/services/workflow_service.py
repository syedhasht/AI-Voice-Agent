"""
Workflow Service

Orchestrates the AI voice confirmation workflow for medication orders.

Lifecycle:
    Pending → Queued → (Retell API call) → Calling → (webhook) → Final

This service is pure orchestration — it delegates telephony to
RetellService and logging to CallLogService / TimelineEntry.
"""

import threading

from database.session import SessionLocal
from models.timeline import TimelineEntry
from services.order_service import OrderService
from services.call_log_service import CallLogService
from services.retell_service import create_outbound_call
from utils.status import OrderStatus
from utils.logger import get_logger

logger = get_logger(__name__)


class WorkflowService:
    """
    Lifecycle manager for the AI confirmation workflow.

    Flow:
        1. Transition Pending → Queued
        2. Call Retell API to create outbound call
        3. Store returned retell_call_id
        4. Transition Queued → Calling
        5. Background thread exits — webhook handles the rest
    """

    @staticmethod
    def start(order_id: int) -> None:
        """
        Start the confirmation workflow in a background thread.

        Returns immediately. Workflow runs asynchronously.
        The thread exits after initiating the Retell call; further
        updates arrive via Retell webhook at /api/webhooks/retell.
        """
        thread = threading.Thread(
            target=WorkflowService._run_workflow,
            args=(order_id,),
            daemon=True,
        )
        thread.start()

    @staticmethod
    def _run_workflow(order_id: int) -> None:
        """Open a fresh DB session and execute the workflow."""
        db = SessionLocal()
        try:
            WorkflowService._execute(db, order_id)
        except Exception:
            logger.exception("Workflow failed for order %s", order_id)
        finally:
            db.close()

    @staticmethod
    def _execute(db, order_id: int) -> None:
        """
        Execute the workflow lifecycle synchronously up to call initiation.

        After the Retell call is created, the thread exits. The webhook
        handler (api/routes/webhooks.py → retell_service.process_webhook)
        updates the order when Retell sends call_completed.
        """
        order = OrderService.get_by_id(db, order_id)
        if not order:
            logger.warning("Order %s not found — aborting workflow", order_id)
            return

        # ── Step 1: Pending → Queued ──────────────────────────────
        WorkflowService._transition(
            db, order, OrderStatus.QUEUED,
            "Order queued for AI voice call.",
            "queued",
        )

        # ── Step 2: Initiate Retell outbound call ──────────────────
        logger.info("Initiating Retell call for order %s", order.id)

        CallLogService.add_entry(
            db, order.id, "retell_request",
            "Requesting Retell AI to create outbound call.",
        )
        db.commit()

        call_id = create_outbound_call(order)

        if call_id:
            order.retell_call_id = call_id
            WorkflowService._transition(
                db, order, OrderStatus.CALLING,
                f"Retell AI call initiated — ID: {call_id}",
                "calling",
            )
            logger.info(
                "Retell call created — order=%s call_id=%s",
                order.id, call_id,
            )
        else:
            WorkflowService._transition(
                db, order, OrderStatus.NEED_HUMAN,
                "Failed to initiate Retell AI call. Manual intervention required.",
                "call_failed",
            )
            logger.error(
                "Failed to create Retell call for order %s — set to need_human",
                order.id,
            )

        # Thread exits here. Webhook handler processes async updates.

    @staticmethod
    def _transition(db, order, new_status: OrderStatus, message: str, log_step: str) -> None:
        """Transition order to a new status with logging."""
        order.status = new_status
        CallLogService.add_entry(db, order.id, log_step, message)
        entry = TimelineEntry(order_id=order.id, status=new_status.value, note=message)
        db.add(entry)
        db.commit()
