import enum

# ── Enums ──────────────────────────────────────────────────────────────────────

class TripStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"


class RentType(str, enum.Enum):
    KG = "KG"
    UNIT = "Unit"
    BULK = "Bulk"


class ExpenseType(str, enum.Enum):
    TAX = "Tax"
    OTHER = "Other"


class LedgerType(str, enum.Enum):
    DEBIT = "Debit"
    CREDIT = "Credit"
