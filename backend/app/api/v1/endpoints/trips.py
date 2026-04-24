from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import AsyncClient
from typing import List
import logging
from app.core.database import get_supabase
from app.models.models import TripStatus
from app.schemas.schemas import TripCreate, TripUpdate, TripResponse, TripCompleteRequest
from app.repositories import repo
from app.services.settlement import complete_trip, update_trip_after_completion

router = APIRouter(prefix="/trips", tags=["Trips"])
logger = logging.getLogger(__name__)

def prepare_trip_response(trip: dict) -> dict:
    """Inject convenience fields for the frontend."""
    if not trip:
        return trip
    
    # Inject driver_name and vehicle_plate at top level if nested objects exist
    if "driver" in trip and trip["driver"]:
        trip["driver_name"] = trip["driver"].get("name")
    if "vehicle" in trip and trip["vehicle"]:
        trip["vehicle_plate"] = trip["vehicle"].get("plate_number")
        
    # Inject customer_name and customer_id for each load
    if "loads" in trip and trip["loads"]:
        for load in trip["loads"]:
            if "customer" in load and load["customer"]:
                load["customer_name"] = load["customer"].get("name")
                load["customer_id"] = load["customer"].get("id")
    
    return trip

@router.get("", response_model=List[TripResponse])
async def list_trips(
    trip_status: TripStatus | None = Query(None, alias="status"),
    client: AsyncClient = Depends(get_supabase),
):
    trips_data = await repo.get_trips(client, trip_status)
    return [TripResponse.model_validate(prepare_trip_response(trip)) for trip in trips_data]


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(data: TripCreate, client: AsyncClient = Depends(get_supabase)):
    # Validate driver and vehicle exist
    if not await repo.get_driver(client, data.driver_id):
        raise HTTPException(status_code=404, detail="Driver not found")
    if not await repo.get_vehicle(client, data.vehicle_id):
        raise HTTPException(status_code=404, detail="Vehicle not found")

    trip = await repo.create_trip(client, **data.model_dump())
    return TripResponse.model_validate(prepare_trip_response(trip))


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(trip_id: str, client: AsyncClient = Depends(get_supabase)):
    trip = await repo.get_trip(client, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return TripResponse.model_validate(prepare_trip_response(trip))


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(trip_id: str, data: TripUpdate, client: AsyncClient = Depends(get_supabase)):
    trip = await repo.get_trip(client, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    update_data = data.model_dump(exclude_unset=True)
    
    if not update_data:
        # Nothing to update, return existing trip
        return TripResponse.model_validate(prepare_trip_response(trip))
    
    try:
        if trip.get("status") == TripStatus.COMPLETED.value:
            # For completed trips, handle financial adjustments
            updated_trip = await update_trip_after_completion(client, trip, update_data)
        else:
            # For active trips, simple update
            updated_trip = await repo.update_trip(client, trip["id"], **update_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update trip: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update trip: {str(e)}")
        
    return TripResponse.model_validate(prepare_trip_response(updated_trip))


@router.post("/{trip_id}/complete", response_model=TripResponse)
async def complete_trip_endpoint(
    trip_id: str,
    data: TripCompleteRequest,
    client: AsyncClient = Depends(get_supabase),
):
    trip = await repo.get_trip(client, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.get("status") == TripStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Trip is already completed")

    try:
        updated_trip = await complete_trip(
            client, trip,
            fuel_cost=data.fuel_cost,
            other_expenses=data.other_expenses,
            driver_charge=data.driver_charge,
            loading_comm=data.loading_comm,
            unloading_comm=data.unloading_comm,
            loading_chg=data.loading_chg,
            unloading_chg=data.unloading_chg,
        )
        return TripResponse.model_validate(prepare_trip_response(updated_trip))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to complete trip: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to complete trip: {str(e)}")


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(trip_id: str, client: AsyncClient = Depends(get_supabase)):
    trip = await repo.get_trip(client, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    await repo.delete_trip(client, trip_id)
    return None
