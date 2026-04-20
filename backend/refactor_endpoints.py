import os
import glob

directory = "app/api/v1/endpoints"
files = glob.glob(f"{directory}/*.py")

for file in files:
    with open(file, "r") as f:
        content = f.read()

    # Replace imports
    content = content.replace("from sqlalchemy.ext.asyncio import AsyncSession", "from supabase import AsyncClient")
    content = content.replace("from app.core.database import get_db", "from app.core.database import get_supabase")
    
    # Replace dependency injection
    content = content.replace("db: AsyncSession = Depends(get_db)", "client: AsyncClient = Depends(get_supabase)")
    
    # Replace all repo calls
    content = content.replace("repo.", "repo.") # Just to be sure, it stays repo.
    content = content.replace("(db", "(client")
    content = content.replace("(db,", "(client,")
    
    # Write back
    with open(file, "w") as f:
        f.write(content)
        
print("Replacement complete.")
