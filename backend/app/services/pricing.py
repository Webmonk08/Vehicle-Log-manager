"""
Pricing Engine — calculates gross_rent based on rent_type and customer rate.
"""
from app.models.models import RentType


def calculate_rent(
    rent_type: RentType,
    quantity: float,
    customer: dict,
    manual_gross_rent: float | None = None,
    product: dict | None = None,
) -> float:
    """
    If product is provided, use its default_rate.
    Otherwise fall back to customer.default_rate_per_kg for KG.
    """
    # 1. Product-based pricing (highest priority)
    if product:
        # Use product's default rate if gross_rent not manually overridden
        rate = float(product.get("default_rate") or 0)
        if manual_gross_rent is not None and manual_gross_rent > 0:
            return round(manual_gross_rent, 2)
        return round(quantity * rate, 2)

    # 2. Manual/Legacy pricing
    if rent_type == RentType.KG:
        if not customer.get("default_rate_per_kg"):
            raise ValueError(
                f"Customer '{customer.get('name')}' has no default rate per KG. "
                "Set a rate first, select a product, or use Bulk/Unit pricing."
            )
        rate = float(customer["default_rate_per_kg"])
        if manual_gross_rent is not None and manual_gross_rent > 0:
            return round(manual_gross_rent, 2)
        return round(quantity * rate, 2)

    elif rent_type in (RentType.UNIT, RentType.BULK):
        if manual_gross_rent is None or manual_gross_rent <= 0:
            raise ValueError(
                f"{rent_type.value} rent requires a manual gross_rent value."
            )
        return round(manual_gross_rent, 2)

    raise ValueError(f"Unknown rent_type: {rent_type}")
