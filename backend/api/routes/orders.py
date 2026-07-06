from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from schemas import OrderCreate, OrderUpdate, OrderResponse, OrderListResponse, CallLogListResponse
from services import OrderService, WorkflowService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    order = OrderService.create(db, data)
    WorkflowService.start(order.id)
    db.refresh(order)
    return order


@router.get("", response_model=OrderListResponse)
def list_orders(db: Session = Depends(get_db)):
    orders = OrderService.get_all(db)
    return OrderListResponse(items=orders, total=len(orders))


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = OrderService.get_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found",
        )
    return order


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, data: OrderUpdate, db: Session = Depends(get_db)):
    order = OrderService.get_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found",
        )
    updated = OrderService.update(db, order, data)
    return updated


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = OrderService.get_by_id(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found",
        )
    OrderService.delete(db, order)
