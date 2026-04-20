"""
Pricing Engine — calculates gross_rent based on rent_type and customer rate.
"""
from app.models.models import RentType


def calculate_rent(
    rent_type: RentType,
    quantity: float,
    customer: dict,
    manual_gross_rent: float | None = None,
) -> float:
    """
    KG:   gross_rent = quantity × customer.default_rate_per_kg
    Unit: gross_rent = manual entry (passed through)
    Bulk: gross_rent = manual entry (passed through)
    """
    if rent_type == RentType.KG:
        if not customer.get("default_rate_per_kg"):
            raise ValueError(
                f"Customer '{customer.get('name')}' has no default rate per KG. "
                "Set a rate first or use Bulk/Unit pricing."
            )
        return round(quantity * float(customer["default_rate_per_kg"]), 2)

    elif rent_type in (RentType.UNIT, RentType.BULK):
        if manual_gross_rent is None or manual_gross_rent <= 0:
            raise ValueError(
                f"{rent_type.value} rent requires a manual gross_rent value."
            )
        return round(manual_gross_rent, 2)

    raise ValueError(f"Unknown rent_type: {rent_type}")
