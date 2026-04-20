from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import AsyncClient

from app.core.database import get_supabase
from app.models import TripStatus
from app.schemas import TripCreate, TripUpdate, TripResponse, TripCompleteRequest, LoadResponse
from app.repositories import repo
from app.services.settlement import complete_trip

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.get("", response_model=list[TripResponse])
async def list_trips(
    trip_status: TripStatus | None = Query(None, alias="status"),
    client: AsyncClient = Depends(get_supabase),
):
    trips = await repo.get_trips(client, trip_status)
    result = []
    for trip in trips:
        trip_data = TripResponse.model_validate(trip)
        trip_data.driver_name = trip.get("driver", {}).get("name") if trip.get("driver") else None
        trip_data.vehicle_plate = trip.get("vehicle", {}).get("plate_number") if trip.get("vehicle") else None
        # Map loads
        trip_data.loads = []
        for load in trip.get("loads", []):
            load_resp = LoadResponse.model_validate(load)
            load_resp.customer_name = load.get("customer", {}).get("name") if load.get("customer") else None
            trip_data.loads.append(load_resp)
        result.append(trip_data)
    return result


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(data: TripCreate, client: AsyncClient = Depends(get_supabase)):
    # Validate driver and vehicle exist
    driver = await repo.get_driver(client, data.driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    vehicle = await repo.get_vehicle(client, data.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    trip = await repo.create_trip(client, **data.model_dump())
    trip_data = TripResponse.model_validate(trip)
    trip_data.driver_name = driver.get("name")
    trip_data.vehicle_plate = vehicle.get("plate_number")
    return trip_data


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(trip_id: str, client: AsyncClient = Depends(get_supabase)):
    trip = await repo.get_trip(client, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip_data = TripResponse.model_validate(trip)
    trip_data.driver_name = trip.get("driver", {}).get("name") if trip.get("driver") else None
    trip_data.vehicle_plate = trip.get("vehicle", {}).get("plate_number") if trip.get("vehicle") else None
    trip_data.loads = []
    for load in trip.get("loads", []):
        load_resp = LoadResponse.model_validate(load)
        load_resp.customer_name = load.get("customer", {}).get("name") if load.get("customer") else None
        trip_data.loads.append(load_resp)
    return trip_data


@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(trip_id: str, data: TripUpdate, client: AsyncClient = Depends(get_supabase)):
    trip = await repo.get_trip(client, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.get("status") == TripStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Cannot update a completed trip")
    updated = await repo.update_trip(client, trip["id"], **data.model_dump(exclude_unset=True))
    return TripResponse.model_validate(updated)


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
        completed = await complete_trip(
            client, trip,
            fuel_cost=data.fuel_cost,
            other_expenses=data.other_expenses,
            driver_charge=data.driver_charge,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Re-fetch to get fresh relationships
    trip = await repo.get_trip(client, trip_id)
    trip_data = TripResponse.model_validate(trip)
    trip_data.driver_name = trip.get("driver", {}).get("name") if trip.get("driver") else None
    trip_data.vehicle_plate = trip.get("vehicle", {}).get("plate_number") if trip.get("vehicle") else None
    trip_data.loads = []
    for load in trip.get("loads", []):
        load_resp = LoadResponse.model_validate(load)
        load_resp.customer_name = load.get("customer", {}).get("name") if load.get("customer") else None
        trip_data.loads.append(load_resp)
    return trip_data
